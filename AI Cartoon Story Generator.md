Build a complete MVP for an **AI Cartoon Story Generator**.

The core idea is simple:

> **User writes a story → AI understands the story → AI selects appropriate existing cartoon assets → system creates multiple cartoon scenes → user can edit the scenes → export the final cartoon.**

I will provide the cartoon assets myself, including characters, animals, cars, houses, backgrounds, objects, etc. **Do not generate new character images with AI.** The AI's job is to understand the story and select the correct assets from my existing library.

---

## 1. Technology Stack

### Frontend
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Konva.js** for the visual cartoon/canvas editor

### Backend
- **Laravel**
- Laravel REST API
- **MySQL**

### AI
Use an AI API such as **Google Gemini**.

The AI should analyze the user's story and return structured JSON describing the cartoon scenes.

The AI should NOT directly generate the cartoon images.

### Assets
Use existing PNG/SVG assets with transparent backgrounds where appropriate.

For development, assets can be stored locally. Structure the application so storage can later be moved to S3-compatible storage.

---

# 2. Main User Experience

The homepage should be very simple.

Show a large text area:

> **Tell me your story...**

Example:

> A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car.

Then show a prominent:

**Generate Cartoon** button.

When the user clicks it:

```text
User Story
    ↓
AI understands story
    ↓
AI breaks story into scenes
    ↓
AI selects existing assets
    ↓
System creates scene compositions
    ↓
Cartoon preview
```

---

# 3. AI Story Understanding

The AI should analyze the story and identify:

- Characters
- Animals
- Objects
- Vehicles
- Locations
- Backgrounds
- Actions
- Emotions when possible
- Dialogue
- Scene order

For example, if the story says:

> A boy walks his dog in the park.

The AI should identify:

```json
{
  "characters": ["boy"],
  "animals": ["dog"],
  "background": "park",
  "actions": ["walking"]
}
```

If the story says:

> The boy gets into a red car and drives to his friend's house.

The AI should identify:

```json
{
  "characters": ["boy", "friend"],
  "objects": ["red_car"],
  "background": "house",
  "actions": ["driving"]
}
```

---

# 4. Scene Generation

The AI should automatically divide the story into a reasonable number of scenes.

Do not create an excessive number of scenes.

For a short story, normally create around **3–6 scenes** depending on the story.

Example:

### Scene 1
Boy walking his dog in the park.

### Scene 2
Boy meets his friend.

### Scene 3
They play football.

### Scene 4
They get into the car and go home.

Each scene should contain structured information such as:

```json
{
  "scene_number": 1,
  "background": "park",
  "characters": [
    {
      "asset": "boy",
      "action": "walking",
      "position": "left"
    }
  ],
  "animals": [
    {
      "asset": "dog",
      "action": "walking",
      "position": "center"
    }
  ],
  "objects": [],
  "dialogue": [
    {
      "speaker": "boy",
      "text": "What a beautiful day!"
    }
  ]
}
```

The exact JSON structure can be improved if necessary, but it must remain predictable and easy for the frontend to render.

---

# 5. Existing Asset Library

Create an asset system where every cartoon asset has metadata.

For example:

```text
id
name
type
category
image_path
description
tags
```

Types could include:

```text
character
animal
vehicle
object
background
building
```

Examples:

```text
Boy
Girl
Old Man
Dog
Cat
Red Car
House
School
Tree
Football
Park
Street
```

The AI should use the asset metadata to determine which existing asset matches the story.

For example:

```text
Story: "A dog runs in the park."

AI:
dog → Dog asset
park → Park background
action → running
```

If an exact asset doesn't exist, the AI should choose the closest available asset rather than inventing a new image.

---

# 6. Character Consistency

Character consistency is very important.

If the story uses:

```text
Boy
```

in five scenes, it should use the **same Boy asset** in all five scenes.

Do not generate a different-looking boy for each scene.

The same applies to:

- Animals
- Cars
- Other recurring characters
- Important objects

This should make the cartoon feel like one consistent story.

---

# 7. Cartoon Composition

Use **Konva.js** to create the visual scene.

Each scene should be composed from:

```text
Background
    ↓
Objects
    ↓
Characters
    ↓
Animals
    ↓
Speech bubbles
    ↓
Captions
```

