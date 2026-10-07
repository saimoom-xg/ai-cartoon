import assert from "node:assert/strict";
import { test } from "node:test";
import {
  imageGenerationRequestFailure,
  imageGenerationResponseFailure,
} from "./image-errors.ts";

test("explains Gemini image request failures by HTTP status", () => {
  assert.match(imageGenerationRequestFailure({ status: 403 }), /API key|access/);
  assert.match(imageGenerationRequestFailure({ status: 404 }), /GEMINI_IMAGE_MODEL/);
  assert.match(imageGenerationRequestFailure({ status: 429 }), /quota|rate limit/);
  assert.match(imageGenerationRequestFailure({ status: 400 }), /supports image generation/);
  assert.match(imageGenerationRequestFailure(new Error("network error")), /network access/);
});

test("explains image-generation interaction errors without returning raw provider details", () => {
  assert.match(
    imageGenerationResponseFailure([{ message: "RESOURCE_EXHAUSTED: quota exceeded" }]),
    /quota|rate limit/,
  );
  assert.match(
    imageGenerationResponseFailure([{ message: "The model was blocked by safety policy" }]),
    /blocked.*Adjust/,
  );
  assert.match(
    imageGenerationResponseFailure([{ message: "private diagnostic text" }]),
    /Check GEMINI_IMAGE_MODEL/,
  );
});
