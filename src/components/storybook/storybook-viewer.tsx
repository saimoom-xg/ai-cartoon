"use client";

import JSZip from "jszip";
import { useState } from "react";
import Image from "next/image";
import {
  STORY_STYLES,
  type StoryStyle,
  type Storybook,
  type StorybookScene,
} from "@/lib/types/storybook";

interface StorybookViewerProps {
  book: Storybook;
  isGenerating: boolean;
  progressLabel: string;
  onUpdateBook: (book: Storybook) => void;
  onGenerateScene: (index: number, style?: StoryStyle) => Promise<Storybook>;
  onGeneratePending: () => Promise<void>;
  onReset: () => void;
}

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
    throw new Error("The image service returned an invalid response.");
  }
  return payload as Record<string, unknown>;
}

function safeFilename(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "storybook";
}

function imageExtension(url: string): string {
  const extension = new URL(url).pathname.split(".").at(-1)?.toLowerCase();
  return extension && ["png", "jpg", "jpeg", "webp"].includes(extension) ? extension : "png";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

async function fetchImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download image (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("The image service returned a non-image file.");
  return blob;
}

export default function StorybookViewer({
  book,
  isGenerating,
  progressLabel,
  onUpdateBook,
  onGenerateScene,
  onGeneratePending,
  onReset,
}: StorybookViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingCover, setIsCreatingCover] = useState(false);
  const [exportError, setExportError] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const selectedScene = book.scenes[selectedIndex];
  const completedCount = book.scenes.filter((scene) => scene.status === "completed").length;
  const failedCount = book.scenes.filter((scene) => scene.status === "failed").length;

  async function handleEdit() {
    if (!selectedScene?.imageUrl || !editInstruction.trim() || isEditing) return;
    setIsEditing(true);
    setEditError("");
    setEditSuccess("");
    try {
      const result = await postJson("/api/edit/scene", {
        story: book.originalStory,
        style: selectedScene.style,
        visualStyle: book.visualStyle,
        quality: book.quality,
        characters: book.characters,
        characterReferenceUrl: book.characterReferenceUrl,
        scene: selectedScene,
        imageUrl: selectedScene.imageUrl,
        instruction: editInstruction.trim(),
      });
      if (typeof result.imageUrl !== "string" || !result.imageUrl.startsWith("https://")) {
        throw new Error("The image service returned an invalid image URL.");
      }
      const imageUrl = result.imageUrl;
      onUpdateBook({
        ...book,
        scenes: book.scenes.map((scene, index) =>
          index === selectedIndex
            ? { ...scene, imageUrl, status: "completed", error: undefined }
            : scene,
        ),
      });
      setEditInstruction("");
      setEditSuccess("Scene updated.");
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Could not edit this scene.");
    } finally {
      setIsEditing(false);
    }
  }

  async function handleCreateCover() {
    if (isCreatingCover) return;
    setIsCreatingCover(true);
    setExportError("");
    try {
      const result = await postJson("/api/generate/scene", {
        kind: "cover",
        story: book.originalStory,
        title: book.title,
        style: book.style,
        visualStyle: book.visualStyle,
        quality: book.quality,
        characters: book.characters,
        characterReferenceUrl: book.characterReferenceUrl,
      });
      if (typeof result.imageUrl !== "string" || !result.imageUrl.startsWith("https://")) {
        throw new Error("The image service returned an invalid cover URL.");
      }
      const coverImageUrl = result.imageUrl;
      onUpdateBook({ ...book, coverImageUrl });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not create the cover.");
    } finally {
      setIsCreatingCover(false);
    }
  }

  async function handleDownloadScene(scene: StorybookScene, index: number) {
    if (!scene.imageUrl) return;
    setExportError("");
    try {
      const blob = await fetchImage(scene.imageUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename(book.title)}-scene-${index + 1}.${imageExtension(scene.imageUrl)}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not download this scene.");
    }
  }

  async function handleDownloadZip() {
    setExportError("");
    const completed = book.scenes.filter((scene) => scene.status === "completed" && scene.imageUrl);
    if (!completed.length) {
      setExportError("There are no completed scene images to download yet.");
      return;
    }
    try {
      const zip = new JSZip();
      const folder = zip.folder(safeFilename(book.title));
      if (!folder) throw new Error("Could not create the storybook ZIP.");
      if (book.coverImageUrl) {
        folder.file(`cover.${imageExtension(book.coverImageUrl)}`, await fetchImage(book.coverImageUrl));
      }
      await Promise.all(
        completed.map(async (scene) => {
          const index = book.scenes.indexOf(scene);
          folder.file(
            `scene-${String(index + 1).padStart(2, "0")}-${safeFilename(scene.title)}.${imageExtension(scene.imageUrl!)}`,
            await fetchImage(scene.imageUrl!),
          );
        }),
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename(book.title)}.zip`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Could not create the storybook ZIP.");
    }
  }

  function handlePrintStorybook() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setExportError("Allow pop-ups to print or save your storybook as a PDF.");
      return;
    }
    printWindow.opener = null;
    const cover = book.coverImageUrl
      ? `<section class="cover"><img src="${escapeHtml(book.coverImageUrl)}" alt="Cover illustration"><h1>${escapeHtml(book.title)}</h1></section>`
      : "";
    const scenes = book.scenes
      .filter((scene) => scene.imageUrl)
      .map((scene) => `
        <section class="scene">
          <img src="${escapeHtml(scene.imageUrl!)}" alt="${escapeHtml(scene.title)}">
          <h2>${escapeHtml(scene.title)}</h2>
          <p>${escapeHtml(scene.storyBeat)}</p>
        </section>
      `)
      .join("");
    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>${escapeHtml(book.title)}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { margin: 0; color: #172033; font: 16px/1.5 Georgia, serif; }
        .cover, .scene { break-after: page; display: flex; min-height: 250mm; flex-direction: column; justify-content: center; }
        .cover { text-align: center; }
        img { display: block; width: 100%; max-height: 190mm; object-fit: contain; }
        h1 { font-size: 34px; } h2 { margin: 18px 0 4px; font-size: 24px; }
        p { margin: 0; font-size: 17px; }
        @media screen { body { max-width: 800px; margin: 24px auto; padding: 24px; } .scene,.cover { margin-bottom: 40px; } }
      </style></head><body>${cover}${scenes}<script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  }

  if (!selectedScene) return null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-2 py-4 sm:px-4 sm:py-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← New story
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              {book.genre} · {book.style}
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{book.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>{completedCount} / {book.scenes.length} scenes ready</span>
          {failedCount > 0 && <span className="text-rose-600">{failedCount} failed</span>}
          {failedCount > 0 && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => void onGeneratePending()}
              className="rounded-lg bg-violet-600 px-3 py-2 text-white disabled:opacity-50"
            >
              Retry failed
            </button>
          )}
        </div>
      </header>

      {isGenerating && (
        <div role="status" className="rounded-2xl border border-violet-100 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-800">
          <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent align-[-1px]" />
          {progressLabel || "Generating your storybook"}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-h-[350px] items-center justify-center bg-slate-100 sm:min-h-[480px]">
            {selectedScene.imageUrl ? (
              <Image
                src={selectedScene.imageUrl}
                alt={`Scene ${selectedScene.sceneNumber}: ${selectedScene.title}`}
                width={1600}
                height={900}
                unoptimized
                className="max-h-[70vh] w-full object-contain"
              />
            ) : (
              <div className="max-w-sm p-8 text-center">
                {selectedScene.status === "failed" ? (
                  <>
                    <p className="text-3xl" aria-hidden="true">⚠</p>
                    <p className="mt-3 font-bold text-rose-800">This scene needs another try</p>
                    <p className="mt-2 text-sm text-slate-600">{selectedScene.error}</p>
                  </>
                ) : (
                  <>
                    <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
                    <p className="mt-4 font-semibold text-slate-700">
                      {selectedScene.status === "generating" ? "Illustrating this scene..." : "Waiting for its turn"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                Scene {selectedIndex + 1} of {book.scenes.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {selectedScene.location} · {selectedScene.time}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{selectedScene.title}</h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">{selectedScene.storyBeat}</p>
            <p className="mt-2 text-sm text-slate-500">{selectedScene.action} · {selectedScene.emotion}</p>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-7">
            <button
              type="button"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex((index) => Math.max(0, index - 1))}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
            >
              ← Previous
            </button>
            {selectedScene.imageUrl && (
              <button
                type="button"
                onClick={() => void handleDownloadScene(selectedScene, selectedIndex)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Download PNG
              </button>
            )}
            <button
              type="button"
              disabled={selectedIndex === book.scenes.length - 1}
              onClick={() => setSelectedIndex((index) => Math.min(book.scenes.length - 1, index + 1))}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Scene tools</h2>
            <button
              type="button"
              disabled={isGenerating || isEditing}
              onClick={() => void onGenerateScene(selectedIndex)}
              className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {selectedScene.status === "failed" ? "Retry this scene" : "Regenerate scene"}
            </button>
            <label className="mt-4 block text-xs font-bold text-slate-600" htmlFor="scene-style">Change style for this scene</label>
            <select
              id="scene-style"
              value={selectedScene.style}
              disabled={isGenerating || isEditing}
              onChange={(event) => void onGenerateScene(selectedIndex, event.target.value as StoryStyle)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {STORY_STYLES.map((style) => <option key={style}>{style}</option>)}
            </select>
            <label className="mt-5 block text-xs font-bold text-slate-600" htmlFor="scene-edit">Edit with a prompt</label>
            <textarea
              id="scene-edit"
              rows={3}
              maxLength={1000}
              value={editInstruction}
              onChange={(event) => setEditInstruction(event.target.value)}
              placeholder="Make the waterfall larger and move Maya closer to Pip..."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-5 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              disabled={isEditing || isGenerating || !selectedScene.imageUrl || !editInstruction.trim()}
              onClick={() => void handleEdit()}
              className="mt-2 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-40"
            >
              {isEditing ? "Applying edit..." : "Apply scene edit"}
            </button>
            {editError && <p role="alert" className="mt-3 text-xs text-rose-700">{editError}</p>}
            {editSuccess && <p aria-live="polite" className="mt-3 text-xs text-emerald-700">{editSuccess}</p>}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Storybook export</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Create a separate cover, download all finished images, or print to PDF.</p>
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt="Storybook cover"
                width={1200}
                height={900}
                unoptimized
                className="mt-4 aspect-[4/3] w-full rounded-xl object-cover"
              />
            ) : (
              <button
                type="button"
                disabled={isCreatingCover || isGenerating}
                onClick={() => void handleCreateCover()}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isCreatingCover ? "Creating cover..." : "Generate dedicated cover"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleDownloadZip()}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              Download images as ZIP
            </button>
            <button
              type="button"
              onClick={handlePrintStorybook}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Print / Save storybook PDF
            </button>
            {exportError && <p role="alert" className="mt-3 text-xs text-rose-700">{exportError}</p>}
          </section>

          <details className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-bold text-slate-900">Character bible</summary>
            <div className="mt-3 space-y-3">
              {book.characters.map((character) => (
                <div key={character.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-800">{character.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {character.appearance.age}; {character.appearance.hair}; {character.appearance.eyes}; {character.appearance.clothing}; {character.appearance.shoes}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </aside>
      </div>

      <nav aria-label="Story scenes" className="flex gap-3 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {book.scenes.map((scene, index) => (
          <button
            type="button"
            key={scene.sceneNumber}
            aria-current={index === selectedIndex ? "step" : undefined}
            onClick={() => setSelectedIndex(index)}
            className={`w-36 shrink-0 overflow-hidden rounded-xl border text-left transition ${index === selectedIndex ? "border-violet-500 ring-2 ring-violet-100" : "border-slate-200 hover:border-violet-300"}`}
          >
            {scene.imageUrl ? (
              <Image
                src={scene.imageUrl}
                alt=""
                width={320}
                height={180}
                unoptimized
                className="aspect-video w-full object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-slate-100 text-xs font-semibold text-slate-500">
                {scene.status === "failed" ? "Retry needed" : scene.status === "generating" ? "Generating..." : "Coming up"}
              </div>
            )}
            <span className="block truncate px-2 py-2 text-xs font-semibold text-slate-700">
              {index + 1}. {scene.title}
            </span>
          </button>
        ))}
      </nav>
    </main>
  );
}
