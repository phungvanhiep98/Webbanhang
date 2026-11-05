import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// SQLite cho chạy thử. Khi đưa lên hosting (Vercel...), đổi sang Postgres.
const dir = path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });

const g = globalThis as unknown as { __db?: Database.Database };
export const db = g.__db ?? new Database(path.join(dir, "shop.db"));
g.__db = db;

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  note TEXT,
  items TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_ref TEXT
);
`);

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
  created_at: string;
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

type Row = Omit<Order, "items"> & { items: string };
const parse = (r: Row | undefined): Order | undefined =>
  r ? { ...r, items: JSON.parse(r.items) } : undefined;

export function insertOrder(o: Omit<Order, "created_at" | "status" | "payment_ref">) {
  db.prepare(
    `INSERT INTO orders (id, customer_name, phone, email, address, note, items, subtotal, shipping, total, payment_method)
     VALUES (@id, @customer_name, @phone, @email, @address, @note, @items, @subtotal, @shipping, @total, @payment_method)`
  ).run({ ...o, items: JSON.stringify(o.items) });
}

export function getOrder(id: string) {
  return parse(db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined);
}

export function listOrders() {
  return (db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as Row[]).map(
    (r) => parse(r)!
  );
}

export function setStatus(id: string, status: string, paymentRef?: string) {
  db.prepare(
    "UPDATE orders SET status = ?, payment_ref = COALESCE(?, payment_ref) WHERE id = ?"
  ).run(status, paymentRef ?? null, id);
}

export function newOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DH${ymd}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
