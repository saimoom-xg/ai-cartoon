"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  STORY_QUALITIES,
  STORY_STYLES,
  type PlannedStoryScene,
  type StoryPlan,
  type StoryQuality,
  type StoryStyle,
  type Storybook,
  type StorybookScene,
} from "@/lib/types/storybook";
import StorybookViewer from "./storybook-viewer";

const SAMPLE_STORY =
  "Maya finds a tiny blue dragon hiding inside an old watering can in her grandmother's garden. She names him Pip and helps him fly to the moonlit mountain where his family is waiting. On the way, they cross a windy bridge and share berries with a lost fox.";

async function postJson(path: string, body: unknown): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not reach the story service. Check your connection and retry.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const returnedError =
      typeof payload === "object" && payload !== null && "error" in payload
        ? (payload as Record<string, unknown>).error
        : undefined;
    const message = typeof returnedError === "string"
      ? returnedError
      : `The story service returned an error (${response.status}).`;
    throw new Error(message);
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    throw new Error("The story service returned an invalid response.");
  }
  return payload as Record<string, unknown>;
}

function isStoryPlan(value: unknown): value is StoryPlan {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).title === "string" &&
    Array.isArray((value as Record<string, unknown>).characters) &&
    Array.isArray((value as Record<string, unknown>).scenes)
  );
}

function makeScene(scene: PlannedStoryScene, style: StoryStyle): StorybookScene {
  return { ...scene, status: "pending", style };
}

function imageUrlFromResponse(response: Record<string, unknown>): string {
  if (typeof response.imageUrl !== "string" || !response.imageUrl.startsWith("https://")) {
    throw new Error("The image service returned an invalid image URL.");
  }
  return response.imageUrl;
}

