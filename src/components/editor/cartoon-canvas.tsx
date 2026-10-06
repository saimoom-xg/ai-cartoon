"use client";

import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Text as KonvaText,
  Group,
  Line,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import type { CartoonElement, CartoonDialogue, CartoonScene } from "@/lib/types/cartoon";
import { ASSETS_BY_ID } from "@/lib/assets/library";
import { useKonvaImage } from "./use-konva-image";

interface CartoonCanvasProps {
  scene: CartoonScene;
  selectedElementIndex: number | null;
  selectedDialogueIndex: number | null;
  onSelectElement: (index: number | null) => void;
  onSelectDialogue: (index: number | null) => void;
  onUpdateElement: (index: number, updates: Partial<CartoonElement>) => void;
  onUpdateDialogue: (index: number, updates: Partial<CartoonDialogue>) => void;
  stageRef?: React.RefObject<Konva.Stage | null>;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

function SceneBackground({ bgId }: { bgId: string }) {
  const asset = ASSETS_BY_ID.get(bgId);
  const imageSrc = asset?.image || `/assets/backgrounds/park.png`;
  const [img, isLoaded] = useKonvaImage(imageSrc);

  if (!isLoaded || !img) {
    return (
      <Rect
        x={0}
        y={0}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill="#bae6fd"
      />
    );
  }

  return (
    <KonvaImage
      image={img}
      x={0}
      y={0}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      listening={false}
    />
  );
}

function SceneElementItem({
  element,
  isSelected,
  onSelect,
  onUpdate,
  elementRef,
}: {
  element: CartoonElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CartoonElement>) => void;
  elementRef: (node: Konva.Group | null) => void;
}) {
  const asset = ASSETS_BY_ID.get(element.asset);
  const imageSrc = asset?.image || `/assets/characters/boy.png`;
  const [img, isLoaded] = useKonvaImage(imageSrc);

  const baseWidth = img?.naturalWidth || 400;
  const baseHeight = img?.naturalHeight || 400;
  const scale = element.scale || 0.65;
  const flip = element.flipX ? -1 : 1;

  return (
    <Group
      ref={elementRef}
      x={element.x}
      y={element.y}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragEnd={(e) => {
        onUpdate({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
      }}
    >
      {isLoaded && img ? (
        <KonvaImage
          image={img}
          x={flip === -1 ? baseWidth * scale : 0}
          y={0}
          width={baseWidth}
          height={baseHeight}
          scaleX={scale * flip}
          scaleY={scale}
          shadowColor="#000000"
          shadowBlur={isSelected ? 14 : 0}
          shadowOpacity={isSelected ? 0.35 : 0}
        />
      ) : (
        <Rect
          x={0}
          y={0}
          width={180 * scale}
          height={240 * scale}
          fill="#cbd5e1"
          cornerRadius={12}
        />
      )}

      {/* Selected Indicator Ring */}
      {isSelected && (
        <Rect
          x={-6}
          y={-6}
          width={baseWidth * scale + 12}
          height={baseHeight * scale + 12}
          stroke="#8b5cf6"
          strokeWidth={3}
          dash={[8, 5]}
          cornerRadius={8}
          listening={false}
        />
      )}
    </Group>
  );
}

function SpeechBubbleItem({
  dialogue,
  index,
  isSelected,
  onSelect,
  onUpdate,
}: {
  dialogue: CartoonDialogue;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CartoonDialogue>) => void;
}) {
  const x = dialogue.x ?? 180 + (index % 2) * 320;
  const y = dialogue.y ?? 90 + index * 80;

  // Estimate bubble dimensions based on text length
  const textLen = dialogue.text.length;
  const bubbleWidth = Math.max(180, Math.min(320, textLen * 9 + 40));
  const bubbleHeight = textLen > 35 ? 78 : 62;

  return (
    <Group
      x={x}
      y={y}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragEnd={(e) => {
        onUpdate({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
      }}
    >
      {/* Bubble Tail Triangle pointing down */}
      <Line
        points={[40, bubbleHeight - 2, 55, bubbleHeight + 20, 70, bubbleHeight - 2]}
        closed
        fill="#ffffff"
        stroke="#1e293b"
        strokeWidth={3}
      />

      {/* Main Bubble */}
      <Rect
        x={0}
        y={0}
        width={bubbleWidth}
        height={bubbleHeight}
        fill="#ffffff"
        stroke={isSelected ? "#7c3aed" : "#1e293b"}
        strokeWidth={isSelected ? 4 : 3}
        cornerRadius={16}
        shadowColor="#0f172a"
        shadowBlur={10}
        shadowOpacity={0.15}
        shadowOffsetY={4}
      />

      {/* Mask over the tail junction */}
      <Line
        points={[43, bubbleHeight - 3, 67, bubbleHeight - 3]}
        stroke="#ffffff"
        strokeWidth={5}
      />

      {/* Speaker Name Tag */}
      <Rect
        x={12}
        y={-11}
        width={dialogue.speaker.length * 8 + 18}
        height={20}
        fill="#7c3aed"
        cornerRadius={6}
      />
      <KonvaText
        x={18}
        y={-8}
        text={dialogue.speaker}
        fontSize={11}
        fontStyle="bold"
        fill="#ffffff"
      />

      {/* Dialogue Text */}
      <KonvaText
        x={16}
        y={14}
        width={bubbleWidth - 32}
        text={dialogue.text}
        fontSize={14}
        fontFamily="sans-serif"
        fill="#0f172a"
        lineHeight={1.3}
      />
    </Group>
  );
}

export default function CartoonCanvas({
  scene,
  selectedElementIndex,
  selectedDialogueIndex,
  onSelectElement,
  onSelectDialogue,
  onUpdateElement,
  onUpdateDialogue,
  stageRef,
}: CartoonCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const localStageRef = useRef<Konva.Stage | null>(null);
  const effectiveStageRef = stageRef || localStageRef;

  const trRef = useRef<Konva.Transformer | null>(null);
  const elementNodesRef = useRef<Map<number, Konva.Group>>(new Map());

  // Responsive canvas scaling
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setScaleFactor(containerWidth / CANVAS_WIDTH);
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Update Transformer attachment
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedElementIndex !== null) {
      const node = elementNodesRef.current.get(selectedElementIndex);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    trRef.current.nodes([]);
    trRef.current.getLayer()?.batchDraw();
  }, [selectedElementIndex, scene.elements]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-900 shadow-xl"
      style={{
        height: CANVAS_HEIGHT * scaleFactor,
      }}
      onClick={() => {
        onSelectElement(null);
        onSelectDialogue(null);
      }}
    >
      <Stage
        ref={effectiveStageRef}
        width={CANVAS_WIDTH * scaleFactor}
        height={CANVAS_HEIGHT * scaleFactor}
        scaleX={scaleFactor}
        scaleY={scaleFactor}
      >
        {/* Layer 1: Background Scenery */}
        <Layer>
          <SceneBackground bgId={scene.background} />
        </Layer>

        {/* Layer 2: Characters, Animals, Objects, Vehicles */}
        <Layer>
          {scene.elements.map((element, idx) => (
            <SceneElementItem
              key={`${element.asset}-${idx}`}
              element={element}
              isSelected={selectedElementIndex === idx}
              onSelect={() => {
                onSelectDialogue(null);
                onSelectElement(idx);
              }}
              onUpdate={(updates) => onUpdateElement(idx, updates)}
              elementRef={(node) => {
                if (node) elementNodesRef.current.set(idx, node);
                else elementNodesRef.current.delete(idx);
              }}
            />
          ))}

          <Transformer
            ref={trRef}
            rotateEnabled={false}
            keepRatio={true}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 50 || newBox.height < 50) return oldBox;
              return newBox;
            }}
          />
        </Layer>

        {/* Layer 3: Speech Bubbles */}
        <Layer>
          {scene.dialogue.map((dialogue, idx) => (
            <SpeechBubbleItem
              key={`${dialogue.speaker}-${idx}`}
              dialogue={dialogue}
              index={idx}
              isSelected={selectedDialogueIndex === idx}
              onSelect={() => {
                onSelectElement(null);
                onSelectDialogue(idx);
              }}
              onUpdate={(updates) => onUpdateDialogue(idx, updates)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Floating Canvas Tag */}
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        Scene {scene.sceneNumber} • Drag to reposition
      </div>
    </div>
  );
}
