import type { GeneratedCartoon, CartoonScene } from "../types/cartoon.ts";

const memoryCartoons = new Map<string, GeneratedCartoon>();

export function saveCartoon(cartoon: GeneratedCartoon): GeneratedCartoon {
  const id = cartoon.id || `cartoon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const saved: GeneratedCartoon = {
    ...cartoon,
    id,
    totalScenes: cartoon.scenes.length,
  };
  memoryCartoons.set(id, saved);
  return saved;
}

export function getCartoon(id: string): GeneratedCartoon | null {
  return memoryCartoons.get(id) || null;
}

export function updateCartoon(id: string, updates: Partial<GeneratedCartoon>): GeneratedCartoon | null {
  const existing = memoryCartoons.get(id);
  if (!existing) return null;
  const updated: GeneratedCartoon = {
    ...existing,
    ...updates,
    id,
    scenes: updates.scenes || existing.scenes,
    totalScenes: (updates.scenes || existing.scenes).length,
  };
  memoryCartoons.set(id, updated);
  return updated;
}

export function addSceneToCartoon(id: string, scene: Omit<CartoonScene, "sceneNumber">): GeneratedCartoon | null {
  const existing = memoryCartoons.get(id);
  if (!existing) return null;
  const newSceneNumber = existing.scenes.length + 1;
  const newScene: CartoonScene = {
    ...scene,
    sceneNumber: newSceneNumber,
  };
  const updatedScenes = [...existing.scenes, newScene];
  return updateCartoon(id, { scenes: updatedScenes });
}

export function updateSceneInCartoon(id: string, sceneNumber: number, sceneUpdate: Partial<CartoonScene>): GeneratedCartoon | null {
  const existing = memoryCartoons.get(id);
  if (!existing) return null;
  const sceneIdx = existing.scenes.findIndex((s) => s.sceneNumber === sceneNumber);
  if (sceneIdx === -1) return null;

  const updatedScenes = [...existing.scenes];
  updatedScenes[sceneIdx] = {
    ...updatedScenes[sceneIdx],
    ...sceneUpdate,
    sceneNumber,
  };
  return updateCartoon(id, { scenes: updatedScenes });
}

export function deleteSceneFromCartoon(id: string, sceneNumber: number): GeneratedCartoon | null {
  const existing = memoryCartoons.get(id);
  if (!existing) return null;
  const filtered = existing.scenes
    .filter((s) => s.sceneNumber !== sceneNumber)
    .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
  return updateCartoon(id, { scenes: filtered });
}
