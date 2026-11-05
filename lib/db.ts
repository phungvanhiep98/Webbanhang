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
  shipping: number;
  total: number;
  payment_method: string;
  status: string;
  payment_ref: string | null;
};

type NewOrder = Omit<Order, "created_at" | "status" | "payment_ref">;
type Row = Record<string, unknown>;

interface Store {
  insert(o: NewOrder): Promise<void>;
  get(id: string): Promise<Row | undefined>;
  list(): Promise<Row[]>;
  setStatus(id: string, status: string, ref: string | null): Promise<void>;
}

const COLS = "id, customer_name, phone, email, address, note, items, subtotal, shipping, total, payment_method";
const values = (o: NewOrder) => [o.id, o.customer_name, o.phone, o.email, o.address, o.note, JSON.stringify(o.items), o.subtotal, o.shipping, o.total, o.payment_method];

function postgresStore(url: string): Store {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg") as typeof import("pg");
  const pool = new Pool({ connectionString: url, ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false }, max: 3 });
  const ready = pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    customer_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, address TEXT NOT NULL, note TEXT,
    items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL,
    payment_method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_ref TEXT)`);
  const q = async (sql: string, args: unknown[] = []) => { await ready; return (await pool.query(sql, args)).rows as Row[]; };
  return {
    insert: async (o) => { await q(`INSERT INTO orders (${COLS}) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, values(o)); },
    get: async (id) => (await q("SELECT * FROM orders WHERE id = $1", [id]))[0],
    list: () => q("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000"),
    setStatus: async (id, s, ref) => { await q("UPDATE orders SET status = $1, payment_ref = COALESCE($2, payment_ref) WHERE id = $3", [s, ref, id]); },
  };
}

function sqliteStore(): Store {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
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
  return {
    insert: async (o) => { db.prepare(`INSERT INTO orders (${COLS}) VALUES (${values(o).map(() => "?").join(",")})`).run(...values(o)); },
    get: async (id) => db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined,
    list: async () => db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000").all() as Row[],
    setStatus: async (id, s, ref) => { db.prepare("UPDATE orders SET status = ?, payment_ref = COALESCE(?, payment_ref) WHERE id = ?").run(s, ref, id); },
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
  r ? ({ ...r, created_at: new Date(r.created_at as string).toISOString(), items: JSON.parse(r.items as string), subtotal: Number(r.subtotal), shipping: Number(r.shipping), total: Number(r.total) } as Order) : undefined;

export const insertOrder = (o: NewOrder) => store().insert(o);
export const getOrder = async (id: string) => parse(await store().get(id));
export const listOrders = async () => (await store().list()).map((r) => parse(r)!);
export const setStatus = (id: string, status: string, paymentRef?: string) => store().setStatus(id, status, paymentRef ?? null);

export function newOrderId() {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `DH${ymd}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
