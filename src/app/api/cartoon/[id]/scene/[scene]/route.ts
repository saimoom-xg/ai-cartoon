import { NextResponse } from "next/server";
import { updateSceneInCartoon, deleteSceneFromCartoon } from "@/lib/storage/cartoons";
import type { CartoonScene } from "@/lib/types/cartoon";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; scene: string }> },
) {
  const { id, scene } = await params;
  const sceneNum = parseInt(scene, 10);
  if (isNaN(sceneNum)) {
    return NextResponse.json({ error: "Invalid scene number" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = updateSceneInCartoon(id, sceneNum, body as Partial<CartoonScene>);
  if (!updated) {
    return NextResponse.json({ error: "Cartoon or scene not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; scene: string }> },
) {
  const { id, scene } = await params;
  const sceneNum = parseInt(scene, 10);
  if (isNaN(sceneNum)) {
    return NextResponse.json({ error: "Invalid scene number" }, { status: 400 });
  }

  const updated = deleteSceneFromCartoon(id, sceneNum);
  if (!updated) {
    return NextResponse.json({ error: "Cartoon not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
