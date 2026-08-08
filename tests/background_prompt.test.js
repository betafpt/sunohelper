const assert = require('assert');

global.importScripts = () => {};
global.chrome = {
    runtime: {
        onMessage: { addListener: () => {} }
    }
};

const { getSystemInstruction } = require('../scripts/background.js');

const instruction = getSystemInstruction('generate', {});

assert.match(instruction, /full-song arrangement map/i);
assert.match(instruction, /8-12 sections/i);
assert.match(instruction, /complete singable lyrics/i);
assert.match(instruction, /2 verses/i);
assert.match(instruction, /chorus/i);

console.log('background prompt tests passed');
