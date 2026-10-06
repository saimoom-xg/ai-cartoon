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

function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function chunkByCount(items, targetCount) {
  const groups = [];
  const size = Math.max(1, Math.ceil(items.length / targetCount));
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
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
  return haystack.some((value) => value === needle || value.includes(needle) || needle.includes(value));
}

function detectAssets(text, assetList) {
  const lowerText = normalizeText(text);
  const selected = new Map();

  const typeMap = {
    character: ['boy', 'girl', 'friend', 'old man'],
    animal: ['dog', 'cat'],
    vehicle: ['red car', 'car'],
    object: ['football', 'tree'],
    background: ['park', 'house', 'school', 'street']
  };

  for (const [type, names] of Object.entries(typeMap)) {
    names.forEach((name) => {
      const alias = normalizeText(name);
      if (!lowerText.includes(alias)) return;
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
    if (!lowerText.includes(alias)) return;
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

function inferBackground(text) {
  const lower = normalizeText(text);
  const choices = [
    { key: 'park', matches: ['park', 'garden', 'playground'] },
    { key: 'house', matches: ['house', 'home', 'inside', 'kitchen', 'bedroom'] },
    { key: 'school', matches: ['school', 'classroom', 'lesson'] },
    { key: 'street', matches: ['street', 'road', 'city', 'drive'] },
    { key: 'park', matches: ['tree', 'outdoor'] }
  ];

  for (const option of choices) {
    if (option.matches.some((term) => lower.includes(term))) {
      return option.key;
    }
  }

  return 'park';
}

function createDialogue(speaker, text) {
  const fallbackText = text.length > 80 ? text.slice(0, 80).trim() + '...' : text;
  return {
    speaker,
    text: fallbackText
  };
}

function buildScene(sceneNumber, sentences, assetList) {
  const combinedText = sentences.join(' ');
  const found = detectAssets(combinedText, assetList);
  const background = found.backgrounds[0]?.id || inferBackground(combinedText);
  const sceneCharacters = found.characters.length ? found.characters : [
    assetList.find((asset) => asset.id === 'boy') || assetList[0]
  ];
  const sceneAnimals = found.animals.length ? found.animals : [];
  const sceneObjects = found.objects.length ? found.objects : [];
  const sceneBackground = assetList.find((asset) => asset.id === background) || assetList.find((asset) => asset.type === 'background') || assetList[0];

  const speaker = sceneCharacters[0]?.name || 'Boy';
  const dialogueText = sentences[0] ? sentences[0].replace(/\.$/, '') : 'Let\'s go!';

  return {
    scene_number: sceneNumber,
    background: sceneBackground.name,
    characters: sceneCharacters.map((asset) => ({
      asset: asset.id,
      action: 'walking',
      position: sceneCharacters.indexOf(asset) === 0 ? 'left' : 'right'
    })),
    animals: sceneAnimals.map((asset) => ({
      asset: asset.id,
      action: 'walking',
      position: 'center'
    })),
    objects: sceneObjects.map((asset) => ({
      asset: asset.id,
      action: 'present',
      position: 'center'
    })),
    dialogue: [createDialogue(speaker, dialogueText)]
  };
}

function generateScenesFromStory(story, assetList) {
  const sentences = splitIntoSentences(story);
  const targetSceneCount = Math.min(6, Math.max(3, Math.ceil(sentences.length / 2)));
  const grouped = chunkByCount(sentences, targetSceneCount);

  return grouped.map((group, index) => buildScene(index + 1, group, assetList));
}

function stripMarkdown(text) {
  return text.replace(/```json|```/g, '').trim();
}

async function callGemini(story) {
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
                text: `Return valid JSON only. Use this structure: {"title":"...","scenes":[{"scene_number":1,"background":"...","characters":[{"asset":"boy","action":"walking","position":"left"}],"animals":[{"asset":"dog","action":"walking","position":"center"}],"objects":[],"dialogue":[{"speaker":"boy","text":"..."}]}]}\nStory:\n${story}`
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
  const aiResult = await callGemini(story);
  if (aiResult && Array.isArray(aiResult.scenes)) {
    return {
      title: aiResult.title || 'Cartoon Story',
      original_story: story,
      total_scenes: aiResult.scenes.length,
      scenes: aiResult.scenes
    };
  }

  return {
    title: 'Cartoon Story',
    original_story: story,
    total_scenes: Math.max(3, generateScenesFromStory(story, assetList).length),
    scenes: generateScenesFromStory(story, assetList)
  };
}

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

main().catch((error) => {
  console.error('Failed to generate cartoon:', error);
  process.exit(1);
});
