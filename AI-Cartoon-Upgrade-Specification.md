# **AI Cartoon — Upgrade Specification** 

_Complete technical and product specification for upgrading the existing ai-cartoon project_ 

Version: 1.0 

Target stack: Next.js + Vercel + Gemini API 

Primary goal: Replace predefined PNG asset assembly with AI-generated, consistent cartoon story scenes. 

## **1. Product Goal** 

Transform a user's story into a high-quality illustrated cartoon storybook. The output should look like a coherent children's storybook, not a collection of predefined PNG characters placed on backgrounds. 

### **Current architecture** 

```
User Story
  ↓
Gemini text analysis
  ↓
Scene JSON
  ↓
Predefined PNG assets
  ↓
Konva canvas
```

### **Target architecture** 

```
User Story
  ↓
AI Story Planner
  ↓
Character Bible + Visual Style
  ↓
Scene Planner
  ↓
Scene Prompt Builder
  ↓
AI Image Generation
  ↓
Character/Style Consistency
  ↓
Storybook Viewer
  ↓
Edit / Regenerate / Export
```

## **2. Core Problem in the Existing Application** 

The current implementation is fundamentally limited because it maps story content to a small predefined asset library. A story containing a magical door, fantasy forest, lost bird and rainbow waterfall cannot be represented accurately when the generator mainly knows generic characters, objects and backgrounds. 

- Predefined PNG assets limit visual variety. 

- Generic actions such as walking/standing do not represent actual story events. 

- Characters can look inconsistent from scene to scene. 

- Backgrounds and objects cannot dynamically match arbitrary stories. 

- The Konva canvas is being used as the primary generation mechanism instead of an optional editor. 

- Improving asset positioning alone will not solve the quality problem. 

## **3. New Generation Pipeline** 

```
Story Input
   ↓
Story Understanding
   ↓
Structured Story JSON
   ↓
Character Bible
   ↓
Character Reference Images
   ↓
Scene Planning
   ↓
Professional Scene Prompts
   ↓
Gemini Image Generation
   ↓
Generated Scene Images
   ↓
Storybook Viewer
   ↓
Optional Editor / Export
```

## **4. Story Planner** 

The first AI step should understand the user's story and return validated structured JSON. Use Gemini structured output/JSON Schema rather than relying on arbitrary text parsing. 

```
{
```

```
  "title": "Leo and the Magical Door",
  "genre": "fantasy adventure",
  "audience": "children",
  "tone": "warm, magical, adventurous",
  "visual_style": {
    "style": "3D animated children's storybook",
    "lighting": "soft cinematic",
    "color_palette": "bright warm colors",
    "detail_level": "high"
  },
  "characters": [],
  "scenes": []
}
```

## **5. Character Bible** 

Create a character bible before generating the scenes. This is critical for visual consistency. 

- Character ID 

- Name 

- Age 

- Gender when relevant 

- Face shape 

- Hair and hair color 

- Eyes 

- Skin tone where relevant 

- Body type 

- Clothing 

- Shoes 

- Accessories 

- Personality 

- Unique visual characteristics 

```
{
  "id": "leo",
  "name": "Leo",
  "age": 8,
  "appearance": {
    "hair": "short black hair",
    "face": "round friendly face",
    "eyes": "large brown eyes",
    "clothing": "yellow hoodie, blue jeans",
    "shoes": "red sneakers"
  },
  "personality": ["curious", "brave", "kind"]
}
```

## **6. Character Reference Images** 

Generate a reference image or character sheet for every important character before scene generation. Use these references in later image-generation requests so the same character can remain visually consistent. 

- Front/full-body reference 

- Optional 3/4 and side views 

- Neutral expression 

- Fixed clothing and accessories 

- Consistent proportions 

The reference-image strategy should be used selectively. Do not send every previous image to every generation request. 

## **7. Image Generation Models** 

- Default image generation: Gemini Nano Banana 2.1 / gemini-nano-banana-2.1. 

- High-quality option: Gemini 3 Pro Image / Nano Banana Pro. 

- Preview output: 1K. 

- Normal final output: 2K. 

- Use 4K selectively when supported and needed. 

Keep the image model configurable so model IDs can be updated without changing the rest of the application. 

## **8. Scene Planning** 

Do not split stories by arbitrary word count. Gemini should identify meaningful story beats. 

```
Scene 1 → Leo discovers the magical door
Scene 2 → Leo and Milo enter the magical forest
Scene 3 → They meet a lost bird
Scene 4 → They help the bird find its family
Scene 5 → They discover the rainbow waterfall
Scene 6 → They return home
```

### **Scene JSON** 

```
{
  "scene_number": 1,
  "title": "The Mysterious Door",
  "story_beat": "Leo discovers a glowing magical door.",
  "characters": ["leo", "milo"],
  "location": "backyard beneath a giant old tree",
  "time": "sunset",
  "weather": "clear",
  "action": "Leo kneels beside the tree while Milo looks curiously at the glowing door.",
  "emotion": "wonder and curiosity",
  "camera": {
    "shot": "wide cinematic shot",
    "angle": "slightly low angle",
    "composition": "characters on left, magical door in center"
  },
  "lighting": "warm sunset light with blue magical glow",
  "image_prompt": "..."
}
```

