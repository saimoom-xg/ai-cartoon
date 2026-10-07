const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  generateScenesFromStory,
  isValidAiResult,
  loadAssetLibrary,
  splitIntoSentences,
} = require('./cartoon-story-generator.js');

const assets = loadAssetLibrary();
const sampleStory =
  'A boy goes to the park with his dog. He meets his friend there. They play football together and then go home in a red car.';

test('splits separate events into scenes and carries recurring cast forward', () => {
  assert.deepEqual(splitIntoSentences(sampleStory), [
    'A boy goes to the park with his dog.',
    'He meets his friend there.',
    'They play football together',
    'They go home in a red car.',
  ]);

  const scenes = generateScenesFromStory(sampleStory, assets);
  assert.equal(scenes.length, 4);
  assert.deepEqual(
    scenes.map((scene) => scene.characters.map((character) => character.asset)),
    [['boy'], ['boy', 'friend'], ['boy', 'friend'], ['boy', 'friend']],
  );
  assert.deepEqual(
    scenes.map((scene) => scene.background),
    ['Park', 'Park', 'Park', 'House'],
  );
  assert.deepEqual(scenes[2].objects.map((object) => object.asset), ['football']);
  assert.deepEqual(scenes[3].objects.map((object) => object.asset), ['red-car']);
  assert.deepEqual(
    scenes.map((scene) => scene.characters[0].action),
    ['walking', 'greeting', 'playing', 'walking'],
  );
  assert.equal(scenes[3].objects[0].action, 'driving');
  assert.ok(scenes.every((scene) => scene.dialogue.length === 0));
});

test('only keeps explicit dialogue and rejects unknown AI asset references', () => {
  const scenes = generateScenesFromStory('A girl says, "Let us explore!"', assets);
  assert.deepEqual(scenes[0].dialogue, [{ speaker: 'Girl', text: 'Let us explore!' }]);

  const validScene = {
    scene_number: 1,
    background: 'park',
    characters: [{ asset: 'boy', action: 'walking', position: 'left' }],
    animals: [],
    objects: [],
    dialogue: [],
  };
  assert.equal(isValidAiResult({ scenes: [validScene] }, assets), true);
  assert.equal(
    isValidAiResult({
      scenes: [{ ...validScene, characters: [{ asset: 'invented-person' }] }],
    }, assets),
    false,
  );
  assert.equal(
    isValidAiResult({
      scenes: [{ ...validScene, characters: [{ asset: 'boy', action: 'walking', position: 'offstage' }] }],
    }, assets),
    false,
  );
});
