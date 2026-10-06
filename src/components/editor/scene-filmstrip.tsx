"use client";

import type { CartoonScene } from "@/lib/types/cartoon";
import { ASSETS_BY_ID } from "@/lib/assets/library";

interface SceneFilmstripProps {
  scenes: CartoonScene[];
  currentSceneIndex: number;
  isRegenerating: boolean;
  onSelectScene: (index: number) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
  onDuplicateScene: (index: number) => void;
  onRegenerateScene: (index: number) => void;
  onMoveScene: (index: number, direction: "left" | "right") => void;
}

export default function SceneFilmstrip({
  scenes,
  currentSceneIndex,
  isRegenerating,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onDuplicateScene,
  onRegenerateScene,
  onMoveScene,
}: SceneFilmstripProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Story Scenes ({scenes.length})
          </span>
          <span className="text-xs text-slate-400">• Click to edit scene</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRegenerateScene(currentSceneIndex)}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
            title="Regenerate only this scene using AI / smart composer"
          >
            <span>{isRegenerating ? "⏳" : "🔄"}</span>
            <span>{isRegenerating ? "Regenerating..." : "Regenerate Scene"}</span>
          </button>

          <button
            onClick={onAddScene}
            className="flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <span>+</span>
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Horizontal Strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
        {scenes.map((scene, idx) => {
          const isActive = idx === currentSceneIndex;
          const bgAsset = ASSETS_BY_ID.get(scene.background);
          const bgName = bgAsset?.name || scene.background;

          return (
            <div
              key={`scene-thumb-${idx}`}
              className={`group relative flex w-44 flex-shrink-0 flex-col overflow-hidden rounded-xl border-2 transition ${
                isActive
                  ? "border-violet-600 bg-violet-50/40 ring-2 ring-violet-200"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <button
                onClick={() => onSelectScene(idx)}
                className="flex flex-col p-3 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Scene {scene.sceneNumber}
                  </span>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                    {scene.elements.length} items
                  </span>
                </div>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  {bgName}
                </p>

                {scene.dialogue[0] && (
                  <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-600 italic">
                    &ldquo;{scene.dialogue[0].text}&rdquo;
                  </p>
                )}
              </button>

              {/* Action Toolbar on hover */}
              <div className="flex items-center justify-between border-t border-slate-200/60 bg-white/80 px-2 py-1 text-[11px]">
                <div className="flex gap-1">
                  {idx > 0 && (
                    <button
                      onClick={() => onMoveScene(idx, "left")}
                      title="Move left"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ←
                    </button>
                  )}
                  {idx < scenes.length - 1 && (
                    <button
                      onClick={() => onMoveScene(idx, "right")}
                      title="Move right"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      →
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onDuplicateScene(idx)}
                    title="Duplicate scene"
                    className="text-slate-500 hover:text-violet-600"
                  >
                    Copy
                  </button>
                  {scenes.length > 1 && (
                    <button
                      onClick={() => onDeleteScene(idx)}
                      title="Delete scene"
                      className="text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
