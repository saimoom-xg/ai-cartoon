import { NextResponse } from "next/server";
import { getCartoon, updateCartoon } from "@/lib/storage/cartoons";
import type { GeneratedCartoon } from "@/lib/types/cartoon";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cartoon = getCartoon(id);
  if (!cartoon) {
    return NextResponse.json({ error: "Cartoon not found" }, { status: 404 });
  }
  return NextResponse.json(cartoon);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = updateCartoon(id, body as Partial<GeneratedCartoon>);
  if (!updated) {
    return NextResponse.json({ error: "Cartoon not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
