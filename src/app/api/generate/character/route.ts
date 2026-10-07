import { NextResponse } from "next/server";
import { STORY_STYLES, type StoryStyle } from "@/lib/types/storybook";
import {
  ImageGenerationRequestError,
  ImageGenerationResponseError,
  generateAndStoreImage,
} from "@/lib/storybook/image-generator";
import { buildCharacterReferencePrompt } from "@/lib/storybook/prompts";
import { storybookErrorResponse } from "@/lib/storybook/api-errors";
import {
  StoryPlannerResponseError,
  validateCharacterBible,
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
  if (!isRecord(body) || typeof body.story !== "string") {
    return NextResponse.json({ error: 'Request body must include a "story" string.' }, { status: 400 });
  }
  const story = body.story.trim();
  if (!story || story.length > 20_000) {
    return NextResponse.json({ error: "Story must contain between 1 and 20,000 characters." }, { status: 400 });
  }
  if (body.style !== undefined && !STORY_STYLES.includes(body.style as StoryStyle)) {
    return NextResponse.json({ error: "Select one of the supported illustration styles." }, { status: 400 });
  }
  const style: StoryStyle = body.style === undefined ? "3D Cartoon" : body.style as StoryStyle;

  let characters;
  try {
    characters = validateCharacterBible(body.characters);
  } catch (error) {
    if (error instanceof StoryPlannerResponseError) {
      return storybookErrorResponse(error);
    }
    return storybookErrorResponse(error);
  }

  try {
    const prompt = buildCharacterReferencePrompt(story, characters, style);
    const imageUrl = await generateAndStoreImage(prompt, "1K");
    return NextResponse.json({ imageUrl });
  } catch (error) {
    if (error instanceof ImageGenerationRequestError || error instanceof ImageGenerationResponseError) {
      return storybookErrorResponse(error);
    }
    return storybookErrorResponse(error);
  }
}
