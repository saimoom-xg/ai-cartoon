export const STORY_STYLES = [
  "3D Cartoon",
  "2D Storybook",
  "Anime",
  "Watercolor",
  "Comic",
] as const;

export type StoryStyle = (typeof STORY_STYLES)[number];

export const STORY_QUALITIES = ["fast", "standard", "high"] as const;

export type StoryQuality = (typeof STORY_QUALITIES)[number];

export type GeneratedImageSize = "1K" | "2K" | "4K";

export interface CharacterAppearance {
  age: string;
  gender: string;
  face: string;
  hair: string;
  eyes: string;
  skinTone: string;
  bodyType: string;
  clothing: string;
  shoes: string;
  accessories: string;
}

export interface StoryCharacter {
  id: string;
  name: string;
  appearance: CharacterAppearance;
  personality: string[];
  distinguishingTraits: string[];
}

export interface SceneCamera {
  shot: string;
  angle: string;
  composition: string;
}

export interface PlannedStoryScene {
  sceneNumber: number;
  title: string;
  storyBeat: string;
  characters: string[];
  location: string;
  time: string;
  weather: string;
  action: string;
  emotion: string;
  camera: SceneCamera;
  lighting: string;
  imagePrompt: string;
}

export interface StoryPlan {
  title: string;
  genre: string;
  audience: string;
  tone: string;
  visualStyle: {
    style: StoryStyle;
    lighting: string;
    colorPalette: string;
    detailLevel: string;
  };
  characters: StoryCharacter[];
  scenes: PlannedStoryScene[];
}

export type SceneGenerationStatus = "pending" | "generating" | "completed" | "failed";

export interface StorybookScene extends PlannedStoryScene {
  status: SceneGenerationStatus;
  imageUrl?: string;
  error?: string;
  style: StoryStyle;
}

export interface Storybook {
  id: string;
  title: string;
  originalStory: string;
  genre: string;
  tone: string;
  style: StoryStyle;
  visualStyle: StoryPlan["visualStyle"];
  quality: StoryQuality;
  characters: StoryCharacter[];
  characterReferenceUrl?: string;
  coverImageUrl?: string;
  scenes: StorybookScene[];
}
