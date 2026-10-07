import { NextResponse } from "next/server";
import {
  ImageGenerationRequestError,
  ImageGenerationResponseError,
  generateAndStoreImage,
} from "@/lib/storybook/image-generator";
import { buildScenePrompt } from "@/lib/storybook/prompts";
import { storybookErrorResponse } from "@/lib/storybook/api-errors";
import { STORY_QUALITIES, STORY_STYLES, type StoryQuality, type StoryStyle } from "@/lib/types/storybook";
import {
  StoryPlannerResponseError,
  validateCharacterBible,
  validatePlannedScene,
} from "@/lib/storybook/story-planner";

export const runtime = "nodejs";
export const maxDuration = 60;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    typeof body.story !== "string" ||
    typeof body.instruction !== "string" ||
    typeof body.imageUrl !== "string" ||
    typeof body.scene !== "object" ||
    body.scene === null
  ) {
    return NextResponse.json({ error: "Story, scene, image URL, and edit instruction are required." }, { status: 400 });
  }
  const story = body.story.trim();
  const instruction = body.instruction.trim();
  if (!story || story.length > 20_000) {
    return NextResponse.json({ error: "Story must contain between 1 and 20,000 characters." }, { status: 400 });
  }
  if (!instruction || instruction.length > 1000) {
    return NextResponse.json({ error: "Edit instruction must contain between 1 and 1,000 characters." }, { status: 400 });
  }
  if (body.imageUrl.length > 500) {
    return NextResponse.json({ error: "Scene image URL is too long." }, { status: 400 });
  }
  if (typeof body.characterReferenceUrl !== "string" || body.characterReferenceUrl.length > 500) {
    return NextResponse.json({ error: "A generated character reference image is required." }, { status: 400 });
  }

  const style: StoryStyle = STORY_STYLES.includes(body.style as StoryStyle)
    ? (body.style as StoryStyle)
    : "3D Cartoon";
  const quality: StoryQuality = STORY_QUALITIES.includes(body.quality as StoryQuality)
    ? (body.quality as StoryQuality)
    : "standard";
  if (body.style !== undefined && !STORY_STYLES.includes(body.style as StoryStyle)) {
    return NextResponse.json({ error: "Select one of the supported illustration styles." }, { status: 400 });
  }
  if (body.quality !== undefined && !STORY_QUALITIES.includes(body.quality as StoryQuality)) {
    return NextResponse.json({ error: "Select one of the supported image qualities." }, { status: 400 });
  }

  try {
    const characters = validateCharacterBible(body.characters);
    const scene = validatePlannedScene(body.scene, characters);
    const prompt = buildScenePrompt({
      story,
      characterBible: characters,
      scene,
      style,
      visualStyle:
        typeof body.visualStyle === "object" && body.visualStyle !== null
          ? {
              style,
              lighting:
                "lighting" in body.visualStyle && typeof body.visualStyle.lighting === "string"
                  ? body.visualStyle.lighting.slice(0, 200)
                  : "",
              colorPalette:
                "colorPalette" in body.visualStyle && typeof body.visualStyle.colorPalette === "string"
                  ? body.visualStyle.colorPalette.slice(0, 200)
                  : "",
              detailLevel:
                "detailLevel" in body.visualStyle && typeof body.visualStyle.detailLevel === "string"
                  ? body.visualStyle.detailLevel.slice(0, 100)
                  : "",
            }
          : undefined,
      editInstruction: instruction,
    });
    const imageSize = quality === "fast" ? "1K" : quality === "high" ? "4K" : "2K";
    const imageUrl = await generateAndStoreImage(prompt, imageSize, [
      { url: body.imageUrl, label: "current scene" },
      { url: body.characterReferenceUrl, label: "character reference" },
    ]);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (
      error instanceof StoryPlannerResponseError ||
      error instanceof ImageGenerationRequestError ||
      error instanceof ImageGenerationResponseError
    ) {
      return storybookErrorResponse(error);
    }
    return storybookErrorResponse(error);
  }
}
