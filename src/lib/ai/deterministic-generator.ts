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

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function chunkSentences(sentences: string[], count: number): string[][] {
  const groups: string[][] = [];
  const size = Math.max(1, Math.ceil(sentences.length / count));
  for (let i = 0; i < sentences.length; i += size) {
    groups.push(sentences.slice(i, i + size));
  }
  return groups;
}

export function detectSceneBackground(text: string): string {
  const clean = normalize(text);
  if (clean.includes("park") || clean.includes("garden") || clean.includes("grass")) return "park";
  if (clean.includes("house") || clean.includes("home") || clean.includes("room")) return "house";
  if (clean.includes("school") || clean.includes("class") || clean.includes("learn")) return "school";
  if (clean.includes("street") || clean.includes("road") || clean.includes("drive") || clean.includes("city")) return "street";
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

  if (lower.includes("boy") || lower.includes("kid") || lower.includes("child")) foundChars.add("boy");
  if (lower.includes("girl")) foundChars.add("girl");
  if (lower.includes("friend") || lower.includes("buddy")) foundChars.add("friend");
  if (lower.includes("old man") || lower.includes("grandfather") || lower.includes("elder")) foundChars.add("old-man");

  if (lower.includes("dog") || lower.includes("puppy")) foundAnimals.add("dog");
  if (lower.includes("cat") || lower.includes("kitten")) foundAnimals.add("cat");

  if (lower.includes("car") || lower.includes("drive") || lower.includes("vehicle")) foundVehicles.add("red-car");

  if (lower.includes("football") || lower.includes("ball") || lower.includes("soccer")) foundObjects.add("football");
  if (lower.includes("tree")) foundObjects.add("tree");

  return {
    characters: Array.from(foundChars),
    animals: Array.from(foundAnimals),
    vehicles: Array.from(foundVehicles),
    objects: Array.from(foundObjects),
  };
}

export function generateDeterministicCartoon(story: string): GeneratedCartoon {
  const sentences = splitSentences(story);
  const totalScenes = Math.min(6, Math.max(2, Math.ceil(sentences.length / 2)));
  const sentenceGroups = chunkSentences(
    sentences.length > 0 ? sentences : [story],
    totalScenes,
  );

  // Global entity detection for character consistency across the entire story
  const overall = detectEntities(story);
  const primaryCharacter = overall.characters[0] || "boy";
  const primaryAnimal = overall.animals[0] || (story.toLowerCase().includes("dog") ? "dog" : undefined);
  const primaryVehicle = overall.vehicles[0] || (story.toLowerCase().includes("car") ? "red-car" : undefined);

  const scenes: CartoonScene[] = sentenceGroups.map((group, index) => {
    const sceneText = group.join(" ");
    const sceneEntities = detectEntities(sceneText);
    const background = detectSceneBackground(sceneText);

    // Keep primary character consistent
    const activeChars = sceneEntities.characters.length > 0
      ? sceneEntities.characters
      : [primaryCharacter];
    
    // Add friend if mentioned or second half of story
    if (sceneText.toLowerCase().includes("friend") && !activeChars.includes("friend")) {
      activeChars.push("friend");
    }

    const elements: CartoonElement[] = [];

    // Position characters nicely
    if (activeChars.length === 1) {
      elements.push({
        asset: activeChars[0],
        type: "character",
        action: index === 0 ? "walking" : "standing",
        x: 280,
        y: 260,
        scale: 0.65,
      });
    } else {
      activeChars.slice(0, 3).forEach((charId, cIdx) => {
        elements.push({
          asset: charId,
          type: "character",
          action: "talking",
          x: cIdx === 0 ? 220 : 540 + (cIdx - 1) * 140,
          y: 260,
          scale: 0.65,
          flipX: cIdx > 0, // Face left towards protagonist
        });
      });
    }

    // Animals
    const activeAnimals = sceneEntities.animals.length > 0
      ? sceneEntities.animals
      : (primaryAnimal && (index === 0 || sceneText.toLowerCase().includes("dog") || sceneText.toLowerCase().includes("cat")) ? [primaryAnimal] : []);

    activeAnimals.forEach((animId) => {
      elements.push({
        asset: animId,
        type: "animal",
        action: "playing",
        x: elements.length > 0 ? elements[0].x + 160 : 420,
        y: 330,
        scale: 0.55,
      });
    });

    // Vehicles
    const activeVehicles = sceneEntities.vehicles.length > 0
      ? sceneEntities.vehicles
      : (primaryVehicle && (index === sentenceGroups.length - 1 || sceneText.toLowerCase().includes("car")) ? [primaryVehicle] : []);

    activeVehicles.forEach((vehId) => {
      elements.push({
        asset: vehId,
        type: "vehicle",
        action: "driving",
        x: 580,
        y: 300,
        scale: 0.65,
      });
    });

    // Objects
    sceneEntities.objects.forEach((objId) => {
      elements.push({
        asset: objId,
        type: "object",
        action: "present",
        x: objId === "tree" ? 780 : 450,
        y: objId === "tree" ? 180 : 380,
        scale: objId === "tree" ? 0.75 : 0.45,
      });
    });

    // Add tree if background is park and no tree added yet
    if (background === "park" && !elements.some((e) => e.asset === "tree")) {
      elements.unshift({
        asset: "tree",
        type: "object",
        action: "scenery",
        x: 800,
        y: 160,
        scale: 0.7,
      });
    }

    // Dialogue
    const speakerAsset = ASSETS_BY_ID.get(activeChars[0]);
    const speakerName = speakerAsset?.name || "Boy";
    const dialogueSnippet = group[0] ? group[0].replace(/\.$/, "") : "What a great adventure!";

    const dialogue: CartoonDialogue[] = [
      {
        speaker: speakerName,
        text: dialogueSnippet,
        x: 220,
        y: 110,
      },
    ];

    if (activeChars.length > 1 && group.length > 1) {
      const secondSpeaker = ASSETS_BY_ID.get(activeChars[1])?.name || "Friend";
      dialogue.push({
        speaker: secondSpeaker,
        text: group[1].replace(/\.$/, ""),
        x: 520,
        y: 130,
      });
    }

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

function extractTitle(story: string): string {
  const firstSentence = story.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return "Cartoon Adventure";
  if (firstSentence.length <= 40) return firstSentence;
  return firstSentence.slice(0, 36) + "...";
}
