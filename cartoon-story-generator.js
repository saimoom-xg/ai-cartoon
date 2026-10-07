#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ASSET_LIBRARY_PATH = path.join(__dirname, 'assets', 'asset-library.json');
const DEFAULT_OUTPUT_PATH = path.join(__dirname, 'output', 'generated-cartoon.json');

function loadAssetLibrary() {
  const raw = fs.readFileSync(ASSET_LIBRARY_PATH, 'utf8');
  return JSON.parse(raw);
}

function normalizeText(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsTerm(text, term) {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  return new RegExp(`\\b${normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(normalizedText);
}

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+|;\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap((sentence) => {
      const clauses = sentence.split(/\s+and then\s+/i);
      return clauses.map((clause, index) => {
        if (
          index === 0 ||
          /^(he|she|they|it|we|i)\b/i.test(clause) ||
          /^[A-Z]/.test(clause)
        ) {
          return clause.trim();
        }
        return `They ${clause.trim()}`;
      });
    });
}

function chunkByCount(items, targetCount) {
  const groups = [];
  for (let i = 0; i < targetCount; i += 1) {
    const start = Math.floor((i * items.length) / targetCount);
    const end = Math.floor(((i + 1) * items.length) / targetCount);
    groups.push(items.slice(start, end));
  }
  return groups;
}

function pickMostRelevantAsset(text, assetList, requiredType) {
  const cleanText = normalizeText(text);
  const candidates = assetList.filter((asset) => {
    if (requiredType && asset.type !== requiredType) return false;
    const haystack = [asset.name, asset.description, ...(asset.tags || [])].join(' ').toLowerCase();
    return haystack.includes(cleanText) || cleanText.includes(normalizeText(asset.name)) || asset.tags.some((tag) => cleanText.includes(normalizeText(tag)));
  });

  if (candidates.length) {
    return candidates[0];
  }

  return null;
}

function matchesAssetSearch(asset, candidate) {
  const needle = normalizeText(candidate);
  const haystack = [asset.name, ...(asset.tags || [])].map((value) => normalizeText(value));
  return haystack.some((value) => value === needle || containsTerm(value, needle) || containsTerm(needle, value));
}

function detectAssets(text, assetList) {
  const lowerText = normalizeText(text);
  const selected = new Map();

  const typeMap = {
    character: ['boy', 'girl', 'friend', 'old man', 'grandfather', 'elder'],
    animal: ['dog', 'puppy', 'cat', 'kitten'],
    vehicle: ['red car', 'car', 'vehicle'],
    object: ['football', 'tree'],
    background: ['park', 'house', 'school', 'street']
  };

  for (const [type, names] of Object.entries(typeMap)) {
    names.forEach((name) => {
      const alias = normalizeText(name);
      if (!containsTerm(lowerText, alias)) return;
      const match = assetList.find((asset) => asset.type === type && matchesAssetSearch(asset, name));
      if (match && !selected.has(match.id)) {
        selected.set(match.id, match);
      }
    });

    if (type === 'background' && selected.size === 0) {
      const allBackgrounds = assetList.filter((asset) => asset.type === 'background');
      const match = allBackgrounds.find((asset) => lowerText.includes(normalizeText(asset.name)) || (asset.tags || []).some((tag) => lowerText.includes(normalizeText(tag))));
      if (match) {
        selected.set(match.id, match);
      }
    }
  }

  const namedCharacters = ['boy', 'girl', 'friend', 'old man', 'man', 'child', 'kid'];

  namedCharacters.forEach((name) => {
    const alias = normalizeText(name);
    if (!containsTerm(lowerText, alias)) return;
    const asset = assetList.find((item) => item.type === 'character' && matchesAssetSearch(item, name));
    if (asset && !selected.has(asset.id)) {
      selected.set(asset.id, asset);
    }
  });

  return {
    characters: [...selected.values()].filter((asset) => asset.type === 'character'),
    animals: [...selected.values()].filter((asset) => asset.type === 'animal'),
    objects: [...selected.values()].filter((asset) => asset.type === 'object' || asset.type === 'vehicle'),
    backgrounds: [...selected.values()].filter((asset) => asset.type === 'background' || asset.type === 'building')
  };
}

function inferBackground(text, previousBackground = 'park') {
  const lower = normalizeText(text);
  const choices = [
    { key: 'park', matches: ['park', 'garden', 'playground'] },
    { key: 'house', matches: ['house', 'home', 'inside', 'kitchen', 'bedroom'] },
    { key: 'school', matches: ['school', 'classroom', 'lesson'] },
    { key: 'street', matches: ['street', 'road', 'city', 'drive'] },
    { key: 'park', matches: ['tree', 'outdoor', 'play', 'football'] }
  ];

  for (const option of choices) {
    if (option.matches.some((term) => containsTerm(lower, term))) {
      return option.key;
    }
  }

  return previousBackground;
}

function createDialogue(speaker, text) {
  const fallbackText = text.length > 80 ? text.slice(0, 80).trim() + '...' : text;
  return {
    speaker,
    text: fallbackText
  };
}

function inferAction(text, type) {
  const lower = normalizeText(text);
  if (/\b(meet|meets|met|greet|greets|greeted|hello|welcome)\b/.test(lower)) return type === 'character' ? 'greeting' : 'approaching';
  if (/\b(play|played|playing|kick|kicked|game|football|soccer)\b/.test(lower)) return 'playing';
  if (/\b(read|reads|reading|book|books)\b/.test(lower)) return 'reading';
  if (/\b(run|runs|running|ran)\b/.test(lower)) return 'running';
  if (
    type === 'vehicle' &&
    (/\b(drive|drives|driving|drove|ride|rides|riding)\b/.test(lower) ||
      /\b(go|goes|went|travel|travels|traveling|travelled)\b/.test(lower))
  ) return 'driving';
  if (/\b(walk|walks|walking|walked|go|goes|went)\b/.test(lower)) return 'walking';
  if (/\b(see|sees|seeing|look|looks|looking|watch|watches)\b/.test(lower)) return 'looking';
  return 'standing';
}

function uniqueAssets(assets) {
  return [...new Map(assets.filter(Boolean).map((asset) => [asset.id, asset])).values()];
}

function buildScene(sceneNumber, sentences, assetList, continuity) {
  const combinedText = sentences.join(' ');
  const found = detectAssets(combinedText, assetList);
  const background = found.backgrounds[0]?.id || inferBackground(combinedText, continuity.background);
  const protagonist = continuity.protagonist;
  const refersToEarlierCharacters = /\b(he|she|they|him|her|them|his|their|together|both)\b/i.test(combinedText);
  const sceneCharacters = uniqueAssets([
    protagonist,
    ...(refersToEarlierCharacters ? continuity.characters : []),
    ...found.characters
  ]);
  const sceneAnimals = uniqueAssets([
    ...found.animals,
    ...(/\b(they|together|both)\b/i.test(combinedText) ? continuity.animals : [])
  ]);
  const sceneObjects = found.objects.length ? found.objects : [];
  const sceneBackground = assetList.find((asset) => asset.id === background) || assetList.find((asset) => asset.type === 'background') || assetList[0];

  continuity.background = background;
  continuity.characters = uniqueAssets([...continuity.characters, ...found.characters]);
  continuity.animals = uniqueAssets([...continuity.animals, ...found.animals]);

  return {
    scene_number: sceneNumber,
    background: sceneBackground.name,
    characters: sceneCharacters.map((asset, index) => ({
      asset: asset.id,
      action: inferAction(combinedText, 'character'),
      position: sceneCharacters.length === 1 ? 'center' : ['left', 'center', 'right'][Math.min(index, 2)]
    })),
    animals: sceneAnimals.map((asset) => ({
      asset: asset.id,
      action: inferAction(combinedText, 'animal'),
      position: sceneCharacters.length > 1 ? 'right' : 'center'
    })),
    objects: sceneObjects.map((asset) => ({
      asset: asset.id,
      action: inferAction(combinedText, asset.type),
      position: asset.type === 'vehicle' ? 'right' : 'center'
    })),
    dialogue: [...combinedText.matchAll(/["“]([^"”]+)["”]/g)].map((match) =>
      createDialogue(sceneCharacters[0]?.name || 'Narrator', match[1].trim())
    )
  };
}

function generateScenesFromStory(story, assetList) {
  const sentences = splitIntoSentences(story);
  const targetSceneCount = Math.min(6, Math.max(1, sentences.length));
  const grouped = chunkByCount(sentences, targetSceneCount);
  const allEntities = detectAssets(story, assetList);
  const continuity = {
    protagonist: allEntities.characters[0] || assetList.find((asset) => asset.id === 'boy') || assetList[0],
    characters: [],
    animals: [],
    background: 'park'
  };

  return grouped.map((group, index) => buildScene(index + 1, group, assetList, continuity));
}

function stripMarkdown(text) {
  return text.replace(/```json|```/g, '').trim();
}

async function callGemini(story, assetList) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Return valid JSON only. Create 1-6 chronological scenes, one per distinct story moment. Split a sentence into separate scenes when it describes different events or places. Keep recurring characters in later scenes when pronouns refer to them; do not replace the protagonist with a newly mentioned friend. Use only asset IDs from the provided library and give each entity an action that matches its moment. Only include dialogue that is explicitly spoken or quoted; never put narrative sentences into speech bubbles. Use this exact structure: {"title":"...","scenes":[{"scene_number":1,"background":"park","characters":[{"asset":"boy","action":"walking","position":"left"}],"animals":[{"asset":"dog","action":"walking","position":"right"}],"objects":[],"dialogue":[]}]}\nAvailable assets:\n${JSON.stringify(assetList.map(({ id, name, type, tags }) => ({ id, name, type, tags })), null, 2)}\nStory:\n${story}`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = stripMarkdown(text);
    const parsed = JSON.parse(cleaned);
    if (!parsed || !Array.isArray(parsed.scenes)) {
      return null;
    }

    return parsed;
  } catch (error) {
    return null;
  }
}

function parseArgs(argv) {
  const args = { story: '', output: DEFAULT_OUTPUT_PATH, demo: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--story') args.story = argv[i + 1] || '';
    if (arg === '--output') args.output = argv[i + 1] || DEFAULT_OUTPUT_PATH;
    if (arg === '--demo') args.demo = true;
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  if (!args.story && args.demo) {
    args.story = 'A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car.';
  }

  return args;
}

async function generateCartoon(story, assetList) {
  const aiResult = await callGemini(story, assetList);
  if (isValidAiResult(aiResult, assetList)) {
    return {
      title: aiResult.title || extractTitle(story),
      original_story: story,
      total_scenes: aiResult.scenes.length,
      scenes: aiResult.scenes
    };
  }

  const scenes = generateScenesFromStory(story, assetList);
  return {
    title: extractTitle(story),
    original_story: story,
    total_scenes: scenes.length,
    scenes
  };
}

function extractTitle(story) {
  const firstSentence = story.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return 'Cartoon Adventure';
  return firstSentence.length > 60 ? `${firstSentence.slice(0, 57).trim()}...` : firstSentence;
}

function isValidAiResult(result, assetList) {
  if (!result || !Array.isArray(result.scenes) || result.scenes.length < 1 || result.scenes.length > 6) {
    return false;
  }

  const hasAsset = (value, types) => assetList.some(
    (asset) => asset.id === value && types.includes(asset.type)
  );

  return result.scenes.every((scene, index) => {
    if (
      !scene ||
      typeof scene !== 'object' ||
      scene.scene_number !== index + 1 ||
      typeof scene.background !== 'string' ||
      !Array.isArray(scene.characters) ||
      !Array.isArray(scene.animals) ||
      !Array.isArray(scene.objects) ||
      !Array.isArray(scene.dialogue)
    ) {
      return false;
    }

    const background = assetList.find(
      (asset) => asset.id === scene.background || asset.name === scene.background
    );
    return (
      background &&
      ['background', 'building'].includes(background.type) &&
      scene.characters.every((item) =>
        item &&
        hasAsset(item.asset, ['character']) &&
        typeof item.action === 'string' &&
        ['left', 'center', 'right'].includes(item.position)
      ) &&
      scene.animals.every((item) =>
        item &&
        hasAsset(item.asset, ['animal']) &&
        typeof item.action === 'string' &&
        ['left', 'center', 'right'].includes(item.position)
      ) &&
      scene.objects.every((item) =>
        item &&
        hasAsset(item.asset, ['object', 'vehicle']) &&
        typeof item.action === 'string' &&
        ['left', 'center', 'right'].includes(item.position)
      ) &&
      scene.dialogue.length <= 10 &&
      scene.dialogue.every((item) =>
        item &&
        typeof item.speaker === 'string' &&
        typeof item.text === 'string' &&
        item.text.length <= 80
      )
    );
  });
}

module.exports = {
  detectAssets,
  generateScenesFromStory,
  isValidAiResult,
  loadAssetLibrary,
  splitIntoSentences,
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node cartoon-story-generator.js --story "Your story here" [--output output.json]\n
Optional env vars:
  GOOGLE_API_KEY=...\n`);
    return;
  }

  const story = args.story.trim();
  if (!story) {
    const stdin = fs.readFileSync(0, 'utf8').trim();
    if (!stdin) {
      console.error('Please provide a story via --story or stdin.');
      process.exit(1);
    }
    args.story = stdin;
  }

  const assetList = loadAssetLibrary();
  const cartoon = await generateCartoon(args.story, assetList);
  const outputDir = path.dirname(args.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(args.output, JSON.stringify(cartoon, null, 2));

  console.log(`Generated ${cartoon.total_scenes} scene(s) and wrote output to ${args.output}`);
  console.log(JSON.stringify({
    title: cartoon.title,
    original_story: cartoon.original_story,
    scenes: cartoon.scenes.length
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to generate cartoon:', error);
    process.exit(1);
  });
}
