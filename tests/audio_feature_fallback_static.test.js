const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const contentJs = fs.readFileSync(path.join(root, 'scripts/content.js'), 'utf8');
const backgroundJs = fs.readFileSync(path.join(root, 'scripts/background.js'), 'utf8');

assert.match(contentJs, /function extractAudioFeatureProfile/);
assert.match(contentJs, /function buildAudioFeatureProfile/);
assert.match(contentJs, /function estimateTempoBpm/);
assert.match(contentJs, /function scoreAmapianoLogDrumCue/);
assert.match(contentJs, /function inferInstrumentAndBassHints/);
assert.match(contentJs, /bassCharacter/);
assert.match(contentJs, /genreCues/);
assert.match(contentJs, /styleFamilyHints/);
assert.match(contentJs, /amapiano|log-drum|log drum/i);
assert.doesNotMatch(contentJs, /check for amapiano/i);
assert.match(contentJs, /mode:\s*'features'/);
assert.match(contentJs, /audioProfile:\s*audioProfile/);
assert.doesNotMatch(contentJs, /mode:\s*'file',\s*audioData:/);

assert.match(backgroundJs, /request\.mode === 'features'/);
assert.match(backgroundJs, /audioProfile/);
assert.match(backgroundJs, /Đặc trưng âm thanh/);
assert.match(backgroundJs, /Nhạc cụ|instrument/i);
assert.match(backgroundJs, /Bass|low-end/i);
assert.match(backgroundJs, /Amapiano|log-drum|log drum/i);
assert.match(backgroundJs, /Không nhắc Amapiano\/log-drum nếu/i);
assert.match(backgroundJs, /genreCues\.amapianoLogDrum\.score/);

console.log('audio feature fallback static tests passed');
