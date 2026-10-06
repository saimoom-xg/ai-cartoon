# AI Cartoon Story Generator

A complete MVP for turning written stories into illustrated cartoon scenes using a predefined asset library, AI story understanding (Gemini / OpenRouter), and an interactive **Konva.js** visual editor.

## Key Features

- **Story-to-Cartoon Pipeline**: Write any story and turn it into 3–6 consistent cartoon scenes.
- **AI Understanding & Asset Selection**: Google Gemini & OpenRouter integration analyzes stories, identifies characters, animals, vehicles, scenery, actions, and dialogue, and selects corresponding assets from the predefined library.
- **Resilient Fallback**: Automatic failover from Gemini to OpenRouter, plus a deterministic rule-based generator for offline or zero-configuration use.
- **Predefined Transparent Assets**: 13 ready-to-use cartoon PNG assets (`characters`, `animals`, `vehicles`, `objects`, `backgrounds`, `buildings`) under `public/assets/`.
- **Interactive Konva Canvas Editor**:
  - Drag and drop characters, animals, and objects anywhere on the canvas.
  - Scale (resize), flip horizontal (direction facing), and adjust layer order (Z-index).
  - Add and replace assets (Section 10) from the visual asset library picker.
  - Comic speech bubbles with speaker labels and editable dialogue.
- **Scene Management**:
  - Visual scene filmstrip with thumbnail previews.
  - Add scene, duplicate scene, delete scene, and reorder scenes.
  - **Regenerate Scene** (Section 9): Regenerate an individual scene without re-running the entire story.
- **Presentation Mode**: Fullscreen cartoon slideshow player with autoplay and scene captions.
- **Exporting** (Section 12):
  - **PNG Image**: High-resolution export of any scene.
  - **Print / PDF Storybook**: Multi-panel printable comic book layout.
  - **JSON**: Structured scene coordinates and metadata.
- **REST API Endpoints** (Section 13):
  - `POST /api/cartoon/generate` — Generate scenes from story
  - `GET /api/assets` — List asset library metadata
  - `POST /api/cartoon/regenerate-scene` — Regenerate a single scene
  - `GET /api/cartoon/:id` — Retrieve saved cartoon
  - `PUT /api/cartoon/:id` — Update cartoon data
  - `POST /api/cartoon/:id/scene` — Add scene to cartoon
  - `PUT /api/cartoon/:id/scene/:scene` — Update specific scene
  - `DELETE /api/cartoon/:id/scene/:scene` — Delete specific scene

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Set your keys:
- `GEMINI_API_KEY`: Google Gemini API key
- `OPENROUTER_API_KEY`: OpenRouter API key (optional fallback)

*Note: If no API keys are configured, the system automatically uses the deterministic cartoon generator so you can test all features offline without an API key.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to create cartoons!

### 4. Run Tests & Build
```bash
npm test
npm run lint
npm run build
```

---

## Asset Library Structure

Assets are defined in `assets/asset-library.json` and served from `public/assets/`:
- `characters/`: `boy.png`, `girl.png`, `friend.png`, `old-man.png`
- `animals/`: `dog.png`, `cat.png`
- `vehicles/`: `red-car.png`
- `objects/`: `football.png`, `tree.png`
- `backgrounds/`: `park.png`, `street.png`
- `buildings/`: `house.png`, `school.png`

Assets can be replaced or added at any time by placing corresponding transparent PNGs in `public/assets/` and updating `assets/asset-library.json`.

---

## CLI Prototype

The legacy command-line generator is also preserved:
```bash
npm run demo
# or
node cartoon-story-generator.js --story "A boy walks his dog in the park."
```