The system should automatically place assets in reasonable positions.

For example:

```text
┌─────────────────────────────────────┐
│              PARK                   │
│                                     │
│      👨            🐕               │
│                                     │
│                  ⚽                 │
│                                     │
│       "Let's play!"                 │
└─────────────────────────────────────┘
```

The initial layout can be automatic, but the user should be able to manually adjust it.

---

# 8. Cartoon Editor

After generation, show the generated scenes in an editor.

The user should be able to:

- Select a scene
- Move characters
- Move objects
- Resize assets
- Delete an asset
- Replace an asset
- Add an asset
- Edit dialogue
- Edit captions
- Add a new scene
- Delete a scene
- Regenerate a scene

Keep the editor simple and easy to understand.

Do not build a complicated professional animation editor.

---

# 9. Scene Regeneration

Each scene should have a **Regenerate Scene** option.

For example, if the AI created a scene that the user doesn't like, they should be able to regenerate only that scene rather than regenerating the entire story.

The regenerated scene must still use the existing asset library.

---

# 10. Asset Replacement

The user should be able to click a character/object and replace it.

For example:

```text
Current:
Boy

Replace with:
Girl
Old Man
Another Boy
```

The replacement should come from the existing asset library.

---

# 11. Speech Bubbles

Allow simple speech bubbles.

Example:

```text
       ┌───────────────────┐
       │ Let's go home!    │
       └─────────┬─────────┘
                 ↓
                👨
```

The user should be able to edit the text.

AI can generate dialogue when appropriate, but dialogue should never be mandatory for every scene.

---

# 12. Export

Allow the user to export the finished cartoon.

For the MVP, support:

- PNG/image export
- PDF export

Later we can add:

- Animated cartoon
- Video
- Voice narration
- Background music

Do not implement those advanced features in the first version.

---

# 13. Laravel Backend

Laravel should handle:

- Asset management
- Asset metadata
- Story requests
- AI requests
- Scene data
- Saved cartoons
- User data
- Export information

Create clean API endpoints.

Example:

```text
POST /api/cartoon/generate
GET  /api/assets
GET  /api/cartoon/{id}
PUT  /api/cartoon/{id}
POST /api/cartoon/{id}/scene
PUT  /api/cartoon/{id}/scene/{scene}
DELETE /api/cartoon/{id}/scene/{scene}
```

Use proper Laravel validation and API error handling.

---

# 14. Database Structure

Keep the database simple.

Suggested tables:

```text
users

assets
- id
- name
- type
- category
- image_path
- description
- tags

cartoons
- id
- user_id
- title
- original_story

cartoon_scenes
- id
- cartoon_id
- scene_number
- scene_data
```

`scene_data` can store the structured JSON required to recreate the scene.

Do not over-engineer the database.

---

# 15. UI Design

The UI should feel like a modern creative tool.

Keep it:

- Clean
- Minimal
- Fast
- Friendly
- Easy for non-technical users

Main flow:

```text
Home
 ↓
Write Story
 ↓
Generate
 ↓
Generating...
 ↓
Cartoon Editor
 ↓
Preview
 ↓
Export
```

The generated cartoon should be the main visual focus.

---

# 16. Important MVP Rules

Keep the first version lightweight.

Do NOT build:

- 3D
- Complex animation
- Video generation
- AI image generation
- Voice generation
- Lip syncing
- Advanced timeline editor
- Complicated character rigging

The first version should only solve this problem extremely well:

> **Turn a written story into a consistent cartoon using my predefined assets.**

---

# 17. Architecture

Use this overall architecture:

```text
                  USER
                    │
                    ▼
              Next.js / React
                    │
                    ▼
              Laravel REST API
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       MySQL              Gemini AI
          │                   │
          │             Scene JSON
          │                   │
          └─────────┬─────────┘
                    ▼
              Next.js + Konva
                    │
                    ▼
             Existing Assets
                    │
                    ▼
              Cartoon Scenes
                    │
                    ▼
              Edit / Export
```

Build the project in a modular way so I can later add more characters, poses, emotions, backgrounds, objects, animation, voice, and other AI features without rewriting the core architecture.

**Most importantly: do not overcomplicate the MVP. Make the basic Story → AI → Assets → Cartoon workflow work reliably first.**