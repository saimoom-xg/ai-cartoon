"use client";

import { useState } from "react";
import { ASSETS } from "@/lib/assets/library";
import type { AssetMetadata, AssetType } from "@/lib/types/cartoon";
import Image from "next/image";

interface AssetPickerModalProps {
  isOpen: boolean;
  mode: "add" | "replace";
  currentAssetId?: string;
  onClose: () => void;
  onSelectAsset: (asset: AssetMetadata) => void;
}

const TABS: Array<{ label: string; value: AssetType | "all" }> = [
  { label: "All Assets", value: "all" },
  { label: "Characters", value: "character" },
  { label: "Animals", value: "animal" },
  { label: "Vehicles", value: "vehicle" },
  { label: "Objects", value: "object" },
  { label: "Backgrounds", value: "background" },
];

export default function AssetPickerModal({
  isOpen,
  mode,
  currentAssetId,
  onClose,
  onSelectAsset,
}: AssetPickerModalProps) {
  const [activeTab, setActiveTab] = useState<AssetType | "all">("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredAssets = ASSETS.filter((asset) => {
    if (activeTab !== "all" && asset.type !== activeTab) {
      if (activeTab === "background" && asset.type === "building") return true;
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchDesc = asset.description.toLowerCase().includes(q);
      const matchTags = asset.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTags;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "replace" ? "Replace Cartoon Asset" : "Add Asset to Scene"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "replace"
                ? "Choose a replacement asset from your library"
                : "Select any character, animal, vehicle, or scenery item"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeTab === tab.value
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-6 sm:grid-cols-3 md:grid-cols-4">
          {filteredAssets.map((asset) => {
            const isCurrent = asset.id === currentAssetId;
            return (
              <button
                key={asset.id}
                onClick={() => {
                  onSelectAsset(asset);
                  onClose();
                }}
                className={`group flex flex-col items-center rounded-2xl border p-4 text-center transition hover:-translate-y-1 hover:shadow-md ${
                  isCurrent
                    ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-400"
                    : "border-slate-200 bg-slate-50/50 hover:border-violet-300 hover:bg-white"
                }`}
              >
                <div className="relative mb-3 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-inner">
                  <Image
                    src={asset.image}
                    alt={asset.name}
                    width={96}
                    height={96}
                    className="max-h-full max-w-full object-contain transition duration-200 group-hover:scale-105"
                  />
                </div>
                <span className="font-semibold text-slate-900">{asset.name}</span>
                <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                  {asset.type}
                </span>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {asset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
