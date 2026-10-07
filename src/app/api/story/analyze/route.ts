import { NextResponse } from "next/server";
import {
  STORY_STYLES,
  type StoryStyle,
} from "@/lib/types/storybook";
import {
  planStory,
  StoryPlannerRequestError,
  StoryPlannerResponseError,
} from "@/lib/storybook/story-planner";
import { storybookErrorResponse } from "@/lib/storybook/api-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_STORY_LENGTH = 20_000;

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
  if (!story) return NextResponse.json({ error: "Please enter a story." }, { status: 400 });
  if (story.length > MAX_STORY_LENGTH) {
    return NextResponse.json({ error: `Story must be ${MAX_STORY_LENGTH} characters or fewer.` }, { status: 413 });
  }

  if (body.style !== undefined && !STORY_STYLES.includes(body.style as StoryStyle)) {
    return NextResponse.json({ error: "Select one of the supported illustration styles." }, { status: 400 });
  }
  const style: StoryStyle = body.style === undefined ? "3D Cartoon" : body.style as StoryStyle;
  const sceneCount = body.sceneCount === undefined ? "auto" : body.sceneCount;
  if (
    sceneCount !== "auto" &&
    (typeof sceneCount !== "number" || !Number.isInteger(sceneCount) || sceneCount < 1 || sceneCount > 10)
  ) {
    return NextResponse.json({ error: 'sceneCount must be "auto" or an integer from 1 to 10.' }, { status: 400 });
  }

  try {
    const plan = await planStory(story, style, sceneCount);
    return NextResponse.json({ plan });
  } catch (error) {
    if (
      error instanceof StoryPlannerRequestError ||
      error instanceof StoryPlannerResponseError
    ) {
      return storybookErrorResponse(error);
    }
    return storybookErrorResponse(error);
  }
}
