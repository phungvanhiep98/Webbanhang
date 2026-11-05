// Lưu đơn hàng.
// - Có biến DATABASE_URL (Postgres, vd Neon trên Vercel): dùng Postgres.
// - Không có: dùng file SQLite data/shop.db (chạy trên máy hoặc VPS).

export type OrderItem = {
  productId: string;
  name: string;
  variant?: string;
  price: number;
  qty: number;
  image?: string;
};

export type Order = {
  id: string;
  created_at: string; // ISO, giờ UTC
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon: string | null;
  shipping: number;
  total: number;
  payment_method: string;
  status: string;
  payment_ref: string | null;
};

type NewOrder = Omit<Order, "created_at" | "status" | "payment_ref">;
type Row = Record<string, unknown>;

export type Coupon = {
  code: string;
  kind: "percent" | "amount"; // giảm % hoặc giảm số tiền
  value: number;
  min_order: number;    // đơn tối thiểu (tạm tính), 0 = không yêu cầu
  max_discount: number; // giảm tối đa (cho loại %), 0 = không giới hạn
  max_uses: number;     // tổng lượt dùng, 0 = không giới hạn
  used: number;
  expires_at: string | null; // YYYY-MM-DD, hết hạn sau ngày này (giờ VN)
  active: boolean;
};

interface Store {
  insert(o: NewOrder): Promise<void>;
  get(id: string): Promise<Row | undefined>;
  list(): Promise<Row[]>;
  byPhone(phone: string): Promise<Row[]>;
  setStatus(id: string, status: string, ref: string | null): Promise<void>;
  coupons(): Promise<Row[]>;
  coupon(code: string): Promise<Row | undefined>;
  saveCoupon(c: Coupon): Promise<void>;
  deleteCoupon(code: string): Promise<void>;
  setCouponActive(code: string, active: boolean): Promise<void>;
  useCoupon(code: string): Promise<boolean>; // +1 lượt nếu còn lượt
}

const COUPON_COLS = "code, kind, value, min_order, max_discount, max_uses, expires_at, active";
const couponValues = (c: Coupon) => [c.code, c.kind, c.value, c.min_order, c.max_discount, c.max_uses, c.expires_at, c.active ? 1 : 0];
const COUPON_TABLE = `CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY, kind TEXT NOT NULL, value INTEGER NOT NULL, min_order INTEGER NOT NULL DEFAULT 0,
    max_discount INTEGER NOT NULL DEFAULT 0, max_uses INTEGER NOT NULL DEFAULT 0, used INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT, active INTEGER NOT NULL DEFAULT 1)`;

const COLS = "id, customer_name, phone, email, address, note, items, subtotal, shipping, total, payment_method, discount, coupon";
const values = (o: NewOrder) => [o.id, o.customer_name, o.phone, o.email, o.address, o.note, JSON.stringify(o.items), o.subtotal, o.shipping, o.total, o.payment_method, o.discount, o.coupon];

function postgresStore(url: string): Store {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false }, max: 3 });
  const ready = pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, address TEXT NOT NULL, note TEXT,
    items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL,
    payment_method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_ref TEXT)`)
    .then(() => pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0"))
    .then(() => pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon TEXT"))
    .then(() => pool.query(COUPON_TABLE));
  const q = async (sql: string, args: unknown[] = []) => { await ready; return (await pool.query(sql, args)).rows as Row[]; };
  return {
    insert: async (o) => { await q(`INSERT INTO orders (${COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, values(o)); },
    get: async (id) => (await q("SELECT * FROM orders WHERE id = $1", [id]))[0],
    list: () => q("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000"),
    byPhone: (phone) => q("SELECT * FROM orders WHERE phone = $1 ORDER BY created_at DESC LIMIT 20", [phone]),
    setStatus: async (id, s, ref) => { await q("UPDATE orders SET status = $1, payment_ref = COALESCE($2, payment_ref) WHERE id = $3", [s, ref, id]); },
    coupons: () => q("SELECT * FROM coupons ORDER BY code"),
    coupon: async (code) => (await q("SELECT * FROM coupons WHERE code = $1", [code]))[0],
    saveCoupon: async (c) => { await q(`INSERT INTO coupons (${COUPON_COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (code) DO UPDATE SET kind=$2, value=$3, min_order=$4, max_discount=$5, max_uses=$6, expires_at=$7, active=$8`, couponValues(c)); },
    deleteCoupon: async (code) => { await q("DELETE FROM coupons WHERE code = $1", [code]); },
    setCouponActive: async (code, a) => { await q("UPDATE coupons SET active = $1 WHERE code = $2", [a ? 1 : 0, code]); },
    useCoupon: async (code) => (await q("UPDATE coupons SET used = used + 1 WHERE code = $1 AND (max_uses = 0 OR used < max_uses) RETURNING code", [code])).length > 0,
  };
}

