# AI Cartoon Story Generator

## Next.js setup

The repository now includes a Next.js App Router scaffold alongside the preserved CLI prototype.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the starter homepage and `http://localhost:3000/konva` to verify the Konva canvas. Run `npm run build` to create a production build. Copy `.env.local.example` to `.env.local` when local environment variables are needed; do not commit `.env.local`.

## Phase 2: story generation

The homepage posts stories to `POST /api/cartoon/generate`. The server sends the story and the existing asset metadata to Gemini first, then automatically falls back to OpenRouter if Gemini is unavailable or returns invalid scene data. Responses from either provider are validated against the asset metadata before structured JSON is returned. Both API keys are read only on the server.

Copy `.env.local.example` to `.env.local` and set `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, or both. Configure both for automatic Gemini-to-OpenRouter fallback. `GEMINI_MODEL` and `OPENROUTER_MODEL` can optionally select provider models. OpenRouter site URL and application title attribution can be configured with `OPENROUTER_SITE_URL` and `OPENROUTER_APP_NAME`. Never prefix provider keys with `NEXT_PUBLIC_`.

The asset metadata comes from `assets/asset-library.json`. Place image files under the corresponding `public/assets/` paths when those assets are available.

A lightweight Node.js script that turns a plain-language story into a cartoon scene plan using a predefined existing asset library. The script supports an optional Google Gemini API call, but it falls back to a deterministic scene generator when no API key is configured.

## Features

- Story input from CLI argument or stdin
- Asset metadata library with characters, animals, vehicles, and backgrounds
- Automatic scene splitting for 3–6 scenes
- Structured cartoon JSON output designed to feed a Konva-based frontend
- Optional AI enhancement with Gemini

## Quick start

```bash
node cartoon-story-generator.js --story "A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car."
```

Or use the demo command:

```bash
npm run demo
```

## Optional AI setup

For the legacy CLI prototype, copy `.env.example` to `.env` and set your Gemini API key:

```bash
cp .env.example .env
```

Then:

```bash
GEMINI_API_KEY=your_key_here node cartoon-story-generator.js --story "A boy walks his dog in the park."
```

## Output format

The script writes a JSON object with the story and a list of scenes:

```json
{
  "title": "Cartoon Story",
  "original_story": "A boy goes to the park with his dog.",
  "total_scenes": 3,
  "scenes": [
    {
      "scene_number": 1,
      "background": "Park",
      "characters": [{ "asset": "boy", "action": "walking", "position": "left" }],
      "animals": [{ "asset": "dog", "action": "walking", "position": "center" }],
      "objects": [],
      "dialogue": [{ "speaker": "Boy", "text": "A boy goes to the park with his dog" }]
    }
  ]
}
```

This structure is intentionally simple so it can be dropped into a Next.js + Konva editor later.
