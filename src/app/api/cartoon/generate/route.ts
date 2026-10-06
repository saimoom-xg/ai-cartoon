import { NextResponse } from "next/server";
import {
  generateCartoonFromStory,
  StoryProviderConfigurationError,
  StoryProviderRequestError,
  StoryProviderResponseError,
} from "@/lib/ai/generate-cartoon";
import { generateDeterministicCartoon } from "@/lib/ai/deterministic-generator";
import { saveCartoon } from "@/lib/storage/cartoons";

export const runtime = "nodejs";

const MAX_STORY_LENGTH = 20_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("story" in body) ||
    typeof (body as Record<string, unknown>).story !== "string"
  ) {
    return NextResponse.json(
      { error: 'Request body must include a "story" string.' },
      { status: 400 },
    );
  }

  const payload = body as { story: string; mode?: "ai" | "deterministic" };
  const story = payload.story.trim();
  if (!story) {
    return NextResponse.json({ error: "Please enter a story." }, { status: 400 });
  }

  if (story.length > MAX_STORY_LENGTH) {
    return NextResponse.json(
      { error: `Story must be ${MAX_STORY_LENGTH} characters or fewer.` },
      { status: 413 },
    );
  }

  if (payload.mode === "deterministic") {
    const cartoon = generateDeterministicCartoon(story);
    const saved = saveCartoon(cartoon);
    return NextResponse.json(saved);
  }

  try {
    const cartoon = await generateCartoonFromStory(story);
    const saved = saveCartoon({ ...cartoon, originalStory: story });
    return NextResponse.json(saved);
  } catch (error) {
    console.warn("AI generation failed; falling back to deterministic scene generator:", error);
    try {
      const fallbackCartoon = generateDeterministicCartoon(story);
      const saved = saveCartoon({ ...fallbackCartoon, originalStory: story });
      return NextResponse.json(saved);
    } catch {
      if (error instanceof StoryProviderConfigurationError) {
        return NextResponse.json(
          {
            error:
              "Story generation is not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY on the server.",
          },
          { status: 503 },
        );
      }

      if (
        error instanceof StoryProviderResponseError ||
        error instanceof StoryProviderRequestError
      ) {
        return NextResponse.json(
          { error: "AI providers could not generate valid scene data. Please try again." },
          { status: 502 },
        );
      }

      console.error("Unexpected cartoon generation failure.");
      return NextResponse.json(
        { error: "An unexpected error prevented story generation." },
        { status: 500 },
      );
    }
  }
}
