import { cookies } from "next/headers";
import crypto from "crypto";

const token = () =>
  crypto.createHash("sha256").update("admin:" + (process.env.ADMIN_PASSWORD ?? "")).digest("hex");

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  return (await cookies()).get("admin")?.value === token();
}

export async function loginAdmin(password: string) {
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return false;
  (await cookies()).set("admin", token(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return true;
}
