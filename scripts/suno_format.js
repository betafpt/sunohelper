(function(root) {
    function clean(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function normalizeGeneratedSong(data) {
        const style = clean(data && (data.style_of_music || data.style_tags)).slice(0, 1000);
        const lyrics = clean(data && data.lyrics);

        if (!style || !lyrics) {
            throw new Error('Format JSON loi');
        }

        return {
            style_of_music: style,
            style_tags: style,
            lyrics,
            exclude_styles: clean(data.exclude_styles),
            production_notes: clean(data.production_notes)
        };
    }

    root.normalizeGeneratedSong = normalizeGeneratedSong;

    if (typeof module !== 'undefined') {
        module.exports = { normalizeGeneratedSong };
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
