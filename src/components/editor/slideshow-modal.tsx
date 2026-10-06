"use client";

import { useState, useEffect } from "react";
import type { GeneratedCartoon } from "@/lib/types/cartoon";
import { ASSETS_BY_ID } from "@/lib/assets/library";
import Image from "next/image";

interface SlideshowModalProps {
  isOpen: boolean;
  cartoon: GeneratedCartoon;
  initialSceneIndex?: number;
  onClose: () => void;
}

export default function SlideshowModal({
  isOpen,
  cartoon,
  initialSceneIndex = 0,
  onClose,
}: SlideshowModalProps) {
  if (!isOpen) return null;

  return (
    <SlideshowContent
      key={`slide-${initialSceneIndex}`}
      cartoon={cartoon}
      initialSceneIndex={initialSceneIndex}
      onClose={onClose}
    />
  );
}

function SlideshowContent({
  cartoon,
  initialSceneIndex,
  onClose,
}: {
  cartoon: GeneratedCartoon;
  initialSceneIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialSceneIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= cartoon.scenes.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, cartoon.scenes.length]);

  const scene = cartoon.scenes[currentIndex];
  if (!scene) return null;

  const bgAsset = ASSETS_BY_ID.get(scene.background);
  const bgImage = bgAsset?.image || `/assets/backgrounds/park.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
              Preview Mode
            </span>
            <h2 className="text-base font-bold text-white">{cartoon.title}</h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">
              Scene {currentIndex + 1} of {cartoon.scenes.length}
            </span>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Main Stage View */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-6">
          <div className="relative aspect-[1000/600] w-full max-w-4xl overflow-hidden rounded-2xl border-2 border-white/10 shadow-2xl">
            {/* Background */}
            <Image
              src={bgImage}
              alt={scene.background}
              fill
              className="object-cover"
              priority
            />

            {/* Elements Layer */}
            {scene.elements.map((el, elIdx) => {
              const elAsset = ASSETS_BY_ID.get(el.asset);
              if (!elAsset) return null;

              // Convert 1000x600 coordinates to percentages
              const leftPct = (el.x / 1000) * 100;
              const topPct = (el.y / 600) * 100;
              const widthPct = ((300 * el.scale) / 1000) * 100;

              return (
                <div
                  key={`slide-el-${elIdx}`}
                  className="absolute pointer-events-none transition-all duration-300"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    transform: el.flipX ? "scaleX(-1)" : "none",
                  }}
                >
                  <Image
                    src={elAsset.image}
                    alt={elAsset.name}
                    width={300}
                    height={300}
                    className="h-auto w-full object-contain drop-shadow-xl"
                  />
                </div>
              );
            })}

            {/* Speech Bubbles */}
            {scene.dialogue.map((diag, dIdx) => {
              const leftPct = ((diag.x ?? 180 + dIdx * 280) / 1000) * 100;
              const topPct = ((diag.y ?? 100 + dIdx * 70) / 600) * 100;

              return (
                <div
                  key={`slide-diag-${dIdx}`}
                  className="absolute pointer-events-none z-10 max-w-[280px] rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-2xl"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                >
                  <span className="inline-block rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {diag.speaker}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    &ldquo;{diag.text}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950 px-6 py-4">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-violet-700"
            >
              <span>{isPlaying ? "⏸" : "▶"}</span>
              <span>{isPlaying ? "Pause" : "Play Story"}</span>
            </button>

            <div className="flex gap-1.5">
              {cartoon.scenes.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`h-2.5 rounded-full transition-all ${
                    dotIdx === currentIndex
                      ? "w-8 bg-violet-500"
                      : "w-2.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(cartoon.scenes.length - 1, prev + 1))}
            disabled={currentIndex === cartoon.scenes.length - 1}
            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