## **9. Scene Prompt Builder** 

Create a reusable server-side prompt builder. Do not hard-code giant prompts inside React components. 

```
buildScenePrompt({
```

```
  story,
  characterBible,
  scene,
  style,
  previousScene
})
```

### **Prompt requirements** 

- State the desired cartoon/storybook visual style. 

- Include exact character descriptions from the character bible. 

- Describe the current story beat. 

- Describe environment and time. 

- Describe character actions and emotions. 

- Specify camera/composition. 

- Specify lighting and mood. 

- Tell the model to preserve character appearance. 

- Avoid text, logos and watermarks. 

- Avoid deformed hands, duplicate characters, extra limbs and inconsistent clothing. 

## **10. Reference Strategy** 

```
Character references
       +
Most relevant previous scene
       +
Current scene prompt
       ↓
Gemini image generation
       ↓
New scene image
```

Use the previous scene selectively to improve continuity. Avoid sending the entire story's image history unnecessarily. 

## **11. Scene Editing** 

Every generated scene should support natural-language editing. 

```
Current Scene Image
       +
User instruction:
"Make the waterfall larger and move Leo closer to the bird."
       ↓
Image editing model
       ↓
Updated Scene Image
```

## **12. Scene Regeneration** 

A user must be able to regenerate a single bad scene without regenerating the entire story. 

```
Scene 1 ✓
Scene 2 ✓
Scene 3 ✓
Scene 4  → Retry✗
Scene 5 ✓
Scene 6 ✓
```

## **13. Style System** 

- 3D Cartoon — modern animated-film look. 

- 2D Storybook — illustrated children's book. 

- Anime — soft family-friendly anime. 

- Watercolor — children's watercolor illustration. 

- Comic — colorful comic-book style. 

Changing the style must not unnecessarily change the character identity. 

## **14. User Interface** 

### **Create Story** 

```
Create Your Cartoon Story
```

```
Story
[ Write your story here... ]
Style
[ 3D Cartoon ▼ ]
Number of scenes
[ Auto ▼ ]
Quality
○ Fast
● Standard
○ High Quality
[ Generate Story ]
```

### **Generation screen** 

```
Creating your cartoon...
```

```
✓ Understanding story
✓ Creating characters
✓ Creating character references
✓ Planning scenes
● Generating Scene 3
○ Generating Scene 4
○ Preparing storybook
```

### **Story viewer** 

```
The Magical Door
```

```
[ GENERATED SCENE IMAGE ]
```

```
The Magical Door
```

```
Leo discovers a mysterious glowing door
beneath the old tree.
```

```
[ Previous ]       [ Next ]
[ Regenerate ] [ Edit ] [ Change Style ] [ Download ]
[1] [2] [3] [4] [5] [6]
```

## **15. Recommended Next.js Structure** 

```
app/
  page.tsx
  create/
  story/[id]/
  api/
    story/analyze/
```

```
    story/characters/
    story/scenes/
    generate/character/
    generate/scene/
    edit/scene/
    story/export/
components/
  story/
  scenes/
  generation/
  editor/
lib/
  gemini/
    story-planner.ts
    character-generator.ts
    image-generator.ts
    scene-generator.ts
  prompts/
    story.ts
    character.ts
    character-reference.ts
    scene.ts
    scene-editor.ts
    cover.ts
  validation/
types/
```

## **16. API Design** 

```
POST /api/story/analyze
Input: { story }
Output: structured story JSON
```

```
POST /api/story/characters
Input: story JSON
Output: character bible
```

```
POST /api/story/scenes
Input: story + character bible
Output: scene plan
```

```
POST /api/generate/character
Input: character bible
Output: reference image
```

```
POST /api/generate/scene
Input: scene + character references + optional previous scene
Output: generated image
```

```
POST /api/edit/scene
Input: image + edit instruction
Output: edited image
```

```
POST /api/story/export
```

```
Input: story + generated scenes
Output: PDF/ZIP/images
```

## **17. Security** 

- Never expose the Gemini API key to the browser. 

- Do not use NEXT_PUBLIC_GEMINI_API_KEY. 

- Use a server-only GEMINI_API_KEY environment variable. 

- Browser calls Next.js API routes; API routes call Gemini. 

- Validate all incoming data server-side. 

- Add rate limiting before public launch. 

## **18. Image Storage** 

Do not permanently keep large base64 images in React state or rely on the deployment filesystem for persistent storage. 

```
Gemini
  ↓
Server
  ↓
Object/blob storage
  ↓
Image URL
  ↓
Database/story record
```

## **19. Database — Later Phase** 

A database is not mandatory for the first working MVP. When persistence is added, use tables similar to: 

```
stories
```

- `id` 

- `title` 

- `original_story` 

- `style` 

- `quality` 

- `created_at` 

```
characters
```

```
- id
```

