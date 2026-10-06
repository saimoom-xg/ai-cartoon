"use client";

import { useState, type FormEvent } from "react";
import { ASSETS_BY_ID } from "@/lib/assets/library";
import type { GeneratedCartoon } from "@/lib/types/cartoon";

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

export default function StoryGeneratorForm() {
  const [story, setStory] = useState("");
  const [cartoon, setCartoon] = useState<GeneratedCartoon | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCartoon(null);
    setIsLoading(true);

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
          typeof result.error === "string"
            ? result.error
            : "Could not generate the story.";
        setError(message);
      } else if (isGeneratedCartoon(result)) {
        setCartoon(result);
      } else {
        setError("The server returned an unexpected scene format.");
      }
    } catch {
      setError("Could not reach the story generation API. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label
          className="block text-sm font-semibold text-gray-800"
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
          placeholder="A boy goes to the park with his dog..."
          maxLength={20_000}
          className="w-full resize-y rounded-2xl border border-gray-200 bg-gray-50 p-4 text-base leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
        />
        <button
          type="submit"
          disabled={isLoading || story.trim().length === 0}
          className="w-full rounded-2xl bg-violet-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {isLoading ? "Generating..." : "Generate Cartoon"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      {cartoon && (
        <section className="mt-10 space-y-6" aria-live="polite">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-600">
              Generated story
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950">{cartoon.title}</h2>
          </div>

          <div className="space-y-4">
            {cartoon.scenes.map((scene) => {
              const background = ASSETS_BY_ID.get(scene.background);

              return (
                <article
                  key={scene.sceneNumber}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <h3 className="font-semibold text-gray-950">
                    Scene {scene.sceneNumber}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Background: {background?.name ?? scene.background}
                  </p>

                  {scene.elements.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {scene.elements.map((element, index) => {
                        const asset = ASSETS_BY_ID.get(element.asset);

                        return (
                          <li
                            key={`${element.asset}-${index}`}
                            className="rounded-full bg-white px-3 py-1.5 text-sm text-gray-800 ring-1 ring-gray-200"
                          >
                            {asset?.name ?? element.asset}
                            <span className="ml-1 text-gray-500">· {element.action}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {scene.dialogue.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-gray-700">
                      {scene.dialogue.map((line, index) => (
                        <li key={`${line.speaker}-${index}`}>
                          <span className="font-semibold">{line.speaker}:</span>{" "}
                          {line.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>

          <details className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-gray-800">
              View scene JSON
            </summary>
            <pre className="mt-4 max-h-96 overflow-auto text-xs leading-5 text-gray-700">
              {JSON.stringify(cartoon, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </>
  );
}
