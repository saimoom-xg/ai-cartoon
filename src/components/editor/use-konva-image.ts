"use client";

import { useSyncExternalStore } from "react";

interface ImageEntry {
  image: HTMLImageElement | null;
  loaded: boolean;
}

const cache = new Map<string, ImageEntry>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const emptyEntry: ImageEntry = { image: null, loaded: false };

export function useKonvaImage(src: string): [HTMLImageElement | null, boolean] {
  if (src && !cache.has(src)) {
    const entry: ImageEntry = { image: null, loaded: false };
    cache.set(src, entry);
    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        entry.image = img;
        entry.loaded = true;
        notify();
      };
      img.onerror = () => {
        entry.loaded = false;
        notify();
      };
    }
  }

  const snapshot = useSyncExternalStore(
    subscribe,
    () => (src ? cache.get(src) || emptyEntry : emptyEntry),
    () => emptyEntry,
  );

  return [snapshot.image, snapshot.loaded];
}
