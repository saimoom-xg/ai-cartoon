"use client";

import { useState } from "react";
import type Konva from "konva";
import type { GeneratedCartoon } from "@/lib/types/cartoon";

interface ExportModalProps {
  isOpen: boolean;
  cartoon: GeneratedCartoon;
  currentSceneIndex: number;
  stageRef: React.RefObject<Konva.Stage | null>;
  onClose: () => void;
}

export default function ExportModal({
  isOpen,
  cartoon,
  currentSceneIndex,
  stageRef,
  onClose,
}: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  function handleExportCurrentScenePNG() {
    if (!stageRef.current) return;
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${cartoon.title.toLowerCase().replace(/\s+/g, "-")}-scene-${currentSceneIndex + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export image:", err);
    }
  }

  function handleExportJSON() {
    const jsonStr = JSON.stringify(cartoon, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${cartoon.title.toLowerCase().replace(/\s+/g, "-")}-scenes.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyJSON() {
    navigator.clipboard.writeText(JSON.stringify(cartoon, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrintPDF() {
    // Open print dialog formatted for comic pages
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cartoon.title} - Cartoon Storybook</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            h1 { text-align: center; font-size: 28px; margin-bottom: 8px; color: #4338ca; }
            .subtitle { text-align: center; color: #64748b; margin-bottom: 24px; font-size: 14px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; page-break-inside: avoid; }
            .card { border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #f8fafc; padding: 12px; }
            .scene-head { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-bottom: 8px; }
            .dialogue-box { background: white; border: 1.5px solid #0f172a; border-radius: 8px; padding: 8px 12px; margin-top: 8px; }
            .speaker { font-weight: bold; color: #7c3aed; font-size: 12px; }
            .dialogue-text { font-size: 13px; margin-top: 2px; }
          </style>
        </head>
        <body>
          <h1>${cartoon.title}</h1>
          <p class="subtitle">${cartoon.originalStory || "Created with AI Cartoon Story Generator"}</p>
          <div class="grid">
            ${cartoon.scenes
              .map(
                (scene) => `
              <div class="card">
                <div class="scene-head">
                  <span>Scene ${scene.sceneNumber}</span>
                  <span style="color: #64748b; font-size: 12px;">Background: ${scene.background}</span>
                </div>
                <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
                  Characters & Items: ${scene.elements.map((e) => e.asset).join(", ") || "None"}
                </div>
                ${scene.dialogue
                  .map(
                    (d) => `
                  <div class="dialogue-box">
                    <span class="speaker">${d.speaker}</span>
                    <div class="dialogue-text">"${d.text}"</div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            `,
              )
              .join("")}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Export Cartoon</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Download your cartoon images, printable PDF, or scene data
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {/* PNG Option */}
          <button
            onClick={() => {
              handleExportCurrentScenePNG();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg text-white">
                🖼️
              </span>
              <div>
                <span className="font-semibold text-slate-900">Export Scene as PNG</span>
                <p className="text-xs text-slate-500">High-resolution image of current scene</p>
              </div>
            </div>
            <span className="text-xs font-bold text-violet-600">Download</span>
          </button>

          {/* PDF Storybook Option */}
          <button
            onClick={() => {
              handlePrintPDF();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-lg text-white">
                📄
              </span>
              <div>
                <span className="font-semibold text-slate-900">Export Comic Book (PDF / Print)</span>
                <p className="text-xs text-slate-500">Multi-panel printable storybook layout</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600">Print / PDF</span>
          </button>

          {/* JSON Option */}
          <button
            onClick={() => {
              handleExportJSON();
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-lg text-white">
                📦
              </span>
              <div>
                <span className="font-semibold text-slate-900">Download Scene Plan (JSON)</span>
                <p className="text-xs text-slate-500">Structured data with asset coordinates</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600">JSON</span>
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={handleCopyJSON}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {copied ? "✓ Copied JSON" : "Copy JSON"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
