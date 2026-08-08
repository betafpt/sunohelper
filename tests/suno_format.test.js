const assert = require('assert');

const { normalizeGeneratedSong } = require('../scripts/suno_format.js');

const current = normalizeGeneratedSong({
    style_of_music: 'Warm indie folk, 92 bpm, close vocal, natural room depth',
    lyrics: '[Verse]\nA small lamp by the window',
    exclude_styles: 'brittle highs, harsh cymbals, over-compression',
    production_notes: 'Keep the vocal intimate and the master dynamic.'
});

assert.deepStrictEqual(current, {
    style_of_music: 'Warm indie folk, 92 bpm, close vocal, natural room depth',
    style_tags: 'Warm indie folk, 92 bpm, close vocal, natural room depth',
    lyrics: '[Verse]\nA small lamp by the window',
    exclude_styles: 'brittle highs, harsh cymbals, over-compression',
    production_notes: 'Keep the vocal intimate and the master dynamic.'
});

const legacy = normalizeGeneratedSong({
    style_tags: 'instrumental, afro house, organic percussion, 120 bpm',
    lyrics: '[Instrumental]\n[No Vocals]\n[Drop]'
});

assert.deepStrictEqual(legacy, {
    style_of_music: 'instrumental, afro house, organic percussion, 120 bpm',
    style_tags: 'instrumental, afro house, organic percussion, 120 bpm',
    lyrics: '[Instrumental]\n[No Vocals]\n[Drop]',
    exclude_styles: '',
    production_notes: ''
});

const longStyle = normalizeGeneratedSong({
    style_of_music: 'a'.repeat(1005),
    lyrics: '[Verse]\nShort line'
});

assert.strictEqual(longStyle.style_of_music.length, 1000);
assert.strictEqual(longStyle.style_tags.length, 1000);

assert.throws(
    () => normalizeGeneratedSong({ style_of_music: '', lyrics: 'words' }),
    /Format JSON loi|Format JSON lỗi/
);

console.log('suno_format tests passed');