function sqliteStore(): Store {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // Nạp lúc chạy (không đóng gói), để build trên Vercel không cần thư viện này
  const nodeRequire = eval("require") as NodeRequire;
  const Database = nodeRequire("better-sqlite3") as typeof import("better-sqlite3");
  const path = require("path") as typeof import("path");
  const fs = require("fs") as typeof import("fs");
  /* eslint-enable @typescript-eslint/no-require-imports */
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new Database(path.join(dir, "shop.db"));
  db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, address TEXT NOT NULL, note TEXT,
    items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL,
    payment_method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_ref TEXT)`);
  for (const col of ["discount INTEGER NOT NULL DEFAULT 0", "coupon TEXT"]) {
    try { db.exec(`ALTER TABLE orders ADD COLUMN ${col}`); } catch { /* đã có cột */ }
  }
  db.exec(COUPON_TABLE);
  return {
    insert: async (o) => { db.prepare(`INSERT INTO orders (${COLS}) VALUES (${values(o).map(() => "?").join(",")})`).run(...values(o)); },
    get: async (id) => db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined,
    list: async () => db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000").all() as Row[],
    byPhone: async (phone) => db.prepare("SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT 20").all(phone) as Row[],
    setStatus: async (id, s, ref) => { db.prepare("UPDATE orders SET status = ?, payment_ref = COALESCE(?, payment_ref) WHERE id = ?").run(s, ref, id); },
    coupons: async () => db.prepare("SELECT * FROM coupons ORDER BY code").all() as Row[],
    coupon: async (code) => db.prepare("SELECT * FROM coupons WHERE code = ?").get(code) as Row | undefined,
    saveCoupon: async (c) => { db.prepare(`INSERT INTO coupons (${COUPON_COLS}) VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT (code) DO UPDATE SET kind=excluded.kind, value=excluded.value, min_order=excluded.min_order, max_discount=excluded.max_discount,
      max_uses=excluded.max_uses, expires_at=excluded.expires_at, active=excluded.active`).run(...couponValues(c)); },
    deleteCoupon: async (code) => { db.prepare("DELETE FROM coupons WHERE code = ?").run(code); },
    setCouponActive: async (code, a) => { db.prepare("UPDATE coupons SET active = ? WHERE code = ?").run(a ? 1 : 0, code); },
    useCoupon: async (code) => db.prepare("UPDATE coupons SET used = used + 1 WHERE code = ? AND (max_uses = 0 OR used < max_uses)").run(code).changes > 0,
  };
}

const g = globalThis as unknown as { __store?: Store };
function store() {
  if (!g.__store) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    g.__store = url ? postgresStore(url) : sqliteStore();
  }
  return g.__store;
}

const parse = (r: Row | undefined): Order | undefined =>
  r ? ({ ...r, created_at: new Date(r.created_at as string).toISOString(), items: JSON.parse(r.items as string), subtotal: Number(r.subtotal), discount: Number(r.discount ?? 0), coupon: (r.coupon as string) ?? null, shipping: Number(r.shipping), total: Number(r.total) } as Order) : undefined;

const parseCoupon = (r: Row | undefined): Coupon | undefined =>
  r ? { code: String(r.code), kind: r.kind === "amount" ? "amount" : "percent", value: Number(r.value), min_order: Number(r.min_order),
    max_discount: Number(r.max_discount), max_uses: Number(r.max_uses), used: Number(r.used), expires_at: (r.expires_at as string) || null, active: Number(r.active) === 1 } : undefined;

export const listCoupons = async () => (await store().coupons()).map((r) => parseCoupon(r)!);
export const getCoupon = async (code: string) => parseCoupon(await store().coupon(code.trim().toUpperCase()));
export const saveCoupon = (c: Coupon) => store().saveCoupon(c);
export const deleteCoupon = (code: string) => store().deleteCoupon(code);
export const setCouponActive = (code: string, active: boolean) => store().setCouponActive(code, active);
export const useCoupon = (code: string) => store().useCoupon(code);

export const insertOrder = (o: NewOrder) => store().insert(o);
export const getOrder = async (id: string) => parse(await store().get(id));
export const listOrders = async () => (await store().list()).map((r) => parse(r)!);
export const ordersByPhone = async (phone: string) => (await store().byPhone(phone)).map((r) => parse(r)!);
export const setStatus = (id: string, status: string, paymentRef?: string) => store().setStatus(id, status, paymentRef ?? null);

export function newOrderId() {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `DH${ymd}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