export default function StorybookCreator() {
  const [story, setStory] = useState("");
  const [style, setStyle] = useState<StoryStyle>("3D Cartoon");
  const [quality, setQuality] = useState<StoryQuality>("standard");
  const [sceneCount, setSceneCount] = useState<"auto" | number>("auto");
  const [book, setBook] = useState<Storybook | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState("");

  async function generateSceneAt(
    currentBook: Storybook,
    index: number,
    nextStyle = currentBook.scenes[index].style,
  ): Promise<Storybook> {
    const target = currentBook.scenes[index];
    let workingBook: Storybook = {
      ...currentBook,
      scenes: currentBook.scenes.map((scene, sceneIndex) =>
        sceneIndex === index
          ? { ...scene, status: "generating", error: undefined, style: nextStyle }
          : scene,
      ),
    };
    setBook(workingBook);
    setProgressLabel(`Painting scene ${index + 1} of ${workingBook.scenes.length}`);
    try {
      const result = await postJson("/api/generate/scene", {
        kind: "scene",
        story: workingBook.originalStory,
        style: nextStyle,
        quality: workingBook.quality,
        characters: workingBook.characters,
        characterReferenceUrl: workingBook.characterReferenceUrl,
        scene: target,
        previousScene: index > 0 ? workingBook.scenes[index - 1] : undefined,
        previousSceneUrl:
          index > 0 ? workingBook.scenes[index - 1].imageUrl : undefined,
      });
      const imageUrl = imageUrlFromResponse(result);
      workingBook = {
        ...workingBook,
        scenes: workingBook.scenes.map((scene, sceneIndex) =>
          sceneIndex === index
            ? { ...scene, status: "completed", imageUrl, error: undefined, style: nextStyle }
            : scene,
        ),
      };
    } catch (generationError) {
      const message =
        generationError instanceof Error
          ? generationError.message
          : "Could not generate this scene. Please retry.";
      workingBook = {
        ...workingBook,
        scenes: workingBook.scenes.map((scene, sceneIndex) =>
          sceneIndex === index ? { ...scene, status: "failed", error: message } : scene,
        ),
      };
    }
    setBook(workingBook);
    return workingBook;
  }

  async function generatePendingScenes(currentBook: Storybook) {
    setIsGenerating(true);
    setError("");
    let workingBook = currentBook;
    for (let index = 0; index < workingBook.scenes.length; index += 1) {
      const scene = workingBook.scenes[index];
      if (scene.status === "completed") continue;
      workingBook = await generateSceneAt(workingBook, index);
    }
    setIsGenerating(false);
    setProgressLabel("");
  }

  async function createCharacterReference(currentBook: Storybook) {
    setIsGenerating(true);
    setError("");
    setProgressLabel("Creating the character reference sheet");
    try {
      const result = await postJson("/api/generate/character", {
        story: currentBook.originalStory,
        style: currentBook.style,
        characters: currentBook.characters,
      });
      const updated = { ...currentBook, characterReferenceUrl: imageUrlFromResponse(result) };
      setBook(updated);
      await generatePendingScenes(updated);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not create the character reference. Please retry.",
      );
      setIsGenerating(false);
      setProgressLabel("");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!story.trim() || isGenerating) return;
    setError("");
    setIsGenerating(true);
    setProgressLabel("Understanding the story and planning meaningful scenes");
    try {
      const response = await postJson("/api/story/analyze", {
        story: story.trim(),
        style,
        sceneCount,
      });
      if (!isStoryPlan(response.plan)) {
        throw new Error("The story planner returned an invalid plan.");
      }
      const plan = response.plan;
      const created: Storybook = {
        id: crypto.randomUUID(),
        title: plan.title,
        originalStory: story.trim(),
        genre: plan.genre,
        tone: plan.tone,
        style,
        visualStyle: plan.visualStyle,
        quality,
        characters: plan.characters,
        scenes: plan.scenes.map((scene) => makeScene(scene, style)),
      };
      setBook(created);
      await createCharacterReference(created);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Could not plan this story. Please retry.",
      );
      setIsGenerating(false);
      setProgressLabel("");
    }
  }

  if (book) {
    if (!book.characterReferenceUrl) {
      return (
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
                Story plan ready
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{book.title}</h1>
            </div>
            <button
              type="button"
              onClick={() => {
                setBook(null);
                setError("");
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Start over
            </button>
          </div>
          <GenerationProgress
            current={progressLabel || (isGenerating ? "Creating character reference" : "Ready to retry")}
            scenes={book.scenes}
          />
          {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
          {!isGenerating && (
            <button
              type="button"
              onClick={() => void createCharacterReference(book)}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700"
            >
              Retry character reference
            </button>
          )}
        </section>
      );
    }
    return (
      <StorybookViewer
        book={book}
        isGenerating={isGenerating}
        progressLabel={progressLabel}
        onUpdateBook={setBook}
        onGenerateScene={(index, nextStyle) => generateSceneAt(book, index, nextStyle)}
        onGeneratePending={() => generatePendingScenes(book)}
        onReset={() => {
          setBook(null);
          setError("");
        }}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
          Your story, illustrated from scratch
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Create Your Cartoon Story
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Gemini plans the story, designs a consistent cast, and illustrates each story beat as an original image.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleCreate}>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="storybook-story" className="text-sm font-bold text-slate-800">Story</label>
            <button
              type="button"
              onClick={() => setStory(SAMPLE_STORY)}
              className="text-xs font-semibold text-violet-700 hover:text-violet-900"
            >
              Try a sample story
            </button>
          </div>
          <textarea
            id="storybook-story"
            rows={8}
            maxLength={20_000}
            value={story}
            onChange={(event) => setStory(event.target.value)}
            placeholder="Write an adventure with characters, places, and things that happen..."
            className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{story.length.toLocaleString()} / 20,000</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-slate-800">
            Visual style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as StoryStyle)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"
            >
              {STORY_STYLES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-800">
            Number of scenes
            <select
              value={sceneCount}
              onChange={(event) => setSceneCount(event.target.value === "auto" ? "auto" : Number(event.target.value))}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"
            >
              <option value="auto">Auto (5–7)</option>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((item) => <option value={item} key={item}>{item} scenes</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-800">
            Image quality
            <select
              value={quality}
              onChange={(event) => setQuality(event.target.value as StoryQuality)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium"
            >
              {STORY_QUALITIES.map((item) => (
                <option key={item} value={item}>
                  {item === "fast" ? "Fast · 1K" : item === "high" ? "High quality · 4K" : "Standard · 2K"}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={isGenerating || !story.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {isGenerating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{progressLabel || "Creating your storybook..."}</span>
            </>
          ) : "✨ Generate storybook"}
        </button>
        <p className="text-center text-xs leading-5 text-slate-500">
          Images are generated by Gemini and stored in your configured Vercel Blob bucket. High-quality 4K generation may cost more.
        </p>
      </form>

      <div className="mt-7 border-t border-slate-100 pt-5 text-center">
        <Link href="/classic" className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-violet-700">
          Open the classic asset-based editor
        </Link>
      </div>
    </main>
  );
}

function GenerationProgress({
  current,
  scenes,
}: {
  current: string;
  scenes: StorybookScene[];
}) {
  const steps = [
    "Understanding the story",
    "Creating characters",
    "Creating character references",
    "Planning story scenes",
  ];
  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6">
      <h2 className="text-lg font-bold text-slate-900">Creating your cartoon...</h2>
      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-sm text-slate-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-700">✓</span>
            {step}
            {index === 1 && <span className="text-xs text-slate-400">({scenes.length} scenes planned)</span>}
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="mt-5 font-semibold text-violet-800">{current}</p>
    </div>
  );
}
