import { ASSETS_BY_ID } from "../assets/library.ts";
import type {
  CartoonElement,
  CartoonDialogue,
  CartoonScene,
  GeneratedCartoon,
} from "../types/cartoon.ts";

function normalize(value = ""): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text);
}

function splitStoryBeats(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .flatMap((sentence) => {
      const beats = sentence.split(/\s+and then\s+/i);
      return beats.map((beat, index) => {
        if (
          index === 0 ||
          /^(he|she|they|it|we|i)\b/i.test(beat) ||
          !/^(go|goes|walk|walks|head|heads|return|returns|drive|drives|run|runs|travel|travels|leave|leaves|arrive|arrives)\b/i.test(beat)
        ) {
          return beat.trim();
        }
        return `They ${beat.trim()}`;
      });
    });
}

function chunkSentences(sentences: string[], count: number): string[][] {
  const groups: string[][] = [];
  for (let i = 0; i < count; i += 1) {
    const start = Math.floor((i * sentences.length) / count);
    const end = Math.floor(((i + 1) * sentences.length) / count);
    groups.push(sentences.slice(start, end));
  }
  return groups;
}

export function detectSceneBackground(text: string): string {
  const clean = normalize(text);
  if (["park", "garden", "grass", "playground"].some((term) => containsTerm(clean, term))) return "park";
  if (["house", "home", "room", "kitchen", "bedroom"].some((term) => containsTerm(clean, term))) return "house";
  if (["school", "class", "learn"].some((term) => containsTerm(clean, term))) return "school";
  if (["street", "road", "drive", "city"].some((term) => containsTerm(clean, term))) return "street";
  return "park";
}

export function detectEntities(text: string): {
  characters: string[];
  animals: string[];
  vehicles: string[];
  objects: string[];
} {
  const lower = normalize(text);
  const foundChars = new Set<string>();
  const foundAnimals = new Set<string>();
  const foundVehicles = new Set<string>();
  const foundObjects = new Set<string>();

  if (["boy", "kid", "child"].some((term) => containsTerm(lower, term))) foundChars.add("boy");
  if (containsTerm(lower, "girl")) foundChars.add("girl");
  if (["friend", "buddy"].some((term) => containsTerm(lower, term))) foundChars.add("friend");
  if (["old man", "grandfather", "elder"].some((term) => containsTerm(lower, term))) foundChars.add("old-man");

  if (["dog", "puppy"].some((term) => containsTerm(lower, term))) foundAnimals.add("dog");
  if (["cat", "kitten"].some((term) => containsTerm(lower, term))) foundAnimals.add("cat");

  if (["car", "drive", "vehicle"].some((term) => containsTerm(lower, term))) foundVehicles.add("red-car");

  if (["football", "ball", "soccer"].some((term) => containsTerm(lower, term))) foundObjects.add("football");
  if (containsTerm(lower, "tree")) foundObjects.add("tree");

  return {
    characters: Array.from(foundChars),
    animals: Array.from(foundAnimals),
    vehicles: Array.from(foundVehicles),
    objects: Array.from(foundObjects),
  };
}

