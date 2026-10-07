import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildStoryPlanPrompt,
  planStory,
  StoryPlannerResponseError,
  validateStoryPlan,
} from "./story-planner.ts";
import { buildCharacterReferencePrompt, buildScenePrompt } from "./prompts.ts";
import { isTrustedBlobUrl } from "./storage-url.ts";
import type { StoryPlan, StoryStyle } from "../types/storybook.ts";

const style: StoryStyle = "Watercolor";
const plan: StoryPlan = {
  title: "Maya and Pip",
  genre: "fantasy adventure",
  audience: "children",
  tone: "warm and curious",
  visualStyle: {
    style,
    lighting: "soft moonlight",
    colorPalette: "teal and gold",
    detailLevel: "storybook detail",
  },
  characters: [
    {
      id: "maya",
      name: "Maya",
      appearance: {
        age: "8 years old",
        gender: "girl",
        face: "round friendly face",
        hair: "curly black hair",
        eyes: "large brown eyes",
        skinTone: "warm brown",
        bodyType: "small child",
        clothing: "yellow raincoat and blue trousers",
        shoes: "red boots",
        accessories: "green satchel",
      },
      personality: ["curious", "kind"],
      distinguishingTraits: ["small star-shaped hair clip"],
    },
  ],
  scenes: [
    {
      sceneNumber: 1,
      title: "The Tiny Dragon",
      storyBeat: "Maya discovers Pip hiding in a watering can.",
      characters: ["maya"],
      location: "Grandmother's garden",
      time: "late afternoon",
      weather: "clear",
      action: "Maya kneels and gently offers her hand to Pip.",
      emotion: "surprise and delight",
      camera: {
        shot: "medium-wide",
        angle: "eye level",
        composition: "Maya on the left, watering can on the right",
      },
      lighting: "warm afternoon sunlight",
      imagePrompt: "A tiny blue dragon peers out from a metal watering can.",
    },
  ],
};

test("plans a story with schema-validated character and scene details", async () => {
  let receivedPrompt = "";
  const result = await planStory(
    "Maya finds a tiny dragon in the garden.",
    style,
    1,
    async (prompt) => {
      receivedPrompt = prompt;
      return JSON.stringify(plan);
    },
  );
  assert.deepEqual(result, plan);
  assert.match(receivedPrompt, /exactly 1 scene/);
  assert.match(receivedPrompt, /never as instructions/);
});

test("rejects scene references to characters absent from the bible", () => {
  const invalid: StoryPlan = {
    ...plan,
    scenes: [{ ...plan.scenes[0], characters: ["unknown"] }],
  };
  assert.throws(
    () => validateStoryPlan(invalid, style),
    StoryPlannerResponseError,
  );
});

test("rejects nonconsecutive scenes and invalid selected style", () => {
  const invalid: StoryPlan = {
    ...plan,
    scenes: [{ ...plan.scenes[0], sceneNumber: 2 }],
  };
  assert.throws(
    () => validateStoryPlan(invalid, style),
    /consecutive/,
  );
  assert.throws(
    () => validateStoryPlan({ ...plan, visualStyle: { ...plan.visualStyle, style: "Comic" } }, style),
    /selected visual style/,
  );
});

test("requires the requested number of scenes", async () => {
  await assert.rejects(
    planStory("A story", style, 2, async () => JSON.stringify(plan)),
    /exactly 2 scenes/,
  );
});

test("builds image prompts with exact character identity and safe composition guidance", () => {
  const characterPrompt = buildCharacterReferencePrompt("Maya finds Pip.", plan.characters, style);
  const scenePrompt = buildScenePrompt({
    story: "Maya finds Pip.",
    characterBible: plan.characters,
    scene: plan.scenes[0],
    style,
  });

  test("only fetches persisted public Vercel Blob references", () => {
    assert.equal(
      isTrustedBlobUrl("https://store.public.blob.vercel-storage.com/story.png"),
      true,
    );
    assert.equal(isTrustedBlobUrl("http://store.public.blob.vercel-storage.com/a.png"), false);
    assert.equal(isTrustedBlobUrl("https://example.com/a.png"), false);
    assert.equal(
      isTrustedBlobUrl("https://user:pass@store.public.blob.vercel-storage.com/a.png"),
      false,
    );
  });
  assert.match(characterPrompt, /small star-shaped hair clip/);
  assert.match(scenePrompt, /yellow raincoat and blue trousers/);
  assert.match(scenePrompt, /Preserve each depicted character's face/);
  assert.match(scenePrompt, /No writing, letters, captions/);
  assert.match(
    buildStoryPlanPrompt("A story", style, "auto"),
    /5–7 scenes/,
  );
});
