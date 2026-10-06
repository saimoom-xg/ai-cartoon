export const ASSET_TYPES = [
  "character",
  "animal",
  "vehicle",
  "object",
  "background",
  "building",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export interface AssetMetadata {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  image: string;
  description: string;
  tags: string[];
}

export interface CartoonElement {
  asset: string;
  type: AssetType;
  action: string;
  x: number;
  y: number;
  scale: number;
}

export interface CartoonDialogue {
  speaker: string;
  text: string;
}

export interface CartoonScene {
  sceneNumber: number;
  background: string;
  elements: CartoonElement[];
  dialogue: CartoonDialogue[];
}

export interface GeneratedCartoon {
  title: string;
  scenes: CartoonScene[];
}
