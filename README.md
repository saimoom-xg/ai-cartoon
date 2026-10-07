# AI Cartoon Storybook Creator

Turn a written story into an illustrated children's storybook. Gemini plans meaningful scenes and a character bible, then generates original scene illustrations using the configured Gemini image model. Generated images are stored in Vercel Blob.

## Key Features

- **AI Story Planner**: Gemini structured JSON output creates a character bible and 1–10 chronological story beats.
- **Original AI Illustrations**: Nano Banana 2.1 generates a character reference sheet, scene images, and an optional dedicated cover.
- **Consistent Storybook**: Character descriptions and reference imagery guide image generation; each scene can be retried or edited independently.
- **Natural-Language Scene Editing**: Ask Gemini to change a generated scene while preserving its cast and style.
- **Storybook Viewer**: View scenes as they finish, follow generation progress, and review failed scenes without losing completed work.
- **Exporting**:
  - Download individual scene PNGs or all generated images as a ZIP.
  - Print or save the storybook as a PDF.
  - Generate a dedicated cover illustration.
- **Classic Konva Asset Editor** (optional at `/classic`):
  - Drag and drop characters, animals, and objects anywhere on the canvas.
  - Scale (resize), flip horizontal (direction facing), and adjust layer order (Z-index).
  - Comic speech bubbles with speaker labels and editable dialogue.
- **Server-Side API**: Gemini credentials remain on the server. Story analysis, reference generation, scene generation, and editing use separate validated routes.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Set:
- `GEMINI_API_KEY`: Google Gemini API key with text and image generation enabled.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token. Configure the same token in Vercel project environment variables for deployment.

The default image model is `gemini-nano-banana-2.1`. Override it with the server-only `GEMINI_IMAGE_MODEL` variable when changing models. The default text planner uses `gemini-2.5-flash`, configurable with `GEMINI_TEXT_MODEL`. Fast, standard, and high-quality image sizes are 1K, 2K, and 4K respectively; high-quality generations can cost more.

Image-generation errors are shown to the user instead of silently falling back to the legacy asset generator. Generated images are public Vercel Blob URLs; story plans remain in the browser session and are not backed by a database yet.

Before making generation endpoints publicly available, put a distributed rate limiter in front of `/api/story/analyze`, `/api/generate/*`, and `/api/edit/scene`. This MVP does not yet include account-based quotas or distributed rate limiting.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to create storybooks. Visit `/classic` to use the retained asset-based Konva editor.

### Storybook API

- `POST /api/story/analyze` — Return a validated story plan and character bible.
- `POST /api/generate/character` — Generate and store the character reference sheet.
- `POST /api/generate/scene` — Generate a scene illustration, retry a scene, or create a cover.
- `POST /api/edit/scene` — Apply a natural-language edit to one generated scene.

### 4. Run Tests & Build
```bash
npm test
npm run lint
npm run build
```

---

## Classic Asset Library

Assets are defined in `assets/asset-library.json` and served from `public/assets/`:
- `characters/`: `boy.png`, `girl.png`, `friend.png`, `old-man.png`
- `animals/`: `dog.png`, `cat.png`
- `vehicles/`: `red-car.png`
- `objects/`: `football.png`, `tree.png`
- `backgrounds/`: `park.png`, `street.png`
- `buildings/`: `house.png`, `school.png`

These assets remain available to the optional classic editor and legacy CLI; they are not used by the image-first storybook generator.

---

## CLI Prototype

The legacy command-line generator is also preserved:
```bash
npm run demo
# or
node cartoon-story-generator.js --story "A boy walks his dog in the park."
```

The offline CLI separates clear story events into chronological scenes, keeps the lead character consistent, and only creates speech bubbles for quoted dialogue.
