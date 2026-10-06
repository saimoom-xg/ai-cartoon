import assert from "node:assert/strict";
import { test } from "node:test";
import type { Schema } from "@google/genai";
import { ASSETS } from "../assets/library.ts";
import {
  buildGeminiPrompt,
  generateCartoonFromStory,
  requestOpenRouterText,
  StoryProviderRequestError,
  StoryProviderResponseError,
} from "./generate-cartoon.ts";
import type { GeneratedCartoon } from "../types/cartoon.ts";

function scene(
  sceneNumber: number,
  background: string,
  elements: GeneratedCartoon["scenes"][number]["elements"],
): GeneratedCartoon["scenes"][number] {
  return { sceneNumber, background, elements, dialogue: [] };
}

test("generates structured scenes for two stories using only library assets", async () => {
  const storyCases: Array<{
    story: string;
    result: GeneratedCartoon;
    expectedAssets: string[];
  }> = [
    {
      story: "A boy walks his dog through the park, then they play together.",
      result: {
        title: "A Park Walk",
        scenes: [
          scene(1, "park", [
            { asset: "boy", type: "character", action: "walking", x: 250, y: 300, scale: 1 },
            { asset: "dog", type: "animal", action: "walking", x: 450, y: 350, scale: 1 },
          ]),
          scene(2, "park", [
            { asset: "boy", type: "character", action: "playing", x: 250, y: 300, scale: 1 },
            { asset: "dog", type: "animal", action: "playing", x: 450, y: 350, scale: 1 },
          ]),
        ],
      },
      expectedAssets: ["boy", "dog"],
    },
    {
      story: "A girl visits the school and meets her friend.",
      result: {
        title: "A School Visit",
        scenes: [
          scene(1, "school", [
            { asset: "girl", type: "character", action: "visiting", x: 300, y: 320, scale: 1 },
          ]),
          scene(2, "school", [
            { asset: "girl", type: "character", action: "talking", x: 300, y: 320, scale: 1 },
            { asset: "friend", type: "character", action: "greeting", x: 550, y: 320, scale: 1 },
          ]),
        ],
      },
      expectedAssets: ["girl", "friend"],
    },
  ];

  for (const testCase of storyCases) {
    let receivedPrompt = "";
    let receivedSchema: Schema | undefined;
    const cartoon = await generateCartoonFromStory(
      testCase.story,
      { gemini: async (prompt, schema) => {
        receivedPrompt = prompt;
        receivedSchema = schema;
        return JSON.stringify(testCase.result);
      } },
    );

    assert.deepEqual(cartoon, testCase.result);
    assert.ok(receivedPrompt.includes(testCase.story));
    const sceneSchema = receivedSchema?.properties?.scenes?.items;
    assert.ok(sceneSchema?.properties?.background?.enum?.includes("park"));
    assert.deepEqual(
      sceneSchema?.properties?.elements?.items?.properties?.asset?.enum,
      ASSETS.map((asset) => asset.id),
    );
    for (const assetId of testCase.expectedAssets) {
      assert.ok(ASSETS.some((asset) => asset.id === assetId));
      assert.ok(receivedPrompt.includes(`"id": "${assetId}"`));
      assert.equal(
        cartoon.scenes.flatMap((item) => item.elements).filter((item) => item.asset === assetId).length > 0,
        true,
      );
    }
  }
});

test("prompt restricts analysis to the provided asset library", () => {
  const prompt = buildGeminiPrompt("A boy visits a park.");

  assert.match(prompt, /Do not generate, describe, or request images/);
  assert.match(prompt, /Never invent, rename, or alter an asset ID/);
  assert.match(prompt, /Reuse the same asset ID/);
  assert.match(prompt, /"id": "park"/);
});

