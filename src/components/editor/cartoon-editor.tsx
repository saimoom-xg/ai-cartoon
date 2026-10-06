"use client";

import { useState, useRef } from "react";
import type Konva from "konva";
import Image from "next/image";
import type {
  CartoonElement,
  CartoonDialogue,
  CartoonScene,
  GeneratedCartoon,
  AssetMetadata,
} from "@/lib/types/cartoon";
import { ASSETS_BY_ID } from "@/lib/assets/library";
import CartoonCanvas from "./cartoon-canvas";
import SceneFilmstrip from "./scene-filmstrip";
import AssetPickerModal from "./asset-picker-modal";
import SlideshowModal from "./slideshow-modal";
import ExportModal from "./export-modal";

interface CartoonEditorProps {
  initialCartoon: GeneratedCartoon;
  onResetStory: () => void;
}

const BACKGROUND_OPTIONS = [
  { id: "park", name: "Green Park" },
  { id: "house", name: "Cozy House" },
  { id: "school", name: "School Yard" },
  { id: "street", name: "Town Street" },
];

export default function CartoonEditor({
  initialCartoon,
  onResetStory,
}: CartoonEditorProps) {
  const [cartoon, setCartoon] = useState<GeneratedCartoon>(initialCartoon);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [selectedDialogueIndex, setSelectedDialogueIndex] = useState<number | null>(null);

  // Modals state
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [assetPickerMode, setAssetPickerMode] = useState<"add" | "replace">("add");
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const stageRef = useRef<Konva.Stage | null>(null);

  const currentScene = cartoon.scenes[currentSceneIndex] || cartoon.scenes[0];
  const selectedElement =
    selectedElementIndex !== null ? currentScene.elements[selectedElementIndex] : null;
  const selectedDialogue =
    selectedDialogueIndex !== null ? currentScene.dialogue[selectedDialogueIndex] : null;

  // Update current scene helper
  function updateCurrentScene(updates: Partial<CartoonScene>) {
    setCartoon((prev) => {
      const newScenes = [...prev.scenes];
      newScenes[currentSceneIndex] = {
        ...newScenes[currentSceneIndex],
        ...updates,
      };
      return { ...prev, scenes: newScenes };
    });
  }

  // Element updates
  function handleUpdateElement(index: number, updates: Partial<CartoonElement>) {
    const updatedElements = [...currentScene.elements];
    updatedElements[index] = {
      ...updatedElements[index],
      ...updates,
    };
    updateCurrentScene({ elements: updatedElements });
  }

  // Dialogue updates
  function handleUpdateDialogue(index: number, updates: Partial<CartoonDialogue>) {
    const updatedDialogue = [...currentScene.dialogue];
    updatedDialogue[index] = {
      ...updatedDialogue[index],
      ...updates,
    };
    updateCurrentScene({ dialogue: updatedDialogue });
  }

  // Add asset
  function handleAddAsset(asset: AssetMetadata) {
    if (asset.type === "background" || asset.type === "building") {
      updateCurrentScene({ background: asset.id });
      return;
    }

    const newElement: CartoonElement = {
      asset: asset.id,
      type: asset.type,
      action: "present",
      x: 350 + Math.floor(Math.random() * 80),
      y: 280,
      scale: 0.65,
    };

    const newElements = [...currentScene.elements, newElement];
    updateCurrentScene({ elements: newElements });
    setSelectedElementIndex(newElements.length - 1);
    setSelectedDialogueIndex(null);
  }

  // Replace asset
  function handleReplaceAsset(asset: AssetMetadata) {
    if (selectedElementIndex === null) return;
    const current = currentScene.elements[selectedElementIndex];
    handleUpdateElement(selectedElementIndex, {
      asset: asset.id,
      type: asset.type,
      action: current.action,
    });
  }

  // Delete selected element
  function handleDeleteElement(index: number) {
    const filtered = currentScene.elements.filter((_, idx) => idx !== index);
    updateCurrentScene({ elements: filtered });
    setSelectedElementIndex(null);
  }

  // Flip horizontal
  function handleToggleFlip(index: number) {
    const el = currentScene.elements[index];
    handleUpdateElement(index, { flipX: !el.flipX });
  }

  // Change Layer Order
  function handleMoveLayer(index: number, direction: "up" | "down") {
    const elements = [...currentScene.elements];
    const targetIdx = direction === "up" ? index + 1 : index - 1;
    if (targetIdx < 0 || targetIdx >= elements.length) return;
    const temp = elements[index];
    elements[index] = elements[targetIdx];
    elements[targetIdx] = temp;
    updateCurrentScene({ elements });
    setSelectedElementIndex(targetIdx);
  }

  // Add Dialogue
  function handleAddDialogue() {
    const speakerAsset = currentScene.elements[0]
      ? ASSETS_BY_ID.get(currentScene.elements[0].asset)
      : null;
    const speaker = speakerAsset?.name || "Boy";

    const newDialogue: CartoonDialogue = {
      speaker,
      text: "Hello there!",
      x: 240 + currentScene.dialogue.length * 30,
      y: 110 + currentScene.dialogue.length * 40,
    };

    updateCurrentScene({
      dialogue: [...currentScene.dialogue, newDialogue],
    });
    setSelectedDialogueIndex(currentScene.dialogue.length);
    setSelectedElementIndex(null);
  }

  // Delete Dialogue
  function handleDeleteDialogue(index: number) {
    const filtered = currentScene.dialogue.filter((_, idx) => idx !== index);
    updateCurrentScene({ dialogue: filtered });
    setSelectedDialogueIndex(null);
  }

  // Add Scene
  function handleAddScene() {
    const newSceneNumber = cartoon.scenes.length + 1;
    const newScene: CartoonScene = {
      sceneNumber: newSceneNumber,
      background: "park",
      elements: [
        {
          asset: "boy",
          type: "character",
          action: "exploring",
          x: 350,
          y: 260,
          scale: 0.65,
        },
      ],
      dialogue: [
        {
          speaker: "Boy",
          text: "What happens next?",
          x: 280,
          y: 110,
        },
      ],
    };

    setCartoon((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      totalScenes: prev.scenes.length + 1,
    }));
    setCurrentSceneIndex(cartoon.scenes.length);
    setSelectedElementIndex(null);
    setSelectedDialogueIndex(null);
  }

  // Duplicate Scene
  function handleDuplicateScene(index: number) {
    const sceneToCopy = cartoon.scenes[index];
    const duplicated: CartoonScene = {
      ...sceneToCopy,
      sceneNumber: cartoon.scenes.length + 1,
      elements: JSON.parse(JSON.stringify(sceneToCopy.elements)),
      dialogue: JSON.parse(JSON.stringify(sceneToCopy.dialogue)),
    };

    const newScenes = [...cartoon.scenes];
    newScenes.splice(index + 1, 0, duplicated);
    const renumbered = newScenes.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

    setCartoon((prev) => ({ ...prev, scenes: renumbered, totalScenes: renumbered.length }));
    setCurrentSceneIndex(index + 1);
  }

  // Delete Scene
  function handleDeleteScene(index: number) {
    if (cartoon.scenes.length <= 1) return;
    const filtered = cartoon.scenes
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

    setCartoon((prev) => ({ ...prev, scenes: filtered, totalScenes: filtered.length }));
    setCurrentSceneIndex(Math.max(0, index - 1));
    setSelectedElementIndex(null);
    setSelectedDialogueIndex(null);
  }

  // Move Scene position
  function handleMoveScene(index: number, direction: "left" | "right") {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= cartoon.scenes.length) return;
    const reordered = [...cartoon.scenes];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    const renumbered = reordered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));

    setCartoon((prev) => ({ ...prev, scenes: renumbered }));
    setCurrentSceneIndex(targetIdx);
  }

  // Regenerate Scene (Section 9)
  async function handleRegenerateScene(index: number) {
    setIsRegenerating(true);
    try {
      const response = await fetch("/api/cartoon/regenerate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: cartoon.scenes[index],
          sceneNumber: index + 1,
          context: cartoon.originalStory,
        }),
      });

      if (response.ok) {
        const regeneratedScene: CartoonScene = await response.json();
        setCartoon((prev) => {
          const newScenes = [...prev.scenes];
          newScenes[index] = regeneratedScene;
          return { ...prev, scenes: newScenes };
        });
        setSelectedElementIndex(null);
        setSelectedDialogueIndex(null);
      }
    } catch (err) {
      console.error("Failed to regenerate scene:", err);
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Top Header / Action Bar */}
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onResetStory}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <span>←</span>
            <span>New Story</span>
          </button>

          <input
            type="text"
            value={cartoon.title}
            onChange={(e) => setCartoon((prev) => ({ ...prev, title: e.target.value }))}
            className="rounded-xl border border-transparent px-2.5 py-1 text-lg font-bold text-slate-900 outline-none transition hover:border-slate-200 focus:border-violet-500 focus:bg-slate-50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAssetPickerMode("add");
              setIsAssetPickerOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <span>+</span>
            <span>Add Asset</span>
          </button>

          <button
            onClick={() => setIsSlideshowOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <span>▶</span>
            <span>Preview Story</span>
          </button>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <span>📥</span>
            <span>Export Cartoon</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Grid: Canvas (Left/Center) + Inspector (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Visual Canvas Area */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <CartoonCanvas
            stageRef={stageRef}
            scene={currentScene}
            selectedElementIndex={selectedElementIndex}
            selectedDialogueIndex={selectedDialogueIndex}
            onSelectElement={(idx) => {
              setSelectedElementIndex(idx);
              if (idx !== null) setSelectedDialogueIndex(null);
            }}
            onSelectDialogue={(idx) => {
              setSelectedDialogueIndex(idx);
              if (idx !== null) setSelectedElementIndex(null);
            }}
            onUpdateElement={handleUpdateElement}
            onUpdateDialogue={handleUpdateDialogue}
          />

          {/* Filmstrip Timeline */}
          <SceneFilmstrip
            scenes={cartoon.scenes}
            currentSceneIndex={currentSceneIndex}
            isRegenerating={isRegenerating}
            onSelectScene={(idx) => {
              setCurrentSceneIndex(idx);
              setSelectedElementIndex(null);
              setSelectedDialogueIndex(null);
            }}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onDuplicateScene={handleDuplicateScene}
            onRegenerateScene={handleRegenerateScene}
            onMoveScene={handleMoveScene}
          />
        </div>

        {/* Right Inspector & Controls Panel */}
        <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {/* Element Inspector */}
          {selectedElement && selectedElementIndex !== null ? (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selected Item
                </span>
                <button
                  onClick={() => setSelectedElementIndex(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Deselect
                </button>
              </div>

              {/* Item Info */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-inner">
                  {ASSETS_BY_ID.get(selectedElement.asset)?.image ? (
                    <Image
                      src={ASSETS_BY_ID.get(selectedElement.asset)!.image}
                      alt={selectedElement.asset}
                      width={48}
                      height={48}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {ASSETS_BY_ID.get(selectedElement.asset)?.name || selectedElement.asset}
                  </h3>
                  <p className="text-xs text-slate-500 capitalize">
                    {selectedElement.type} • {selectedElement.action}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setAssetPickerMode("replace");
                    setIsAssetPickerOpen(true);
                  }}
                  className="rounded-xl border border-violet-200 bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                >
                  🔄 Replace Asset
                </button>
                <button
                  onClick={() => handleToggleFlip(selectedElementIndex)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  ↔ Flip Look
                </button>
              </div>

              {/* Scale Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Size (Scale)</span>
                  <span>{Math.round((selectedElement.scale || 0.65) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={selectedElement.scale || 0.65}
                  onChange={(e) =>
                    handleUpdateElement(selectedElementIndex, {
                      scale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-violet-600"
                />
              </div>

              {/* Layer Ordering */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Layer Order</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleMoveLayer(selectedElementIndex, "down")}
                    disabled={selectedElementIndex === 0}
                    className="rounded-xl border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Send Back
                  </button>
                  <button
                    onClick={() => handleMoveLayer(selectedElementIndex, "up")}
                    disabled={selectedElementIndex === currentScene.elements.length - 1}
                    className="rounded-xl border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Bring Front
                  </button>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteElement(selectedElementIndex)}
                className="mt-2 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Delete from Scene
              </button>
            </div>
          ) : selectedDialogue && selectedDialogueIndex !== null ? (
            /* Dialogue Inspector */
            <div className="flex flex-col gap-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Edit Speech Bubble
                </span>
                <button
                  onClick={() => setSelectedDialogueIndex(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Deselect
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Speaker</label>
                  <input
                    type="text"
                    value={selectedDialogue.speaker}
                    onChange={(e) =>
                      handleUpdateDialogue(selectedDialogueIndex, { speaker: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Dialogue Text</label>
                  <textarea
                    rows={3}
                    value={selectedDialogue.text}
                    onChange={(e) =>
                      handleUpdateDialogue(selectedDialogueIndex, { text: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={() => handleDeleteDialogue(selectedDialogueIndex)}
                className="mt-2 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                Delete Speech Bubble
              </button>
            </div>
          ) : (
            /* Default: Scene Inspector */
            <div className="flex flex-col gap-5 animate-in fade-in">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Scene {currentScene.sceneNumber} Settings
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Configure backdrop and speech bubbles
                </p>
              </div>

              {/* Background Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Backdrop
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_OPTIONS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => updateCurrentScene({ background: bg.id })}
                      className={`flex flex-col items-center rounded-xl border p-2 text-xs font-medium transition ${
                        currentScene.background === bg.id
                          ? "border-violet-600 bg-violet-50 text-violet-700 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-semibold">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech Bubbles */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Speech Bubbles
                  </label>
                  <button
                    onClick={handleAddDialogue}
                    className="text-xs font-semibold text-violet-600 hover:underline"
                  >
                    + Add Bubble
                  </button>
                </div>

                <div className="space-y-2">
                  {currentScene.dialogue.map((diag, dIdx) => (
                    <button
                      key={`bubble-${dIdx}`}
                      onClick={() => setSelectedDialogueIndex(dIdx)}
                      className="flex w-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-violet-300 hover:bg-white"
                    >
                      <span className="text-[11px] font-bold text-violet-700">
                        {diag.speaker}
                      </span>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-700">
                        &ldquo;{diag.text}&rdquo;
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items in Scene */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Items ({currentScene.elements.length})
                  </label>
                  <button
                    onClick={() => {
                      setAssetPickerMode("add");
                      setIsAssetPickerOpen(true);
                    }}
                    className="text-xs font-semibold text-violet-600 hover:underline"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentScene.elements.map((el, elIdx) => {
                    const elAsset = ASSETS_BY_ID.get(el.asset);
                    return (
                      <button
                        key={`elem-badge-${elIdx}`}
                        onClick={() => setSelectedElementIndex(elIdx)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-violet-400 hover:bg-white"
                      >
                        {elAsset?.name || el.asset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modals */}
      <AssetPickerModal
        isOpen={isAssetPickerOpen}
        mode={assetPickerMode}
        currentAssetId={selectedElement?.asset}
        onClose={() => setIsAssetPickerOpen(false)}
        onSelectAsset={(asset) => {
          if (assetPickerMode === "add") {
            handleAddAsset(asset);
          } else {
            handleReplaceAsset(asset);
          }
        }}
      />

      <SlideshowModal
        isOpen={isSlideshowOpen}
        cartoon={cartoon}
        initialSceneIndex={currentSceneIndex}
        onClose={() => setIsSlideshowOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        cartoon={cartoon}
        currentSceneIndex={currentSceneIndex}
        stageRef={stageRef}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
