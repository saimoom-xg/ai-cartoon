"use client";

import { useState, type FormEvent } from "react";
import type { GeneratedCartoon } from "@/lib/types/cartoon";
import CartoonEditor from "./editor/cartoon-editor";

function isGeneratedCartoon(value: unknown): value is GeneratedCartoon {
  if (typeof value !== "object" || value === null) return false;

  const cartoon = value as Record<string, unknown>;
  return (
    typeof cartoon.title === "string" &&
    Array.isArray(cartoon.scenes) &&
    cartoon.scenes.every(
      (scene) =>
        typeof scene === "object" &&
        scene !== null &&
        typeof (scene as Record<string, unknown>).sceneNumber === "number" &&
        typeof (scene as Record<string, unknown>).background === "string" &&
        Array.isArray((scene as Record<string, unknown>).elements) &&
        Array.isArray((scene as Record<string, unknown>).dialogue),
    )
  );
}

const SAMPLE_STORIES = [
  {
    title: "Park Adventure",
    text: "A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car.",
  },
  {
    title: "School Friendship",
    text: "A girl visits the school and meets her friend. They sit under a big tree and read story books together.",
  },
  {
    title: "Street Walk",
    text: "An old man walks down the town street. He sees a playful cat near the house and smiles warmly.",
  },
];

export default function StoryGeneratorForm() {
  const [story, setStory] = useState("");
  const [cartoon, setCartoon] = useState<GeneratedCartoon | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!story.trim()) return;

    setError("");
    setCartoon(null);
    setIsLoading(true);
    setLoadingStep(1);

    // Step animation interval
    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch("/api/cartoon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof (result as Record<string, unknown>).error === "string"
            ? (result as Record<string, unknown>).error
            : "Could not generate the story.";
        setError(String(message));
      } else if (isGeneratedCartoon(result)) {
        setCartoon(result);
      } else {
        setError("The server returned an unexpected scene format.");
      }
    } catch {
      setError("Could not reach the story generation API. Please try again.");
    } finally {
      clearInterval(stepTimer);
      setIsLoading(false);
    }
  }

  // If cartoon is generated, render full Cartoon Editor!
  if (cartoon) {
    return (
      <CartoonEditor
        initialCartoon={cartoon}
        onResetStory={() => setCartoon(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/80 sm:p-12">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
          Your imagination, illustrated
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          AI Cartoon Story Generator
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Write a story and turn it into interactive cartoon scenes using your predefined asset library.
        </p>
      </div>

      {/* Sample prompts */}
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Try an example story
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLE_STORIES.map((sample) => (
            <button
              key={sample.title}
              type="button"
              onClick={() => setStory(sample.text)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              💡 {sample.title}
            </button>
          ))}
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="relative">
          <label
            className="block text-sm font-bold text-slate-800"
            htmlFor="story"
          >
            Tell me your story...
          </label>
          <textarea
            id="story"
            name="story"
            rows={7}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            placeholder="A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car..."
            maxLength={20_000}
            className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || story.trim().length === 0}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-violet-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 hover:shadow-violet-600/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:bg-violet-300 disabled:shadow-none"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Generating Cartoon...</span>
            </span>
          ) : (
            <span>✨ Generate Cartoon</span>
          )}
        </button>
      </form>

      {/* Loading Steps Animation */}
      {isLoading && (
        <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/60 p-6 animate-in fade-in">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${loadingStep >= 1 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                1
              </span>
              <span className={`text-sm font-medium ${loadingStep >= 1 ? "text-violet-900 font-bold" : "text-slate-400"}`}>
                Understanding characters, actions, and story flow...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${loadingStep >= 2 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                2
              </span>
              <span className={`text-sm font-medium ${loadingStep >= 2 ? "text-violet-900 font-bold" : "text-slate-400"}`}>
                Matching predefined cartoon assets and backgrounds...
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${loadingStep >= 3 ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                3
              </span>
              <span className={`text-sm font-medium ${loadingStep >= 3 ? "text-violet-900 font-bold" : "text-slate-400"}`}>
                Composing interactive Konva cartoon scenes...
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
