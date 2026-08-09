const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const backgroundJs = fs.readFileSync(path.join(root, 'scripts/background.js'), 'utf8');

assert.ok(
    manifest.host_permissions.includes('https://api.302.ai/*'),
    'manifest must allow background service worker to fetch api.302.ai'
);

assert.match(backgroundJs, /function normalizeApiError/);
assert.match(backgroundJs, /Kh[oô]ng k.t n.i .*.302\.ai|Không kết nối được API 302\.ai/);
assert.match(backgroundJs, /API t. ch.i tham s. audio|API từ chối tham số audio/);
assert.match(backgroundJs, /\['gpt-audio-1\.5',\s*'gpt-audio',\s*'gpt-audio-mini',\s*'gpt-4o-audio-preview'\]/);
assert.doesNotMatch(backgroundJs, /payload\.modalities\s*=/);
assert.match(
    backgroundJs,
    /if \(lastError\) \{\s*throw normalizeApiError\(lastError\);\s*\}/
);

console.log('api connection static tests passed');
