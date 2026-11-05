import { NextResponse } from "next/server";
import { getOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  return NextResponse.json({ status: order?.status ?? null });
}
