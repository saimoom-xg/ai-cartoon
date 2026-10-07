import { NextResponse } from "next/server";
import {
  ImageGenerationConfigurationError,
  ImageGenerationRequestError,
  ImageGenerationResponseError,
  ImageStorageConfigurationError,
} from "./image-generator";
import {
  StoryPlannerConfigurationError,
  StoryPlannerRequestError,
  StoryPlannerResponseError,
} from "./story-planner";

export function storybookErrorResponse(error: unknown): Response {
  if (
    error instanceof StoryPlannerConfigurationError ||
    error instanceof ImageGenerationConfigurationError ||
    error instanceof ImageStorageConfigurationError
  ) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof StoryPlannerResponseError || error instanceof ImageGenerationResponseError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  if (error instanceof StoryPlannerRequestError || error instanceof ImageGenerationRequestError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  console.error("Unexpected storybook generation failure.", error);
  return NextResponse.json(
    { error: "An unexpected error prevented storybook generation. Please retry." },
    { status: 500 },
  );
}
