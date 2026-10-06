import { NextResponse } from "next/server";
import { addSceneToCartoon } from "@/lib/storage/cartoons";
import type { CartoonScene } from "@/lib/types/cartoon";

export const runtime = "nodejs";

export async function POST(
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

  const scenePayload = body as Omit<CartoonScene, "sceneNumber">;
  const updated = addSceneToCartoon(id, scenePayload);
  if (!updated) {
    return NextResponse.json({ error: "Cartoon not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