test("rejects malformed JSON and unknown asset IDs", async () => {
  await assert.rejects(
    generateCartoonFromStory("A story.", { gemini: async () => "{invalid json" }),
    StoryProviderResponseError,
  );

  const invalidCartoon = {
    title: "Unsupported Asset",
    scenes: [scene(1, "park", [
      { asset: "invented-character", type: "character", action: "walking", x: 250, y: 300, scale: 1 },
    ])],
  };

  await assert.rejects(
    generateCartoonFromStory("A story.", { gemini: async () => JSON.stringify(invalidCartoon) }),
    /unknown asset ID/,
  );
});

test("rejects missing scenes and mismatched asset types", async () => {
  await assert.rejects(
    generateCartoonFromStory("A story.", {
      gemini: async () => JSON.stringify({ title: "Empty", scenes: [] }),
    }),
    /between 1 and 6 scenes/,
  );

  const invalidCartoon = {
    title: "Mismatched Type",
    scenes: [
      scene(1, "park", [
        { asset: "dog", type: "character", action: "walking", x: 250, y: 300, scale: 1 },
      ]),
    ],
  };

  await assert.rejects(
    generateCartoonFromStory("A story.", { gemini: async () => JSON.stringify(invalidCartoon) }),
    /incorrect type/,
  );
});

test("falls back to OpenRouter when Gemini throws an API error", async () => {
  const expected: GeneratedCartoon = {
    title: "OpenRouter Fallback",
    scenes: [scene(1, "park", [
      { asset: "boy", type: "character", action: "walking", x: 250, y: 300, scale: 1 },
    ])],
  };
  const calls: string[] = [];

  const cartoon = await generateCartoonFromStory("A boy visits a park.", {
    gemini: async () => {
      calls.push("gemini");
      throw new Error("Gemini unavailable");
    },
    openRouter: async () => {
      calls.push("openrouter");
      return JSON.stringify(expected);
    },
  });

  assert.deepEqual(calls, ["gemini", "openrouter"]);
  assert.deepEqual(cartoon, expected);
});

test("falls back to OpenRouter when Gemini returns invalid scene JSON", async () => {
  const expected: GeneratedCartoon = {
    title: "Valid Fallback",
    scenes: [scene(1, "school", [])],
  };

  const cartoon = await generateCartoonFromStory("A girl goes to school.", {
    gemini: async () => JSON.stringify({ title: "Bad", scenes: [] }),
    openRouter: async () => JSON.stringify(expected),
  });

  assert.deepEqual(cartoon, expected);
});

test("uses OpenRouter when Gemini is not configured", async () => {
  const expected: GeneratedCartoon = {
    title: "OpenRouter Only",
    scenes: [scene(1, "house", [])],
  };

  const cartoon = await generateCartoonFromStory("A family goes home.", {
    openRouter: async () => JSON.stringify(expected),
  });

  assert.deepEqual(cartoon, expected);
});

test("reports provider failure if both configured providers fail", async () => {
  await assert.rejects(
    generateCartoonFromStory("A story.", {
      gemini: async () => {
        throw new Error("Gemini unavailable");
      },
      openRouter: async () => {
        throw new Error("OpenRouter unavailable");
      },
    }),
    StoryProviderRequestError,
  );
});

test("sends OpenRouter requests with server-side credentials and JSON response mode", async () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const originalModel = process.env.OPENROUTER_MODEL;
  const originalFetch = globalThis.fetch;
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  process.env.OPENROUTER_API_KEY = "unit-test-token";
  process.env.OPENROUTER_MODEL = "test/provider-model";
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"title":"Test","scenes":[]}' } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const response = await requestOpenRouterText("test prompt");
    const headers = new Headers(requestInit?.headers);
    const body = JSON.parse(String(requestInit?.body)) as {
      model: string;
      response_format: { type: string };
    };

    assert.equal(response, '{"title":"Test","scenes":[]}');
    assert.equal(requestUrl, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(headers.get("Authorization"), "Bearer unit-test-token");
    assert.equal(body.model, "test/provider-model");
    assert.deepEqual(body.response_format, { type: "json_object" });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
    if (originalModel === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = originalModel;
  }
});
