import { NextResponse } from "next/server";
import {
  STORY_QUALITIES,
  STORY_STYLES,
  type GeneratedImageSize,
  type StoryQuality,
  type StoryStyle,
} from "@/lib/types/storybook";
import {
  ImageGenerationRequestError,
  ImageGenerationResponseError,
  generateAndStoreImage,
} from "@/lib/storybook/image-generator";
import { buildCoverPrompt, buildScenePrompt } from "@/lib/storybook/prompts";
import { storybookErrorResponse } from "@/lib/storybook/api-errors";
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

function imageSizeForQuality(quality: StoryQuality): GeneratedImageSize {
  if (quality === "fast") return "1K";
  if (quality === "high") return "4K";
  return "2K";
}

function optionalImageUrl(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > 500) {
    throw new StoryPlannerResponseError(`Invalid ${field} image URL.`);
  }
  return value;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isRecord(body) || typeof body.story !== "string") {
    return NextResponse.json({ error: 'Request body must include a "story" string.' }, { status: 400 });
  }
  const story = body.story.trim();
  if (!story || story.length > 20_000) {
    return NextResponse.json({ error: "Story must contain between 1 and 20,000 characters." }, { status: 400 });
  }
  if (body.kind !== "cover" && body.kind !== "scene") {
    return NextResponse.json({ error: 'kind must be "scene" or "cover".' }, { status: 400 });
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

  let characters;
  let characterReferenceUrl: string | undefined;
  let previousSceneUrl: string | undefined;
  try {
    characters = validateCharacterBible(body.characters);
    characterReferenceUrl = optionalImageUrl(body.characterReferenceUrl, "character reference");
    previousSceneUrl = optionalImageUrl(body.previousSceneUrl, "previous scene");
  } catch (error) {
    if (error instanceof StoryPlannerResponseError) return storybookErrorResponse(error);
    return storybookErrorResponse(error);
  }
  if (!characterReferenceUrl) {
    return NextResponse.json({ error: "A generated character reference image is required." }, { status: 400 });
  }

  const references = [
    { url: characterReferenceUrl, label: "character reference" },
    ...(previousSceneUrl ? [{ url: previousSceneUrl, label: "previous scene" }] : []),
  ];

  try {
    if (body.kind === "cover") {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120) {
        return NextResponse.json({ error: "A cover title of 1 to 120 characters is required." }, { status: 400 });
      }
      const prompt = buildCoverPrompt(story, body.title.trim(), characters, style);
      const imageUrl = await generateAndStoreImage(prompt, "2K", references.slice(0, 1));
      return NextResponse.json({ imageUrl });
    }

    if (typeof body.scene !== "object" || body.scene === null) {
      return NextResponse.json({ error: "A valid scene plan is required." }, { status: 400 });
    }
    const scene = validatePlannedScene(body.scene, characters);
    const previousScene =
      body.previousScene && typeof body.previousScene === "object"
        ? validatePlannedScene(body.previousScene, characters)
        : undefined;
    const prompt = buildScenePrompt({
      story,
      characterBible: characters,
      scene,
      style,
      visualStyle: isRecord(body.visualStyle) ? {
        style,
        lighting: typeof body.visualStyle.lighting === "string" ? body.visualStyle.lighting.slice(0, 200) : "",
        colorPalette: typeof body.visualStyle.colorPalette === "string" ? body.visualStyle.colorPalette.slice(0, 200) : "",
        detailLevel: typeof body.visualStyle.detailLevel === "string" ? body.visualStyle.detailLevel.slice(0, 100) : "",
      } : undefined,
      ...(previousScene ? { previousScene } : {}),
    });
    const imageUrl = await generateAndStoreImage(prompt, imageSizeForQuality(quality), references);
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