- `story_id` 

- `character_key` 

- `name` 

- `description` 

- `reference_image_url` 

- `created_at` 

```
scenes
```

```
- id
```

- `story_id` 

- `scene_number` 

- `title` 

- `story_beat - prompt` 

- `image_url` 

- `status` 

- `created_at` 

## **20. Error Handling** 

- A failed scene must not destroy the story. 

- Show completed scenes immediately. 

- Allow Retry for a failed scene. 

- Keep scene status: pending, generating, completed, failed. 

- Return useful errors instead of generic 'Something went wrong'. 

## **21. Cost Control** 

- Default to approximately 5–7 scenes. 

- Maximum default story length: 10 scenes. 

- Use 1K for preview generation. 

- Use 2K for standard final generation. 

- Only generate 4K when explicitly requested. 

- Do not regenerate the whole story when only one scene is bad. 

## **22. Konva / Existing Editor** 

Do not immediately delete the existing Konva editor. Keep it as an optional manual editor if useful. 

```
AI Generated Scene
```

```
       ↓
```

```
Optional Konva Editor
```

```
       ↓
```

```
Text / stickers / speech bubbles / manual adjustments
```

The editor should no longer be responsible for assembling the main story from predefined PNG assets. 

## **23. Export** 

- Download individual scene PNG files. 

- Download all scenes as a ZIP. 

- Export a storybook PDF. 

- Generate a dedicated cover image rather than simply reusing Scene 1. 

## **24. Future Features — Do Later** 

- Image-to-video cartoon scenes. 

- AI narration. 

- Background music. 

- Full story video. 

- User accounts. 

- Saved story library. 

- Premium generation tiers. 

- Sharing/public story links. 

Do not implement video or narration until static story generation is high quality. 

## **25. Development Phases** 

1. Phase 1: Keep the project runnable and isolate/disable the old asset-based generation path. 

2. Phase 2: Implement Gemini story analysis with structured JSON and schema validation. 

3. Phase 3: Implement the character bible and character reference generation. 

4. Phase 4: Implement scene planning and professional scene prompt generation. 

5. Phase 5: Implement AI scene image generation. 

6. Phase 6: Implement story viewer and scene thumbnails. 

7. Phase 7: Implement scene regeneration and natural-language editing. 

8. Phase 8: Implement export to PNG/ZIP/PDF. 

9. Phase 9: Add storage, database, rate limiting and accounts. 

10. Phase 10: Polish UX, performance, prompts and cost. 

## **26. Acceptance Criteria** 

- A story containing arbitrary locations and objects can generate scenes without predefined PNG assets. 

- Major characters remain visually recognizable across scenes. 

- Each scene represents the actual story beat rather than a generic pose. 

- A single scene can be regenerated independently. 

- A scene can be edited using natural-language instructions. 

- The image model can be changed through configuration. 

- Gemini API credentials are never exposed client-side. 

- The application runs correctly on Vercel. 

- Generation progress is visible to the user. 

- Failed generations can be retried. 

- The final story can be exported. 

## **27. Coding-Agent Master Instruction** 

Use the following instruction when handing this specification to an AI coding agent: 

```
Upgrade the existing AI Cartoon application according to this specification.
```

```
Do not simply patch the existing PNG asset generation system.
Replace the primary generation architecture with:
```

`1. Gemini structured story planning.` 

`2. Character Bible generation.` 

`3. Character reference image generation.` 

`4. Meaningful scene planning.` 

`5. Professional scene prompt generation.` 

`6. Gemini image generation using the configured Nano Banana image model.` 

`7. Character/style consistency using reference images.` 

`8. Per-scene regeneration.` 

`9. Natural-language scene editing.` 

`10. Storybook viewer.` 

`11. Export functionality.` 

```
Keep the project compatible with Next.js and Vercel.
Never expose the Gemini API key to the client.
Use server-side API routes.
```

```
Use schema validation for AI-generated structured data.
Keep existing functionality where useful, especially the Konva editor,
but do not use predefined PNG assets as the primary story-generation mechanism.
```

```
Implement incrementally. Keep the application runnable after every phase.
Do not delete existing functionality until the replacement has been tested.
Prioritize generation quality, character consistency, error handling,
cost control and a simple user experience.
```

## **28. Important Model Note** 

For the implementation, keep the image model configurable. Google's current Gemini image-generation documentation should be checked at implementation time for the exact currently available model IDs, supported image sizes, reference-image limits, pricing and regional/API availability. The architecture must not hard-code assumptions that make future model changes difficult. 

## **29. Final Target** 

```
                 AI CARTOON
```

```
Write Story
     ↓
AI understands story
     ↓
AI creates characters
     ↓
AI creates character references
     ↓
AI creates storyboard
     ↓
AI generates complete cartoon scenes
     ↓
Character consistency
     ↓
Storybook
```

```
     ↓
Edit / Regenerate
     ↓
Export PDF / PNG / ZIP
```

```
The product should feel like an AI children's
storybook creator — not a PNG asset placement editor.
```

**End of Specification** 