export function generateDeterministicCartoon(story: string): GeneratedCartoon {
  const sentences = splitStoryBeats(story);
  const totalScenes = Math.min(6, Math.max(1, sentences.length));
  const sentenceGroups = chunkSentences(
    sentences.length > 0 ? sentences : [story],
    totalScenes,
  );

  const overall = detectEntities(story);
  const primaryCharacter = overall.characters[0] || "boy";
  const knownCharacters = new Set<string>();
  const knownAnimals = new Set<string>();

  const scenes: CartoonScene[] = sentenceGroups.map((group, index) => {
    const sceneText = group.join(" ");
    const sceneEntities = detectEntities(sceneText);
    const background = detectSceneBackground(sceneText);
    const refersToPreviousCast = /\b(he|she|they|him|her|them|his|their|together|both)\b/i.test(sceneText);
    const activeChars = [...new Set([
      primaryCharacter,
      ...(refersToPreviousCast ? knownCharacters : []),
      ...sceneEntities.characters,
    ])];
    const activeAnimals = [...new Set([
      ...sceneEntities.animals,
      ...(refersToPreviousCast ? knownAnimals : []),
    ])];

    const elements: CartoonElement[] = [];

    const characterScale = activeChars.length === 1 ? 0.58 : activeChars.length === 2 ? 0.5 : 0.42;
    const characterXs = activeChars.length === 1
      ? [380]
      : activeChars.length === 2
        ? [140, 470]
        : [70, 365, 660];
    const action = inferAction(sceneText);

    activeChars.slice(0, 3).forEach((charId, charIndex) => {
      elements.push({
        asset: charId,
        type: "character",
        action,
        x: characterXs[charIndex],
        y: 250,
        scale: characterScale,
        flipX: charIndex > 0,
      });
    });

    activeAnimals.forEach((animId, animalIndex) => {
      elements.push({
        asset: animId,
        type: "animal",
        action,
        x: activeChars.length > 1 ? 740 + animalIndex * 90 : 650 + animalIndex * 90,
        y: 340,
        scale: 0.38,
      });
    });

    sceneEntities.vehicles.forEach((vehId) => {
      elements.push({
        asset: vehId,
        type: "vehicle",
        action: inferAction(sceneText, true),
        x: 650,
        y: 300,
        scale: 0.55,
      });
    });

    sceneEntities.objects.forEach((objId) => {
      elements.push({
        asset: objId,
        type: "object",
        action,
        x: objId === "tree" ? 730 : 455,
        y: objId === "tree" ? 100 : 400,
        scale: objId === "tree" ? 0.5 : 0.22,
      });
    });

    sceneEntities.characters.forEach((charId) => knownCharacters.add(charId));
    sceneEntities.animals.forEach((animalId) => knownAnimals.add(animalId));

    const speakerAsset = ASSETS_BY_ID.get(activeChars[0]);
    const speakerName = speakerAsset?.name || "Boy";
    const dialogue: CartoonDialogue[] = [...sceneText.matchAll(/["“]([^"”]+)["”]/g)]
      .slice(0, 10)
      .map((match, dialogueIndex) => ({
        speaker: ASSETS_BY_ID.get(activeChars[dialogueIndex] || activeChars[0])?.name || speakerName,
        text: match[1].trim().slice(0, 500),
        x: 160 + dialogueIndex * 360,
        y: 70 + dialogueIndex * 30,
      }));

    return {
      sceneNumber: index + 1,
      background,
      elements,
      dialogue,
    };
  });

  return {
    title: extractTitle(story),
    originalStory: story,
    totalScenes: scenes.length,
    scenes,
  };
}

function inferAction(text: string, isVehicle = false): string {
  const clean = normalize(text);
  if (/\b(meet|meets|met|greet|greets|greeted)\b/.test(clean)) return "greeting";
  if (/\b(play|played|playing|kick|kicked|football|soccer)\b/.test(clean)) return "playing";
  if (/\b(read|reads|reading|book|books)\b/.test(clean)) return "reading";
  if (/\b(run|runs|running|ran)\b/.test(clean)) return "running";
  if (isVehicle && /\b(drive|drives|driving|drove|ride|rides|riding|go|goes|went)\b/.test(clean)) {
    return "driving";
  }
  if (/\b(walk|walks|walking|walked|go|goes|went)\b/.test(clean)) return "walking";
  if (/\b(see|sees|seeing|look|looks|looking|watch|watches)\b/.test(clean)) return "looking";
  return "standing";
}

function extractTitle(story: string): string {
  const firstSentence = story.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return "Cartoon Adventure";
  if (firstSentence.length <= 40) return firstSentence;
  return firstSentence.slice(0, 36) + "...";
}
