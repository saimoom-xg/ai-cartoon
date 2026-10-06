"use client";

import { Circle, Layer, Rect, Stage, Text } from "react-konva";

export default function KonvaTestCanvas() {
  return (
    <div className="max-w-full overflow-auto rounded-xl border border-gray-200 bg-white p-2">
      <Stage width={480} height={280}>
        <Layer>
          <Rect
            x={20}
            y={20}
            width={440}
            height={240}
            fill="#f5f3ff"
            cornerRadius={16}
          />
          <Circle x={240} y={125} radius={48} fill="#8b5cf6" />
          <Text
            x={40}
            y={205}
            width={400}
            align="center"
            text="Konva + React Konva are rendering"
            fontSize={18}
            fill="#312e81"
          />
        </Layer>
      </Stage>
    </div>
  );
}
