const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const popupHtml = read('popup/index.html');
const popupCss = read('popup/style.css');
const contentJs = read('scripts/content.js');
const contentCss = read('scripts/content.css');
const manifest = read('manifest.json');
const iconsaxManifest = JSON.parse(read('vendor/iconsax/manifest.json'));
const bundledIconsaxCategories = new Set(
    fs.readdirSync(path.join(root, 'vendor/iconsax/data')).map((file) => file.replace(/\.json$/, ''))
);
const iconsaxAliases = Object.fromEntries(
    [...contentJs.matchAll(/^\s{4}([a-zA-Z0-9]+):\s*'([^']+)'/gm)].map((match) => [match[1], match[2]])
);

assert.match(popupHtml, /class="[^"]*glass-shell/);
assert.match(popupHtml, /class="[^"]*glass-card/);
assert.match(popupCss, /--glass-bg:/);
assert.match(popupCss, /--glass-lime:/);
assert.match(popupCss, /backdrop-filter:\s*blur/);
assert.match(popupCss, /\.glass-button::before/);
assert.match(popupCss, /@keyframes glass-press/);

assert.match(contentCss, /--glass-bg:/);
assert.match(contentCss, /--glass-lime:/);
assert.match(contentCss, /backdrop-filter:\s*blur/);
assert.match(contentCss, /#suno-studio-sidebar\.open\s*~\s*#ss-toggle-btn/);
assert.match(contentCss, /#ss-tabs\s*\{/);
assert.match(contentCss, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
assert.match(contentCss, /#ss-tabs::-webkit-scrollbar\s*\{\s*display:\s*none;/);
assert.match(contentCss, /\.ss-btn::before/);
assert.match(contentCss, /\.ss-icon-loading/);
assert.match(contentCss, /@keyframes ss-icon-spin/);
assert.match(contentCss, /@keyframes glass-bounce/);
assert.match(contentCss, /\.ss-select-trigger/);
assert.match(contentCss, /\.ss-select-menu/);
assert.match(contentCss, /\.ss-select-check/);
assert.match(contentCss, /\.ss-copy-field/);
assert.match(contentCss, /\.ss-field-heading/);
assert.match(contentCss, /\.ss-copy-btn/);
assert.match(contentCss, /\.ss-copy-btn\.is-copied/);
assert.match(contentCss, /\.ss-history-toolbar/);
assert.match(contentCss, /\.ss-history-card/);
assert.match(contentCss, /\.ss-history-details/);
assert.match(contentCss, /\.ss-history-details\[hidden\]/);
assert.match(contentCss, /\.ss-history-summary/);
assert.match(contentCss, /\.ss-history-chevron/);
assert.match(contentCss, /\.ss-history-empty/);
assert.match(contentCss, /\.ss-icon-btn/);
assert.match(contentCss, /\.ss-waveform-bg/);
assert.match(contentCss, /\.ss-waveform-plane/);
assert.match(contentCss, /\.ss-waveform-line/);
assert.match(contentCss, /\.ss-wave-bg-bar/);
assert.match(contentCss, /\.ss-waveform-depth-grid/);
assert.match(contentCss, /\.ss-waveform-bg\.is-interacting/);
assert.match(contentCss, /transform-style:\s*preserve-3d/);
assert.match(contentCss, /filter:\s*drop-shadow/);
assert.match(contentCss, /@keyframes waveform-react/);
assert.match(contentCss, /prefers-reduced-motion:\s*reduce/);
assert.match(contentCss, /@keyframes glass-menu-in/);
assert.match(contentCss, /#suno-studio-sidebar input\[type="text"\]/);

assert.match(contentJs, /enhanceSelectMenus/);
assert.match(contentJs, /iconsaxIcon/);
assert.match(contentJs, /type="\$\{type\}"/);
assert.match(contentJs, /iconsax-runtime/);
assert.match(contentJs, /vendor\/iconsax\/index\.js/);
assert.match(contentJs, /<iconsax-icon/);
assert.match(contentJs, /ss-native-select/);
assert.match(contentJs, /ss-select-check/);
assert.match(contentJs, /copy:\s*'copy'/);
assert.match(contentJs, /clock:\s*'clock'/);
assert.match(contentJs, /trash:\s*'trash'/);
assert.match(contentJs, /refresh:\s*'refresh-circle'/);
assert.strictEqual(iconsaxAliases.history, 'music-library-2');
assert.ok(iconsaxManifest[iconsaxAliases.history], 'history icon must exist in the Iconsax manifest');
assert.ok(
    bundledIconsaxCategories.has(iconsaxManifest[iconsaxAliases.history].category),
    'history icon category must be bundled in vendor/iconsax/data'
);
assert.match(contentJs, /renderWaveformBackground/);
assert.match(contentJs, /setupHeaderWaveformInteraction/);
assert.match(contentJs, /pointermove/);
assert.match(contentJs, /--wave-tilt-x/);
assert.match(contentJs, /--wave-tilt-y/);
assert.match(contentJs, /ss-waveform-bg/);
assert.match(contentJs, /ss-wave-bg-bar/);
assert.match(contentJs, /--wave-index/);
assert.match(contentJs, /--wave-color/);
assert.match(contentJs, /--wave-depth/);
assert.match(contentJs, /setWaveformReacting\(true\)/);
assert.match(contentJs, /iconLabel\('history'/);
assert.match(contentJs, /copyableField/);
assert.match(contentJs, /class="ss-copy-btn"/);
assert.match(contentJs, /data-copy-text/);
assert.match(contentJs, /navigator\.clipboard/);
assert.match(contentJs, /handleCopyClick/);
assert.match(contentJs, /sidebar\.addEventListener\('click', handleCopyClick\)/);
assert.match(contentJs, /<button type="button" class="ss-tab/);
assert.match(contentJs, /songHistoryKey/);
assert.match(contentJs, /songHistoryLimit\s*=\s*30/);
assert.match(contentJs, /saveGeneratedSong/);
assert.match(contentJs, /renderHistory/);
assert.match(contentJs, /tab-history/);
assert.match(contentJs, /ss-history-list/);
assert.match(contentJs, /ss-history-clear/);
assert.match(contentJs, /ss-history-load/);
assert.match(contentJs, /data-history-toggle/);
assert.match(contentJs, /aria-expanded="false"/);
assert.match(contentJs, /class="ss-history-details"[^>]*hidden/);
assert.match(contentJs, /toggleHistoryCard/);
assert.match(contentJs, /chrome\.storage\.local\.set\(\s*\{\s*\[songHistoryKey\]/);
assert.match(contentJs, /fillSunoForm\(item\.lyrics,\s*item\.style\)/);
assert.match(manifest, /vendor\/iconsax\/index\.js/);
assert.match(manifest, /vendor\/iconsax\/manifest\.json/);
assert.match(manifest, /vendor\/iconsax\/data\/\*\.json/);

assert.doesNotMatch(contentCss, /^input\[type="text"\], select, textarea/m);
assert.doesNotMatch(contentCss, /^input:focus, select:focus, textarea:focus/m);
assert.doesNotMatch(contentCss, /^::-webkit-scrollbar/m);
assert.doesNotMatch(contentCss, /overflow-x:\s*auto/);
assert.doesNotMatch(contentCss, /--clay-/);
assert.doesNotMatch(contentJs + contentCss, /ss-waveform-3d|ss-waveform-core|ss-waveform-rail|ss-waveform-shine/);
assert.doesNotMatch(popupHtml + popupCss + contentCss, /clay/i);
assert.doesNotMatch(popupHtml + contentJs, /Ãƒ|Ã„|Ã¡Âº|Ã¡Â»|Ã°Å¸|Ã¢Å“|Ã¢â€“|Ã¢â€”/);
assert.doesNotMatch(contentJs, /[✨🔍💡📑📁🎥🎵📄✅◀▶⌄]/u);
assert.doesNotMatch(contentJs, /<svg|<path|iconsaxPaths|data-iconsax=/);

console.log('glassmorphism UI static tests passed');
