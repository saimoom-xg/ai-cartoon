import { NextResponse } from "next/server";
import { ASSETS_BY_ID } from "@/lib/assets/library";
import type { CartoonScene, CartoonElement } from "@/lib/types/cartoon";

export const runtime = "nodejs";

const BACKGROUNDS = ["park", "house", "school", "street"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { scene, sceneNumber, context } = (body || {}) as {
    scene?: CartoonScene;
    sceneNumber?: number;
    context?: string;
  };

  const num = sceneNumber || scene?.sceneNumber || 1;

  // Pick a sensible background (cycling or keeping)
  const bg = scene?.background && ASSETS_BY_ID.has(scene.background)
    ? scene.background
    : BACKGROUNDS[num % BACKGROUNDS.length];

  // Variations in character placement and actions
  const actions = ["playing", "waving", "exploring", "laughing", "walking", "talking"];
  const randAction = actions[Math.floor(Math.random() * actions.length)];

  // Retain existing characters if possible or default to boy
  const existingChars = scene?.elements.filter((e) => e.type === "character") || [];
  const charId = existingChars.length > 0 ? existingChars[0].asset : "boy";

  const newElements: CartoonElement[] = [
    {
      asset: charId,
      type: "character",
      action: randAction,
      x: 240 + Math.floor(Math.random() * 80),
      y: 260,
      scale: 0.65,
      flipX: Math.random() > 0.5,
    },
  ];

  // If there was a second character, keep them
  if (existingChars.length > 1) {
    newElements.push({
      asset: existingChars[1].asset,
      type: "character",
      action: "talking",
      x: 580 + Math.floor(Math.random() * 60),
      y: 260,
      scale: 0.65,
      flipX: true,
    });
  }

  // Add scenic object based on background
  if (bg === "park") {
    newElements.unshift({
      asset: "tree",
      type: "object",
      action: "scenery",
      x: 780,
      y: 170,
      scale: 0.72,
    });
    newElements.push({
      asset: "football",
      type: "object",
      action: "present",
      x: 460 + Math.floor(Math.random() * 60),
      y: 410,
      scale: 0.45,
    });
  } else if (bg === "street") {
    newElements.push({
      asset: "red-car",
      type: "vehicle",
      action: "driving",
      x: 590,
      y: 310,
      scale: 0.65,
    });
  }

  // Preserve or generate dialogue
  const speakerName = ASSETS_BY_ID.get(charId)?.name || "Boy";
  const dialogue = scene?.dialogue && scene.dialogue.length > 0
    ? scene.dialogue
    : [
        {
          speaker: speakerName,
          text: context ? `Look at that! ${context}` : "Let's explore here!",
          x: 230,
          y: 120,
        },
      ];

  const regenerated: CartoonScene = {
    sceneNumber: num,
    background: bg,
    elements: newElements,
    dialogue,
  };

  return NextResponse.json(regenerated);
}
