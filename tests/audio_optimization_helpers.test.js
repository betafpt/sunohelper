const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/content.js'), 'utf8');

const context = {
    document: {},
    window: { location: { href: 'https://suno.com/create' } },
    chrome: { runtime: { getURL: (value) => value } },
    console,
    Blob,
    Event,
    setInterval: () => null,
    clearTimeout,
    setTimeout
};

vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(context.shouldOptimizeAudioFile({ size: 19 * 1024 * 1024 }), false);
assert.strictEqual(context.shouldOptimizeAudioFile({ size: 21 * 1024 * 1024 }), true);
assert.strictEqual(context.shouldOptimizeAudioFile({ name: 'song.mp3', size: 5 * 1024 * 1024 }), false);
assert.strictEqual(context.shouldOptimizeAudioFile({ name: 'song.wav', size: 5 * 1024 * 1024 }), false);
assert.strictEqual(context.shouldOptimizeAudioFile({ name: 'song.m4a', size: 5 * 1024 * 1024 }), true);
assert.strictEqual(context.shouldOptimizeAudioFile({ name: 'song.ogg', size: 5 * 1024 * 1024 }), true);
assert.strictEqual(context.isChatAudioInputFormatSupported('mp3'), true);
assert.strictEqual(context.isChatAudioInputFormatSupported('wav'), true);
assert.strictEqual(context.isChatAudioInputFormatSupported('m4a'), false);
assert.strictEqual(context.isChatAudioInputFormatSupported('ogg'), false);

const seconds = 2;
const sourceSampleRate = 48000;
const sourceFrames = seconds * sourceSampleRate;
const left = new Float32Array(sourceFrames).fill(0.5);
const right = new Float32Array(sourceFrames).fill(-0.25);

const fakeAudioBuffer = {
    duration: seconds,
    sampleRate: sourceSampleRate,
    length: sourceFrames,
    numberOfChannels: 2,
    getChannelData(index) {
        return index === 0 ? left : right;
    }
};

const wavBlob = context.encodeAudioBufferToWav(fakeAudioBuffer);
assert.strictEqual(wavBlob.type, 'audio/wav');
assert.strictEqual(wavBlob.size, 44 + (seconds * 16000 * 2));

const featureProfile = context.buildAudioFeatureProfile(fakeAudioBuffer, {
    name: 'song.m4a',
    size: 12 * 1024 * 1024
});
assert.strictEqual(featureProfile.analysisMethod, 'local-audio-features-v1');
assert.strictEqual(featureProfile.source.fileName, 'song.m4a');
assert.strictEqual(featureProfile.source.durationSeconds, 2);
assert.ok(featureProfile.energy.rms > 0);
assert.ok(featureProfile.tone.spectralCentroidHz >= 0);
assert.ok(Array.isArray(featureProfile.energyCurve));
assert.ok(featureProfile.energyCurve.length > 0);
assert.ok(featureProfile.lowEnd);
assert.ok(featureProfile.lowEnd.bassCharacter);
assert.ok(featureProfile.genreCues);
assert.ok(featureProfile.genreCues.amapianoLogDrum);
assert.ok(Number.isFinite(featureProfile.genreCues.amapianoLogDrum.score));
assert.ok(Array.isArray(featureProfile.genreCues.amapianoLogDrum.evidence));
assert.ok(Array.isArray(featureProfile.instrumentHints));
assert.ok(Array.isArray(featureProfile.bassHints));
assert.ok(Array.isArray(featureProfile.styleFamilyHints));

const strongAmapianoCue = context.scoreAmapianoLogDrumCue(
    { subRatio: 0.2, bassRatio: 0.22, lowRatio: 0.42, highRatio: 0.12 },
    { estimatedBpm: 112, onsetDensity: 0.2 },
    0.08,
    [0.08, 0.2, 0.09, 0.22, 0.1, 0.24, 0.11, 0.21]
);
assert.ok(strongAmapianoCue.score >= 0.6);

const weakAmapianoCue = context.scoreAmapianoLogDrumCue(
    { subRatio: 0.03, bassRatio: 0.04, lowRatio: 0.07, highRatio: 0.04 },
    { estimatedBpm: 73, onsetDensity: 0.03 },
    0.02,
    [0.1, 0.11, 0.1, 0.11, 0.1, 0.11, 0.1, 0.11]
);
assert.ok(weakAmapianoCue.score < 0.35);

console.log('audio optimization helper tests passed');
