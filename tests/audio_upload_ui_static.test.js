const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const contentJs = read('scripts/content.js');
const contentCss = read('scripts/content.css');

assert.match(contentJs, /const maxAudioUploadBytes\s*=\s*20\s*\*\s*1024\s*\*\s*1024/);
assert.match(contentJs, /const maxAudioSourceBytes\s*=\s*200\s*\*\s*1024\s*\*\s*1024/);
assert.match(contentJs, /const optimizedAudioSampleRate\s*=\s*16000/);
assert.match(contentJs, /const optimizedAudioMaxSeconds\s*=\s*120/);
assert.match(contentJs, /formatFileSize/);
assert.match(contentJs, /shouldOptimizeAudioFile/);
assert.match(contentJs, /optimizeAudioFileForAnalysis/);
assert.match(contentJs, /extractAudioFeatureProfile/);
assert.match(contentJs, /encodeAudioBufferToWav/);
assert.match(contentJs, /audioBlobToBase64/);
assert.match(contentJs, /getAudioPayload/);
assert.match(contentJs, /setStatus\(/);
assert.match(contentJs, /clearStatus\(/);
assert.match(contentJs, /ss-status-message/);
assert.match(contentJs, /File tr.n 20MB.*t.i .u/);
assert.match(contentJs, /Tệp đã sẵn sàng để đọc đặc trưng/);
assert.match(contentJs, /Tệp lớn sẽ được đọc đặc trưng cục bộ/);
assert.match(contentJs, /Đang phân tích đặc trưng âm thanh/);
assert.match(contentJs, /format:\s*'wav'/);
assert.doesNotMatch(contentJs, /4\s*\*\s*1024\s*\*\s*1024/);
assert.doesNotMatch(contentJs, /v..t qu. 4MB/);
assert.doesNotMatch(contentJs, /Gi.i h.n d..i 4MB/);
assert.doesNotMatch(contentJs, /v..t qu. gi.i h.n \$\{formatFileSize\(maxAudioUploadBytes\)\}/);

assert.match(contentCss, /\.ss-status\.active/);
assert.match(contentCss, /\.ss-status-icon/);
assert.match(contentCss, /\.ss-status-message/);
assert.match(contentCss, /\.ss-status\.active[\s\S]*align-items:\s*flex-start/);
assert.match(contentCss, /\.ss-status\.active[\s\S]*overflow:\s*visible/);
assert.match(contentCss, /\.ss-status\.active[\s\S]*margin-bottom:\s*10px/);
assert.match(contentCss, /\.ss-status-error/);
assert.match(contentCss, /\.ss-status-success/);
assert.match(contentCss, /\.ss-status-info/);
assert.match(contentCss, /\.ss-status-warning/);
assert.match(contentCss, /backdrop-filter:\s*blur/);

console.log('audio upload UI static tests passed');
