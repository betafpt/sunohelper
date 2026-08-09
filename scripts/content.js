// Helper to find Suno's inputs
function normalizeFieldText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getFieldContext(element) {
    const parts = [
        element.id,
        element.name,
        element.className,
        element.getAttribute('placeholder'),
        element.getAttribute('aria-label'),
        element.getAttribute('data-testid')
    ];

    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 5) {
        const text = parent.innerText || parent.textContent || '';
        if (text && text.length < 1200) parts.push(text);
        parent = parent.parentElement;
        depth++;
    }

    return normalizeFieldText(parts.filter(Boolean).join(' '));
}

function scoreField(element, type) {
    const context = getFieldContext(element);
    const hasLyrics = /\blyrics?\b|\blyric writing\b|\bloi bai hat\b|\bstart writing lyrics\b/.test(context);
    const hasStyle = /\bstyles?\b|\bstyle of music\b|\bthe loai\b|\bmo ta phong cach\b|\bsounds?\b/.test(context);

    if (type === 'lyrics') {
        return (hasLyrics ? 10 : 0) - (hasStyle && !hasLyrics ? 8 : 0);
    }

    return (hasStyle ? 10 : 0) - (hasLyrics && !hasStyle ? 8 : 0);
}

function pickBestField(candidates, type, excluded = null) {
    let best = null;
    let bestScore = 0;

    for (const candidate of candidates) {
        if (candidate === excluded) continue;
        const score = scoreField(candidate, type);
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }

    return best;
}

function isStudioUiElement(element) {
    let current = element;
    while (current) {
        if (current.id === 'suno-studio-sidebar' || current.id === 'ss-toggle-btn') return true;
        current = current.parentElement;
    }
    return false;
}

function querySunoFields(selectors) {
    return selectors
        .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        .filter((item) => !isStudioUiElement(item));
}

function findInputs() {
    const textareas = querySunoFields(['textarea']);
    const textInputs = querySunoFields([
        'input[type="text"]',
        'input:not([type])',
        'input[type=""]',
        'input[type="search"]',
        'input[role="combobox"]'
    ]);
    const editableFields = querySunoFields([
        '[contenteditable="true"]',
        '[contenteditable]'
    ]);
    const roleTextboxes = querySunoFields([
        '[role="textbox"]',
        '[role="combobox"]'
    ]);
    const candidates = [...new Set([...textareas, ...textInputs, ...editableFields, ...roleTextboxes])];

    let lyricsEl = pickBestField(candidates, 'lyrics');
    let styleEl = pickBestField(candidates, 'style', lyricsEl);

    if (!lyricsEl && textareas.length > 0) {
        lyricsEl = styleEl ? textareas.find((item) => item !== styleEl) : textareas[0];
    }

    if (!styleEl) {
        styleEl = candidates.find((item) => item !== lyricsEl && scoreField(item, 'style') > 0);
    }

    if (!styleEl && lyricsEl) {
        const lyricsIndex = candidates.indexOf(lyricsEl);
        styleEl = candidates.find((item, index) => item !== lyricsEl && index > lyricsIndex)
            || candidates.find((item) => item !== lyricsEl);
    }

    return { lyricsEl, styleEl };
}

// React controlled input helper
function dispatchValueEvents(element, value) {
    let inputEvent = null;
    try {
        if (typeof InputEvent === 'function') {
            inputEvent = new InputEvent('input', {
                bubbles: true,
                inputType: 'insertText',
                data: value
            });
        }
    } catch (error) {
        inputEvent = null;
    }

    element.dispatchEvent(inputEvent || new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
}

function selectEditableContents(element) {
    try {
        const selection = window.getSelection?.();
        const range = document.createRange?.();
        if (!selection || !range) return;

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    } catch (error) {
        // Some rich-text editors block selection APIs until focused.
    }
}

function setEditableValue(element, value) {
    element.focus?.();
    selectEditableContents(element);

    let inserted = false;
    if (typeof document.execCommand === 'function') {
        try {
            document.execCommand('selectAll', false, null);
            inserted = document.execCommand('insertText', false, value);
        } catch (error) {
            inserted = false;
        }
    }

    if (!inserted) {
        element.textContent = value;
    }

    dispatchValueEvents(element, value);
}

function setNativeValue(element, value) {
    if (!element) return;
    if (element.isContentEditable || (!('value' in element) && element.getAttribute('role') === 'textbox')) {
        setEditableValue(element, value);
        return;
    }

    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    
    if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
    else if (valueSetter) valueSetter.call(element, value);
    else element.value = value;
    
    dispatchValueEvents(element, value);
}

function fillSunoForm(lyrics, styleTags) {
    const { lyricsEl, styleEl } = findInputs();
    if (lyricsEl && lyrics) setNativeValue(lyricsEl, lyrics);
    if (styleEl && styleTags) setNativeValue(styleEl, styleTags);
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const iconsaxNames = {
    music: 'music',
    search: 'search-normal',
    lamp: 'lamp-on',
    chart: 'chart',
    layers: 'layer',
    document: 'document-text',
    folder: 'folder-open',
    video: 'video-play',
    import: 'import-arrow-01',
    tick: 'tick-circle',
    copy: 'copy',
    clock: 'clock',
    history: 'music-library-2',
    trash: 'trash',
    refresh: 'refresh-circle',
    loading: 'refresh-circle',
    warning: 'warning-2',
    danger: 'danger',
    info: 'info-circle',
    arrowLeft: 'arrow-left-02',
    arrowRight: 'arrow-right-02',
    arrowDown: 'arrow-down-02',
    arrowUp: 'arrow-up-02'
};

const songHistoryKey = 'grythmSongHistory';
const songHistoryLimit = 30;
const maxAudioUploadBytes = 20 * 1024 * 1024;
const maxAudioSourceBytes = 200 * 1024 * 1024;
const optimizedAudioSampleRate = 16000;
const optimizedAudioMaxSeconds = 120;
const audioFeatureSampleRate = 12000;
const audioFeatureMaxSeconds = 120;
const audioFeatureFrameSize = 1024;
const audioFeatureHopSize = 512;

function loadIconsaxRuntime() {
    if (document.getElementById('iconsax-runtime')) return;

    const script = document.createElement('script');
    script.id = 'iconsax-runtime';
    script.type = 'module';
    script.src = chrome.runtime.getURL('vendor/iconsax/index.js');
    document.documentElement.appendChild(script);
}

function iconsaxIcon(alias, className = 'ss-icon', type = 'bulk') {
    const name = iconsaxNames[alias] || alias;
    const loadingClass = alias === 'loading' ? ' ss-icon-loading' : '';
    return `<iconsax-icon class="${className}${loadingClass}" name="${name}" type="${type}" size="18" color="currentColor" aria-hidden="true"></iconsax-icon>`;
}

function iconLabel(icon, text, className = 'ss-btn-label') {
    return `<span class="${className}">${iconsaxIcon(icon)}<span>${escapeHtml(text)}</span></span>`;
}

function renderWaveformLine(layer, scale = 1, opacity = 1) {
    const bars = [12, 18, 26, 38, 48, 34, 55, 42, 28, 44, 62, 46, 32, 52, 39, 25, 30, 45, 58, 41, 24, 36, 49, 33, 20, 27, 35];
    const palette = [
        ['#6fd7f0', '#cdf65c', 'rgba(91, 215, 237, 0.28)'],
        ['#b998ff', '#5bd7ed', 'rgba(124, 58, 237, 0.22)'],
        ['#cdf65c', '#75dff0', 'rgba(205, 246, 92, 0.24)'],
        ['#f293bd', '#8fd8ff', 'rgba(240, 91, 156, 0.2)']
    ];

    return bars.map((height, index) => {
        const [color, lowColor, glow] = palette[index % palette.length];
        const depth = Math.round((8 + (index % 6) * 4) * scale);
        const width = index % 5 === 0 ? 6 : index % 2 === 0 ? 4 : 3;
        return `<span class="ss-wave-bg-bar" style="--wave-index:${index}; --wave-height:${Math.round(height * scale)}px; --wave-width:${width}px; --wave-depth:${depth}px; --wave-rest-depth:${Math.max(2, depth - 7)}px; --wave-color:${color}; --wave-low:${lowColor}; --wave-glow:${glow}; --wave-opacity:${opacity}; --wave-delay:${index * -52}ms;"></span>`;
    }).join('');
}

function renderWaveformBackground() {
    return `
        <div class="ss-waveform-bg" aria-hidden="true">
            <span class="ss-waveform-depth-grid"></span>
            <span class="ss-waveform-plane">
                <span class="ss-waveform-line ss-waveform-line-back">${renderWaveformLine('back', 0.7, 0.28)}</span>
                <span class="ss-waveform-line ss-waveform-line-main">${renderWaveformLine('main', 1, 0.72)}</span>
                <span class="ss-waveform-line ss-waveform-line-front">${renderWaveformLine('front', 0.86, 0.4)}</span>
            </span>
        </div>
    `;
}

function setWaveformReacting(isReacting) {
    document.querySelector('.ss-waveform-bg')?.classList.toggle('is-reacting', Boolean(isReacting));
}

function setupHeaderWaveformInteraction(root = document) {
    const header = root.querySelector('#ss-header');
    const waveform = header?.querySelector('.ss-waveform-bg');
    if (!header || !waveform) return;

    const reset = () => {
        header.style.setProperty('--wave-tilt-x', '0deg');
        header.style.setProperty('--wave-tilt-y', '0deg');
        header.style.setProperty('--wave-shift-x', '0px');
        header.style.setProperty('--wave-shift-y', '0px');
        waveform.classList.remove('is-interacting', 'is-pressed');
    };

    header.addEventListener('pointermove', (event) => {
        const rect = header.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

        header.style.setProperty('--wave-tilt-x', `${((0.5 - y) * 10).toFixed(2)}deg`);
        header.style.setProperty('--wave-tilt-y', `${((x - 0.5) * 14).toFixed(2)}deg`);
        header.style.setProperty('--wave-shift-x', `${((x - 0.5) * 18).toFixed(2)}px`);
        header.style.setProperty('--wave-shift-y', `${((y - 0.5) * 10).toFixed(2)}px`);
        waveform.classList.add('is-interacting');
    });

    header.addEventListener('pointerleave', reset);
    header.addEventListener('pointercancel', reset);
    header.addEventListener('pointerdown', () => waveform.classList.add('is-pressed'));
    header.addEventListener('pointerup', () => waveform.classList.remove('is-pressed'));
}

function formatFileSize(bytes) {
    const mb = bytes / (1024 * 1024);
    const value = mb >= 10 ? Math.round(mb) : Number(mb.toFixed(1));
    return `${value}MB`;
}

function setStatus(element, message, type = 'info') {
    if (!element) return;
    const statusIcon = {
        error: 'danger',
        success: 'tick',
        warning: 'warning',
        loading: 'loading',
        info: 'info'
    }[type] || 'info';

    element.className = `ss-status active ss-status-${type}`;
    setWaveformReacting(type === 'loading');
    element.innerHTML = `
        <span class="ss-status-icon">${iconsaxIcon(statusIcon, 'ss-icon ss-status-icon-inner')}</span>
        <span class="ss-status-message">${escapeHtml(message)}</span>
    `;
}

function clearStatus(element) {
    if (!element) return;
    setWaveformReacting(false);
    element.className = 'ss-status';
    element.textContent = '';
}

function getAudioFormatFromFile(file) {
    const extension = ((file?.name || '').split('.').pop() || '').toLowerCase();
    if (['wav', 'm4a', 'ogg'].includes(extension)) return extension;
    return 'mp3';
}

function isChatAudioInputFormatSupported(format) {
    return ['mp3', 'wav'].includes(format);
}

function getAudioOptimizationReason(file) {
    if (file.size > maxAudioUploadBytes) return 'size';
    if (!isChatAudioInputFormatSupported(getAudioFormatFromFile(file))) return 'format';
    return null;
}

function shouldOptimizeAudioFile(file) {
    return getAudioOptimizationReason(file) !== null;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Không thể đọc file âm thanh.'));
        reader.readAsDataURL(file);
    });
}

function readFileAsArrayBuffer(file) {
    if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('Không thể đọc file âm thanh.'));
        reader.readAsArrayBuffer(file);
    });
}

function writeWavString(view, offset, value) {
    for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
    }
}

function encodeAudioBufferToWav(audioBuffer) {
    const durationSeconds = Math.min(audioBuffer.duration, optimizedAudioMaxSeconds);
    const frameCount = Math.max(1, Math.floor(durationSeconds * optimizedAudioSampleRate));
    const channelCount = Math.max(1, audioBuffer.numberOfChannels);
    const samples = new Float32Array(frameCount);
    const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));
    const ratio = audioBuffer.sampleRate / optimizedAudioSampleRate;

    for (let i = 0; i < frameCount; i++) {
        const sourceIndex = i * ratio;
        const leftIndex = Math.floor(sourceIndex);
        const rightIndex = Math.min(leftIndex + 1, audioBuffer.length - 1);
        const weight = sourceIndex - leftIndex;
        let mixed = 0;

        for (const channel of channels) {
            const left = channel[leftIndex] || 0;
            const right = channel[rightIndex] || left;
            mixed += left + (right - left) * weight;
        }

        samples[i] = Math.max(-1, Math.min(1, mixed / channelCount));
    }

    const dataSize = frameCount * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeWavString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeWavString(view, 8, 'WAVE');
    writeWavString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, optimizedAudioSampleRate, true);
    view.setUint32(28, optimizedAudioSampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeWavString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (const sample of samples) {
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function audioBlobToBase64(blob) {
    return readFileAsDataUrl(blob).then((dataUrl) => dataUrl.split(',')[1]);
}

async function decodeAudioFileForAnalysis(file) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        throw new Error('Trình duyệt không hỗ trợ đọc audio. Hãy thử MP3/WAV khác hoặc dùng YouTube Link.');
    }

    const audioContext = new AudioContextClass();
    try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        try {
            return await audioContext.decodeAudioData(arrayBuffer.slice(0));
        } catch (error) {
            throw new Error('Không thể đọc file này. Hãy thử MP3/WAV/M4A/OGG khác hoặc dùng YouTube Link.');
        }
    } finally {
        audioContext.close?.();
    }
}

function roundAudioNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return null;
    return Number(value.toFixed(digits));
}

function sampleAudioBufferForFeatures(audioBuffer) {
    const durationSeconds = Math.min(audioBuffer.duration || 0, audioFeatureMaxSeconds);
    const frameCount = Math.max(1, Math.floor(durationSeconds * audioFeatureSampleRate));
    const channelCount = Math.max(1, audioBuffer.numberOfChannels || 1);
    const channels = Array.from({ length: channelCount }, (_, index) => audioBuffer.getChannelData(index));
    const samples = new Float32Array(frameCount);
    const ratio = audioBuffer.sampleRate / audioFeatureSampleRate;

    for (let i = 0; i < frameCount; i++) {
        const sourceIndex = Math.min(Math.floor(i * ratio), Math.max(0, audioBuffer.length - 1));
        let mixed = 0;
        for (const channel of channels) {
            mixed += channel[sourceIndex] || 0;
        }
        samples[i] = Math.max(-1, Math.min(1, mixed / channelCount));
    }

    return { samples, sampleRate: audioFeatureSampleRate, durationSeconds };
}

function calculateAudioEnergy(samples) {
    let sumSquares = 0;
    let peak = 0;
    let silenceCount = 0;

    for (const sample of samples) {
        const absolute = Math.abs(sample);
        sumSquares += sample * sample;
        peak = Math.max(peak, absolute);
        if (absolute < 0.015) silenceCount++;
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, samples.length));
    const crestFactor = rms > 0 ? peak / rms : 0;
    const level = rms < 0.06 ? 'low' : rms < 0.16 ? 'moderate' : 'high';

    return {
        rms,
        peak,
        crestFactor,
        silenceRatio: silenceCount / Math.max(1, samples.length),
        level
    };
}

function calculateZeroCrossingRate(samples) {
    if (samples.length < 2) return 0;
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
        if ((samples[i - 1] >= 0 && samples[i] < 0) || (samples[i - 1] < 0 && samples[i] >= 0)) crossings++;
    }
    return crossings / (samples.length - 1);
}

function buildEnergyCurve(samples, segmentCount = 8) {
    const curve = [];
    const segmentLength = Math.max(1, Math.floor(samples.length / segmentCount));

    for (let segment = 0; segment < segmentCount; segment++) {
        const start = segment * segmentLength;
        const end = segment === segmentCount - 1 ? samples.length : Math.min(samples.length, start + segmentLength);
        let sumSquares = 0;
        for (let i = start; i < end; i++) sumSquares += samples[i] * samples[i];
        curve.push(roundAudioNumber(Math.sqrt(sumSquares / Math.max(1, end - start)), 3));
    }

    return curve;
}

function estimateTempoBpm(samples, sampleRate) {
    if (samples.length < audioFeatureFrameSize * 4) {
        return { estimatedBpm: null, confidence: 0, onsetDensity: 0, feel: 'tempo unclear' };
    }

    const energies = [];
    for (let offset = 0; offset + audioFeatureFrameSize <= samples.length; offset += audioFeatureHopSize) {
        let sumSquares = 0;
        for (let i = 0; i < audioFeatureFrameSize; i++) {
            const sample = samples[offset + i];
            sumSquares += sample * sample;
        }
        energies.push(Math.sqrt(sumSquares / audioFeatureFrameSize));
    }

    const onsets = [];
    let onsetTotal = 0;
    for (let i = 1; i < energies.length; i++) {
        const onset = Math.max(0, energies[i] - energies[i - 1]);
        onsets.push(onset);
        onsetTotal += onset;
    }

    if (onsetTotal <= 0.0001) {
        return { estimatedBpm: null, confidence: 0, onsetDensity: 0, feel: 'tempo unclear' };
    }

    const meanOnset = onsetTotal / onsets.length;
    const strongOnsets = onsets.filter((value) => value > meanOnset * 1.35).length;
    const onsetDensity = strongOnsets / Math.max(1, onsets.length);
    const framesPerSecond = sampleRate / audioFeatureHopSize;
    const autoEnergy = onsets.reduce((total, value) => total + value * value, 0);
    let bestBpm = null;
    let bestScore = 0;

    for (let bpm = 60; bpm <= 180; bpm++) {
        const lag = Math.max(1, Math.round((60 / bpm) * framesPerSecond));
        let score = 0;
        for (let i = lag; i < onsets.length; i++) {
            score += onsets[i] * onsets[i - lag];
        }
        if (score > bestScore) {
            bestScore = score;
            bestBpm = bpm;
        }
    }

    const confidence = Math.max(0, Math.min(1, bestScore / Math.max(0.0001, autoEnergy)));
    const feel = !bestBpm ? 'tempo unclear' : bestBpm < 80 ? 'slow' : bestBpm < 115 ? 'mid-tempo' : bestBpm < 145 ? 'upbeat' : 'fast';

    return {
        estimatedBpm: bestBpm,
        confidence: roundAudioNumber(confidence, 2),
        onsetDensity: roundAudioNumber(onsetDensity, 3),
        feel
    };
}

function calculateSpectralProfile(samples, sampleRate) {
    const frameSize = audioFeatureFrameSize;
    if (samples.length < frameSize) {
        return {
            spectralCentroidHz: 0,
            brightness: 'unclear',
            subRatio: 0,
            bassRatio: 0,
            lowRatio: 0,
            lowMidRatio: 0,
            midRatio: 0,
            presenceRatio: 0,
            highRatio: 0
        };
    }

    const frameCount = Math.min(18, Math.max(1, Math.floor(samples.length / frameSize)));
    const maxBin = Math.floor(frameSize / 2);
    const bands = { sub: 0, bass: 0, lowMid: 0, mid: 0, presence: 0, high: 0 };
    let magnitudeTotal = 0;
    let weightedFrequencyTotal = 0;

    for (let frame = 0; frame < frameCount; frame++) {
        const start = frameCount === 1 ? 0 : Math.floor((samples.length - frameSize) * (frame / (frameCount - 1)));
        for (let bin = 1; bin <= maxBin; bin++) {
            const frequency = (bin * sampleRate) / frameSize;
            let real = 0;
            let imaginary = 0;

            for (let i = 0; i < frameSize; i++) {
                const windowValue = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frameSize - 1));
                const sample = samples[start + i] * windowValue;
                const angle = (2 * Math.PI * bin * i) / frameSize;
                real += sample * Math.cos(angle);
                imaginary -= sample * Math.sin(angle);
            }

            const magnitude = Math.sqrt(real * real + imaginary * imaginary);
            magnitudeTotal += magnitude;
            weightedFrequencyTotal += frequency * magnitude;

            if (frequency < 90) bands.sub += magnitude;
            else if (frequency < 250) bands.bass += magnitude;
            else if (frequency < 800) bands.lowMid += magnitude;
            else if (frequency < 2500) bands.mid += magnitude;
            else if (frequency < 4500) bands.presence += magnitude;
            else bands.high += magnitude;
        }
    }

    const safeTotal = Math.max(0.0001, magnitudeTotal);
    const centroid = weightedFrequencyTotal / safeTotal;
    const brightness = centroid < 1100 ? 'warm/dark' : centroid < 2200 ? 'balanced' : 'bright/forward';

    return {
        spectralCentroidHz: roundAudioNumber(centroid, 0),
        brightness,
        subRatio: roundAudioNumber(bands.sub / safeTotal, 3),
        bassRatio: roundAudioNumber(bands.bass / safeTotal, 3),
        lowRatio: roundAudioNumber((bands.sub + bands.bass) / safeTotal, 3),
        lowMidRatio: roundAudioNumber(bands.lowMid / safeTotal, 3),
        midRatio: roundAudioNumber(bands.mid / safeTotal, 3),
        presenceRatio: roundAudioNumber(bands.presence / safeTotal, 3),
        highRatio: roundAudioNumber(bands.high / safeTotal, 3)
    };
}

function calculateCurveMotion(values) {
    if (!values.length) return { range: 0, variation: 0, alternatingMotion: 0 };

    const max = Math.max(...values);
    const min = Math.min(...values);
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    let alternatingMotion = 0;

    for (let i = 2; i < values.length; i++) {
        const previous = values[i - 1] - values[i - 2];
        const current = values[i] - values[i - 1];
        if ((previous > 0 && current < 0) || (previous < 0 && current > 0)) alternatingMotion++;
    }

    return {
        range: roundAudioNumber(max - min, 3),
        variation: roundAudioNumber((max - min) / Math.max(0.001, mean), 2),
        alternatingMotion: roundAudioNumber(alternatingMotion / Math.max(1, values.length - 2), 2)
    };
}

function isBpmInRange(bpm, min, max) {
    return Number.isFinite(bpm) && bpm >= min && bpm <= max;
}

function scoreAmapianoLogDrumCue(tone, tempo, zeroCrossingRate, energyCurve = []) {
    const evidence = [];
    const subRatio = tone.subRatio || 0;
    const bassRatio = tone.bassRatio || 0;
    const lowEndDominance = (tone.lowRatio || 0) || (subRatio + bassRatio);
    const highDetail = (tone.presenceRatio || 0) + (tone.highRatio || 0);
    const onsetDensity = tempo.onsetDensity || 0;
    const bpm = tempo.estimatedBpm;
    const doubleTimeBpm = bpm && bpm < 80 ? bpm * 2 : null;
    const curveMotion = calculateCurveMotion(energyCurve);
    let score = 0;

    if (isBpmInRange(bpm, 108, 116) || isBpmInRange(doubleTimeBpm, 108, 116)) {
        score += 0.24;
        evidence.push('tempo close to common amapiano range');
    } else if (isBpmInRange(bpm, 98, 125) || isBpmInRange(doubleTimeBpm, 98, 125)) {
        score += 0.14;
        evidence.push('tempo is compatible with Afro-house/amapiano-adjacent groove');
    }

    if (lowEndDominance >= 0.34) {
        score += 0.24;
        evidence.push('strong sub/bass-band dominance');
    } else if (lowEndDominance >= 0.23) {
        score += 0.14;
        evidence.push('noticeable low-end presence');
    }

    if (subRatio >= 0.12 && bassRatio >= 0.1) {
        score += 0.16;
        evidence.push('sub and bass bands both active, compatible with log-drum style low-end');
    }

    if (onsetDensity >= 0.17) {
        score += 0.18;
        evidence.push('busy transient/onset activity');
    } else if (onsetDensity >= 0.09) {
        score += 0.1;
        evidence.push('steady percussive activity');
    }

    if (highDetail >= 0.12 || zeroCrossingRate >= 0.07) {
        score += 0.08;
        evidence.push('upper transient detail suggests hats/shakers/percussion');
    }

    if (curveMotion.variation >= 0.75 && curveMotion.alternatingMotion >= 0.35) {
        score += 0.1;
        evidence.push('pulsing energy curve suggests groove movement');
    }

    score = Math.max(0, Math.min(1, score));
    const confidence = score >= 0.65 ? 'strong' : score >= 0.45 ? 'possible' : 'weak';

    return {
        score: roundAudioNumber(score, 2),
        confidence,
        evidence,
        doubleTimeBpm,
        curveMotion
    };
}

function inferInstrumentAndBassHints(tone, tempo, energy, zeroCrossingRate) {
    const subRatio = tone.subRatio || 0;
    const bassRatio = tone.bassRatio || 0;
    const lowMidRatio = tone.lowMidRatio || 0;
    const midRatio = tone.midRatio || 0;
    const presenceRatio = tone.presenceRatio || 0;
    const highRatio = tone.highRatio || 0;
    const lowEndDominance = subRatio + bassRatio;
    const bassToMidRatio = lowEndDominance / Math.max(0.001, midRatio + presenceRatio);
    const onsetDensity = tempo.onsetDensity || 0;
    const doubleTimeBpm = tempo.estimatedBpm && tempo.estimatedBpm < 90
        ? tempo.estimatedBpm * 2
        : null;
    const bassHints = [];
    const instrumentHints = [];
    const grooveHints = [];
    const genreCues = {
        amapianoLogDrum: scoreAmapianoLogDrumCue(tone, tempo, zeroCrossingRate, energy.energyCurve || [])
    };
    const styleFamilyHints = [];

    let bassCharacter = 'controlled/light low-end';
    if (genreCues.amapianoLogDrum.score >= 0.65) {
        bassCharacter = 'percussive low-end with possible amapiano log-drum or syncopated sub-bass feel';
        bassHints.push('strong amapiano log-drum candidate based on low-end and groove evidence');
        styleFamilyHints.push('possible amapiano / Afro-house influence');
    } else if (genreCues.amapianoLogDrum.score >= 0.45) {
        bassCharacter = 'percussive sub-bass with weak-to-moderate amapiano/log-drum possibility';
        bassHints.push('possible percussive sub-bass; amapiano/log-drum evidence is not conclusive');
    } else if (subRatio > 0.18 && onsetDensity > 0.08) {
        bassCharacter = 'deep sub / 808-like bass';
        bassHints.push('deep sub or 808-style bass');
    } else if (bassRatio > 0.16 || lowMidRatio > 0.24) {
        bassCharacter = 'rounded synth bass or bass-guitar body';
        bassHints.push('rounded bass guitar or warm synth bass body');
    }

    if (lowEndDominance > 0.24) instrumentHints.push('bass/sub layer is prominent');
    if (lowMidRatio > 0.2) instrumentHints.push('warm low-mid body: possible keys, guitar, piano, or pad bed');
    if (midRatio > 0.28) instrumentHints.push('midrange melodic layer or vocal-forward texture');
    if (presenceRatio + highRatio > 0.18 || zeroCrossingRate > 0.08) instrumentHints.push('bright percussion, hats, shakers, or transient detail');
    if (onsetDensity > 0.16) instrumentHints.push('active drums/percussion');
    else if (onsetDensity > 0.07) instrumentHints.push('steady drum pocket');

    if (doubleTimeBpm) grooveHints.push(`possible double-time feel around ${doubleTimeBpm} BPM`);
    if (onsetDensity > 0.1 && lowEndDominance > 0.24) grooveHints.push('syncopated bass/drum interaction likely');

    return {
        lowEnd: {
            subRatio: roundAudioNumber(subRatio, 3),
            bassRatio: roundAudioNumber(bassRatio, 3),
            lowEndDominance: roundAudioNumber(lowEndDominance, 3),
            bassToMidRatio: roundAudioNumber(bassToMidRatio, 2),
            possibleDoubleTimeBpm: doubleTimeBpm,
            bassCharacter
        },
        bassHints,
        instrumentHints,
        grooveHints,
        genreCues,
        styleFamilyHints
    };
}

function buildAudioFeatureProfile(audioBuffer, file = {}) {
    const sampled = sampleAudioBufferForFeatures(audioBuffer);
    const energy = calculateAudioEnergy(sampled.samples);
    const tempo = estimateTempoBpm(sampled.samples, sampled.sampleRate);
    const tone = calculateSpectralProfile(sampled.samples, sampled.sampleRate);
    const zeroCrossingRate = calculateZeroCrossingRate(sampled.samples);
    const energyCurve = buildEnergyCurve(sampled.samples);
    const dynamics = energy.crestFactor > 8 ? 'dynamic' : energy.crestFactor > 4 ? 'controlled' : 'compressed';
    const percussiveActivity = tempo.onsetDensity > 0.18 ? 'busy' : tempo.onsetDensity > 0.08 ? 'steady' : 'soft/sparse';
    energy.energyCurve = energyCurve;
    const hints = inferInstrumentAndBassHints(tone, tempo, energy, zeroCrossingRate);

    return {
        analysisMethod: 'local-audio-features-v1',
        source: {
            fileName: file.name || 'unknown audio file',
            originalFormat: getAudioFormatFromFile(file),
            fileSize: Number.isFinite(file.size) ? formatFileSize(file.size) : null,
            durationSeconds: roundAudioNumber(audioBuffer.duration || 0, 1),
            analyzedSeconds: roundAudioNumber(sampled.durationSeconds, 1),
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels
        },
        tempo,
        energy: {
            rms: roundAudioNumber(energy.rms, 3),
            peak: roundAudioNumber(energy.peak, 3),
            crestFactor: roundAudioNumber(energy.crestFactor, 2),
            silenceRatio: roundAudioNumber(energy.silenceRatio, 3),
            level: energy.level,
            dynamics
        },
        tone,
        lowEnd: hints.lowEnd,
        rhythm: {
            zeroCrossingRate: roundAudioNumber(zeroCrossingRate, 3),
            onsetDensity: tempo.onsetDensity,
            percussiveActivity,
            grooveHints: hints.grooveHints
        },
        energyCurve,
        instrumentHints: hints.instrumentHints,
        bassHints: hints.bassHints,
        genreCues: hints.genreCues,
        styleFamilyHints: hints.styleFamilyHints,
        inferredTags: [
            tempo.feel,
            energy.level + ' energy',
            tone.brightness,
            dynamics + ' dynamics',
            percussiveActivity + ' rhythm',
            hints.lowEnd.bassCharacter,
            ...hints.grooveHints,
            ...hints.styleFamilyHints
        ].filter(Boolean)
    };
}

async function extractAudioFeatureProfile(file) {
    const decodedBuffer = await decodeAudioFileForAnalysis(file);
    return buildAudioFeatureProfile(decodedBuffer, file);
}

async function optimizeAudioFileForAnalysis(file) {
    const decodedBuffer = await decodeAudioFileForAnalysis(file);
    const optimizedBlob = encodeAudioBufferToWav(decodedBuffer);
    const base64 = await audioBlobToBase64(optimizedBlob);

    return {
        audioData: base64,
        format: 'wav',
        originalSize: file.size,
        optimizedSize: optimizedBlob.size,
        durationSeconds: Math.min(decodedBuffer.duration, optimizedAudioMaxSeconds)
    };
}

async function getAudioPayload(file) {
    const optimizationReason = getAudioOptimizationReason(file);
    if (!optimizationReason) {
        const dataUrl = await readFileAsDataUrl(file);
        return {
            audioData: dataUrl.split(',')[1],
            format: getAudioFormatFromFile(file),
            originalSize: file.size,
            optimizedSize: file.size,
            optimized: false
        };
    }

    const optimizedPayload = await optimizeAudioFileForAnalysis(file);
    return {
        ...optimizedPayload,
        optimized: true,
        optimizationReason
    };
}

function copyButton() {
    return `<button type="button" class="ss-copy-btn" title="Sao chép" aria-label="Sao chép">${iconsaxIcon('copy', 'ss-icon ss-copy-icon')}</button>`;
}

function copyableField(title, rawText, contentHtml, options = {}) {
    const {
        tag = 'div',
        className = 'ss-style-tags',
        attributes = ''
    } = options;
    const encodedText = escapeHtml(encodeURIComponent(String(rawText || '')));
    const extraAttributes = attributes ? ` ${attributes}` : '';

    return `
        <div class="ss-card-row ss-copy-field" data-copy-text="${encodedText}">
            <div class="ss-field-heading">
                <strong>${escapeHtml(title)}</strong>
                ${copyButton()}
            </div>
            <${tag} class="${className} ss-copy-content"${extraAttributes}>${contentHtml}</${tag}>
        </div>
    `;
}

async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (error) {
            console.warn('Clipboard API failed, using fallback copy.', error);
        }
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    textArea.style.left = '-1000px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
    } finally {
        textArea.remove();
    }
}

function flashCopyButton(button) {
    if (!button.dataset.defaultHtml) {
        button.dataset.defaultHtml = button.innerHTML;
    }

    clearTimeout(button.copyTimer);
    button.classList.add('is-copied');
    button.innerHTML = iconsaxIcon('tick', 'ss-icon ss-copy-icon');
    button.setAttribute('aria-label', 'Đã sao chép');
    button.setAttribute('title', 'Đã sao chép');

    button.copyTimer = setTimeout(() => {
        button.classList.remove('is-copied');
        button.innerHTML = button.dataset.defaultHtml;
        button.setAttribute('aria-label', 'Sao chép');
        button.setAttribute('title', 'Sao chép');
    }, 1400);
}

async function handleCopyClick(event) {
    const button = event.target.closest('.ss-copy-btn');
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const wrapper = button.closest('.ss-copy-field');
    const fallbackTarget = wrapper?.querySelector('.ss-copy-content');
    const encodedText = wrapper?.dataset.copyText || '';
    const text = encodedText ? decodeURIComponent(encodedText) : (fallbackTarget?.textContent || '').trim();

    if (!text) return;

    await copyTextToClipboard(text);
    flashCopyButton(button);
}

function getSongHistory(callback) {
    chrome.storage.local.get([songHistoryKey], (result) => {
        callback(Array.isArray(result[songHistoryKey]) ? result[songHistoryKey] : []);
    });
}

function saveGeneratedSong(prompt, data) {
    const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        prompt: prompt || '',
        style: data.style_of_music || data.style_tags || '',
        lyrics: data.lyrics || '',
        excludeStyles: data.exclude_styles || '',
        productionNotes: data.production_notes || ''
    };

    getSongHistory((history) => {
        const nextHistory = [entry, ...history].slice(0, songHistoryLimit);
        chrome.storage.local.set({ [songHistoryKey]: nextHistory }, () => {
            renderHistory();
        });
    });
}

function formatHistoryDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function compactHistoryTitle(item, index) {
    const source = item.prompt || item.style || `Bài hát ${index + 1}`;
    return source.length > 74 ? `${source.slice(0, 74)}...` : source;
}

function renderHistoryCard(item, index) {
    const id = escapeHtml(item.id);
    const title = compactHistoryTitle(item, index);
    const detailId = `ss-history-detail-${id}`;

    return `
        <div class="ss-suggestion-card ss-history-card" data-history-id="${id}">
            <button type="button" class="ss-history-head" data-history-toggle="${id}" aria-expanded="false" aria-controls="${detailId}">
                <div class="ss-history-title-wrap">
                    <span class="ss-history-time">${escapeHtml(formatHistoryDate(item.createdAt))}</span>
                    <strong class="ss-history-title">${escapeHtml(title)}</strong>
                    <span class="ss-history-summary">${escapeHtml(item.style || 'Chưa có style')}</span>
                </div>
                <span class="ss-history-chevron">${iconsaxIcon('arrowDown', 'ss-icon ss-history-action-icon')}</span>
            </button>
            <div class="ss-history-details" id="${detailId}" hidden>
                <div class="ss-history-actions">
                    <button type="button" class="ss-btn ss-btn-transfer ss-history-load" data-history-id="${id}">${iconLabel('import', 'Điền lại vào Suno')}</button>
                </div>
                ${item.prompt ? copyableField('Prompt:', item.prompt, escapeHtml(item.prompt), {
                    className: 'ss-style-tags ss-history-prompt'
                }) : ''}
                ${copyableField('Style of Music:', item.style, escapeHtml(item.style))}
                ${copyableField('Lyrics / Structure:', item.lyrics, escapeHtml(item.lyrics), {
                    tag: 'pre',
                    className: 'ss-lyrics-box',
                    attributes: 'style="max-height: 180px;"'
                })}
                ${item.excludeStyles ? copyableField('Exclude Styles:', item.excludeStyles, escapeHtml(item.excludeStyles)) : ''}
                ${item.productionNotes ? copyableField('Production Notes:', item.productionNotes, escapeHtml(item.productionNotes), {
                    tag: 'pre',
                    className: 'ss-lyrics-box',
                    attributes: 'style="max-height: 140px;"'
                }) : ''}
            </div>
        </div>
    `;
}

function toggleHistoryCard(button) {
    const card = button.closest('.ss-history-card');
    const details = card?.querySelector('.ss-history-details');
    const chevron = button.querySelector('.ss-history-chevron');
    if (!card || !details) return;

    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    card.classList.toggle('is-open', !isOpen);
    details.hidden = isOpen;

    if (chevron) {
        chevron.innerHTML = iconsaxIcon(isOpen ? 'arrowDown' : 'arrowUp', 'ss-icon ss-history-action-icon');
    }
}

function renderHistory() {
    const list = document.getElementById('ss-history-list');
    const count = document.getElementById('ss-history-count');
    if (!list) return;

    getSongHistory((history) => {
        if (count) count.textContent = `${history.length}/${songHistoryLimit}`;

        if (!history.length) {
            list.innerHTML = '<div class="ss-history-empty">Chưa có bài hát nào.</div>';
            return;
        }

        list.innerHTML = history.map(renderHistoryCard).join('');
    });
}

// Sidebar Injection
function injectSidebar() {
    if (document.getElementById('suno-studio-sidebar')) return;

    loadIconsaxRuntime();

    const sidebar = document.createElement('div');
    sidebar.id = 'suno-studio-sidebar';
    sidebar.innerHTML = `
        <div id="ss-header">
            ${renderWaveformBackground()}
            <img src="${chrome.runtime.getURL('icons/logo.png')}" alt="RYTHM Logo">
        </div>
        <div id="ss-tabs">
            <button type="button" class="ss-tab active" data-target="tab-gen" title="Tạo Nhanh">${iconLabel('music', 'Tạo Nhạc', 'ss-tab-label')}</button>
            <button type="button" class="ss-tab" data-target="tab-rhyme" title="Từ Điển Vần">${iconLabel('search', 'Tìm Vần', 'ss-tab-label')}</button>
            <button type="button" class="ss-tab" data-target="tab-sug" title="Chủ đề & Tên">${iconLabel('lamp', 'Gợi ý', 'ss-tab-label')}</button>
            <button type="button" class="ss-tab" data-target="tab-analyze" title="Cấu trúc & Trùng lặp">${iconLabel('chart', 'Phân tích', 'ss-tab-label')}</button>
            <button type="button" class="ss-tab" data-target="tab-template" title="Thư viện cấu trúc">${iconLabel('layers', 'Cấu trúc', 'ss-tab-label')}</button>
            <button type="button" class="ss-tab" data-target="tab-history" title="Lịch sử bài hát">${iconLabel('history', 'Lịch sử', 'ss-tab-label')}</button>
        </div>
        
        <!-- Tab: Generate -->
        <div class="ss-tab-content active" id="tab-gen">
            <label>Ý tưởng bài hát (Topic):</label>
            <textarea id="ss-prompt-gen" placeholder="Ví dụ: Một bài nhạc Trap rap cực gắt về sự nỗ lực vươn lên..."></textarea>
            <button id="ss-btn-gen" class="ss-btn">${iconLabel('music', 'Tạo Lyrics & Style')}</button>
            <div class="ss-status" id="ss-status-gen"></div>
            <div class="ss-results" id="ss-results-gen" style="display:none; margin-top: 10px;"></div>
        </div>

        <!-- Tab: Rhyme -->
        <div class="ss-tab-content" id="tab-rhyme">
            <label>Từ/Cụm từ gốc:</label>
            <input type="text" id="ss-input-rhyme" placeholder="VD: lang thang">
            <label style="margin-top: 4px;">Loại vần muốn tìm:</label>
            <select id="ss-select-rhyme">
                <option value="don">Vần đơn (Ví dụ: mang, sang, ngang)</option>
                <option value="doi">Vần đôi (Ví dụ: đàng hoàng, phũ phàng)</option>
                <option value="ba">Vần ba (Ví dụ: không rõ ràng)</option>
                <option value="dao">Vần đảo (Anagram / Chơi chữ)</option>
                <option value="anh">Vần Tiếng Anh (Rhymes in English)</option>
            </select>
            <button id="ss-btn-rhyme" class="ss-btn">${iconLabel('search', 'Tìm Vần')}</button>
            <div class="ss-status" id="ss-status-rhyme"></div>
            <div class="ss-results" id="ss-results-rhyme" style="display:none;"></div>
        </div>

        <!-- Tab: Suggest -->
        <div class="ss-tab-content" id="tab-sug">
            <label>Loại gợi ý AI:</label>
            <select id="ss-select-sug">
                <option value="genre">Tra cứu Thể loại (Nhập tên bài hát nổi tiếng)</option>
                <option value="title">Gợi ý Tên Bài Hát</option>
                <option value="topic">Gợi ý Chủ Đề (Topic mới lạ)</option>
                <option value="next_line">Gợi ý Câu Tiếp Theo (Theo lời hiện tại)</option>
            </select>
            <label style="margin-top: 4px;">Nội dung / Bối cảnh:</label>
            <textarea id="ss-input-sug" placeholder="VD: Để tra Style of Music, hãy nhập 'Khóc - Đông Nhi'. Để xin gợi ý, nhập ý tưởng..." style="height: 60px;"></textarea>
            <button id="ss-btn-sug" class="ss-btn">${iconLabel('lamp', 'Hỏi AI')}</button>
            <div class="ss-status" id="ss-status-sug"></div>
            <div class="ss-results" id="ss-results-sug" style="display:none;"></div>
        </div>

        <!-- Tab: Analyze -->
        <div class="ss-tab-content" id="tab-analyze">
            <div class="ss-sub-tabs">
                <div class="ss-sub-tab active" id="ss-sub-tab-lyrics">Phân tích Lời</div>
                <div class="ss-sub-tab" id="ss-sub-tab-audio">Phân tích Nhạc</div>
            </div>

            <!-- Panel: Phân tích Lời -->
            <div id="ss-panel-lyrics" style="display: flex; flex-direction: column; gap: 12px;">
                <p style="font-size:13px; color:#94a3b8; margin:0; line-height:1.5;">Trợ lý AI sẽ đọc Lời Bài Hát hiện tại để phân tích cấu trúc chuẩn và lỗi lặp từ.</p>
                <button id="ss-btn-analyze" class="ss-btn">${iconLabel('document', 'Bắt Đầu Phân Tích')}</button>
            </div>

            <!-- Panel: Phân tích Nhạc -->
            <div id="ss-panel-audio" style="display: none; flex-direction: column; gap: 12px;">
                <p style="font-size:13px; color:#94a3b8; margin:0; line-height:1.5;">Tải lên file nhạc hoặc dán link YouTube để phân tích mood, vibe và thể loại nhạc.</p>
                
                <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                    <button class="ss-btn" id="ss-mode-file" style="margin: 0; padding: 10px; font-size: 11px; flex: 1;">${iconLabel('folder', 'File âm thanh')}</button>
                    <button class="ss-btn ss-btn-transfer" id="ss-mode-yt" style="margin: 0; padding: 10px; font-size: 11px; flex: 1;">${iconLabel('video', 'YouTube Link')}</button>
                </div>

                <!-- Container: Chế độ File -->
                <div id="ss-container-file" style="display: block;">
                    <div class="ss-upload-container" id="ss-dropzone">
                        <span class="ss-upload-icon">${iconsaxIcon('music')}</span>
                        <span class="ss-upload-text">Kéo thả file hoặc Click để chọn</span>
                        <span class="ss-upload-hint">Hỗ trợ MP3, WAV, M4A, OGG. File trên 20MB sẽ tự tối ưu.</span>
                        <input type="file" id="ss-file-input" accept="audio/*" style="display: none;">
                    </div>
                    <div class="ss-file-info" id="ss-file-info">
                        <span>${iconsaxIcon('document')} File đã chọn:</span>
                        <span id="ss-file-name" style="color: white; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
                    </div>
                </div>

                <!-- Container: Chế độ YouTube -->
                <div id="ss-container-yt" style="display: none;">
                    <label>Link video YouTube:</label>
                    <input type="text" id="ss-input-yt" placeholder="https://www.youtube.com/watch?v=...">
                </div>

                <button id="ss-btn-analyze-audio" class="ss-btn" disabled>${iconLabel('search', 'Phân Tích Nhạc')}</button>
            </div>

            <div class="ss-status" id="ss-status-analyze"></div>
            <div class="ss-results" id="ss-results-analyze" style="display:none;"></div>
        </div>

        <!-- Tab: Template -->
        <div class="ss-tab-content" id="tab-template">
            <p style="font-size:13px; color:#94a3b8; margin:0 0 12px 0; line-height:1.5;">Chọn một cấu trúc mẫu để đưa vào khung Lời bài hát của Suno.</p>
            <div id="ss-template-list"></div>
        </div>

        <!-- Tab: History -->
        <div class="ss-tab-content" id="tab-history">
            <div class="ss-history-toolbar">
                <span id="ss-history-count" class="ss-history-count">0/${songHistoryLimit}</span>
                <div class="ss-history-tools">
                    <button type="button" id="ss-history-refresh" class="ss-icon-btn" title="Làm mới" aria-label="Làm mới lịch sử">${iconsaxIcon('refresh', 'ss-icon ss-history-action-icon')}</button>
                    <button type="button" id="ss-history-clear" class="ss-icon-btn ss-danger-icon-btn" title="Xóa lịch sử" aria-label="Xóa lịch sử">${iconsaxIcon('trash', 'ss-icon ss-history-action-icon')}</button>
                </div>
            </div>
            <div id="ss-history-list"></div>
        </div>
    `;

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'ss-toggle-btn';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Mở G.Rythm Studio');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.innerHTML = `<span id="ss-icon-toggle" aria-hidden="true">${iconsaxIcon('arrowLeft', 'ss-icon ss-toggle-icon-inner')}</span><span class="ss-vert-text">STUDIO</span>`;
    
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);
    sidebar.addEventListener('click', handleCopyClick);
    setupHeaderWaveformInteraction(sidebar);

    // Toggle logic
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        const isOpen = sidebar.classList.contains('open');
        document.getElementById('ss-icon-toggle').innerHTML = iconsaxIcon(isOpen ? 'arrowRight' : 'arrowLeft', 'ss-icon ss-toggle-icon-inner');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
        toggleBtn.setAttribute('aria-label', isOpen ? 'Đóng G.Rythm Studio' : 'Mở G.Rythm Studio');
    });

    // Tab logic
    document.querySelectorAll('.ss-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.ss-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.ss-tab-content').forEach(c => c.classList.remove('active'));
            const currentTab = e.currentTarget;
            currentTab.classList.add('active');
            document.getElementById(currentTab.dataset.target).classList.add('active');
            if (currentTab.dataset.target === 'tab-history') renderHistory();
        });
    });

    setupActions();
}

function enhanceSelectMenus() {
    document.querySelectorAll('#suno-studio-sidebar select').forEach((select) => {
        if (select.dataset.enhanced === 'true') return;

        select.dataset.enhanced = 'true';
        select.classList.add('ss-native-select');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');

        const wrapper = document.createElement('div');
        wrapper.className = 'ss-select';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'ss-select-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');

        const value = document.createElement('span');
        value.className = 'ss-select-value';

        const chevron = document.createElement('span');
        chevron.className = 'ss-select-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.innerHTML = iconsaxIcon('arrowDown', 'ss-icon ss-select-icon');

        const menu = document.createElement('div');
        menu.className = 'ss-select-menu';
        menu.setAttribute('role', 'listbox');

        trigger.append(value, chevron);
        wrapper.append(trigger, menu);
        select.insertAdjacentElement('afterend', wrapper);

        const closeSelect = (selectWrapper) => {
            selectWrapper.classList.remove('open');
            selectWrapper.querySelector('.ss-select-trigger')?.setAttribute('aria-expanded', 'false');
        };

        const close = () => closeSelect(wrapper);

        const open = () => {
            document.querySelectorAll('.ss-select.open').forEach((openSelect) => {
                if (openSelect !== wrapper) closeSelect(openSelect);
            });
            wrapper.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
        };

        const update = () => {
            const selected = select.selectedOptions[0] || select.options[0];
            value.textContent = selected ? selected.textContent : '';
            menu.querySelectorAll('.ss-select-option').forEach((option) => {
                const isSelected = option.dataset.value === select.value;
                option.classList.toggle('is-selected', isSelected);
                option.setAttribute('aria-selected', String(isSelected));
            });
        };

        Array.from(select.options).forEach((nativeOption) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'ss-select-option';
            option.dataset.value = nativeOption.value;
            option.setAttribute('role', 'option');

            const optionLabel = document.createElement('span');
            optionLabel.className = 'ss-select-option-label';
            optionLabel.textContent = nativeOption.textContent;

            const optionCheck = document.createElement('span');
            optionCheck.className = 'ss-select-check';
            optionCheck.setAttribute('aria-hidden', 'true');
            optionCheck.innerHTML = iconsaxIcon('tick', 'ss-icon ss-select-check-icon');

            option.append(optionLabel, optionCheck);
            option.addEventListener('click', () => {
                select.value = nativeOption.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                update();
                close();
                trigger.focus();
            });
            menu.appendChild(option);
        });

        trigger.addEventListener('click', () => {
            if (wrapper.classList.contains('open')) {
                close();
            } else {
                open();
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                close();
            }
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
                menu.querySelector('.is-selected, .ss-select-option')?.focus();
            }
        });

        menu.addEventListener('keydown', (event) => {
            const options = Array.from(menu.querySelectorAll('.ss-select-option'));
            const currentIndex = options.indexOf(document.activeElement);

            if (event.key === 'Escape') {
                close();
                trigger.focus();
            }
            if (event.key === 'ArrowDown' && options.length) {
                event.preventDefault();
                options[(currentIndex + 1 + options.length) % options.length].focus();
            }
            if (event.key === 'ArrowUp' && options.length) {
                event.preventDefault();
                options[(currentIndex - 1 + options.length) % options.length].focus();
            }
        });

        document.addEventListener('click', (event) => {
            if (!wrapper.contains(event.target)) close();
        });

        update();
    });
}

function setupActions() {
    enhanceSelectMenus();
    renderHistory();

    document.getElementById('ss-history-refresh')?.addEventListener('click', renderHistory);

    document.getElementById('ss-history-clear')?.addEventListener('click', () => {
        if (!window.confirm('Xóa toàn bộ lịch sử bài hát đã tạo?')) return;
        chrome.storage.local.set({ [songHistoryKey]: [] }, renderHistory);
    });

    document.getElementById('ss-history-list')?.addEventListener('click', (event) => {
        const toggleButton = event.target.closest('.ss-history-head');
        if (toggleButton) {
            toggleHistoryCard(toggleButton);
            return;
        }

        const button = event.target.closest('.ss-history-load');
        if (!button) return;

        getSongHistory((history) => {
            const item = history.find((entry) => entry.id === button.dataset.historyId);
            if (!item) return;

            fillSunoForm(item.lyrics, item.style);
            const oldHtml = button.innerHTML;
            button.innerHTML = iconsaxIcon('tick', 'ss-icon ss-history-action-icon');
            button.classList.add('is-loaded');
            setTimeout(() => {
                button.innerHTML = oldHtml;
                button.classList.remove('is-loaded');
            }, 1400);
        });
    });

    // 1. Generate Generator
    document.getElementById('ss-btn-gen').addEventListener('click', () => {
        const prompt = document.getElementById('ss-prompt-gen').value.trim();
        if(!prompt) return;
        callBackground('generate', { prompt }, 'gen');
    });

    // 2. Rhyme Finder
    document.getElementById('ss-btn-rhyme').addEventListener('click', () => {
        const word = document.getElementById('ss-input-rhyme').value.trim();
        const type = document.getElementById('ss-select-rhyme').value;
        if(!word) return;
        callBackground('rhyme', { word, type }, 'rhyme');
    });

    // 3. Suggestions
    document.getElementById('ss-btn-sug').addEventListener('click', () => {
        const type = document.getElementById('ss-select-sug').value;
        const context = document.getElementById('ss-input-sug').value.trim();
        
        let lyricsContext = "";
        if (type === 'next_line') {
            const { lyricsEl } = findInputs();
            if (lyricsEl && lyricsEl.value) lyricsContext = lyricsEl.value;
        }
        
        callBackground('suggest', { type, context, lyricsContext }, 'sug');
    });

    // 4. Analyze Lyrics
    document.getElementById('ss-btn-analyze').addEventListener('click', () => {
        const { lyricsEl } = findInputs();
        if (!lyricsEl || !lyricsEl.value.trim()) {
            const status = document.getElementById('ss-status-analyze');
            setStatus(status, 'Trống! Hãy nhập lời bài hát vào khung Suno trước.', 'warning');
            return;
        }
        callBackground('analyze', { lyrics: lyricsEl.value }, 'analyze');
    });

    // --- Xử lý cho Phân tích Nhạc ---
    const subTabLyrics = document.getElementById('ss-sub-tab-lyrics');
    const subTabAudio = document.getElementById('ss-sub-tab-audio');
    const panelLyrics = document.getElementById('ss-panel-lyrics');
    const panelAudio = document.getElementById('ss-panel-audio');
    
    const resultsContainer = document.getElementById('ss-results-analyze');
    const statusContainer = document.getElementById('ss-status-analyze');

    // Chuyển tab phân tích
    subTabLyrics.addEventListener('click', () => {
        subTabLyrics.classList.add('active');
        subTabAudio.classList.remove('active');
        panelLyrics.style.display = 'flex';
        panelAudio.style.display = 'none';
        
        clearStatus(statusContainer);
        resultsContainer.style.display = 'none';
    });

    subTabAudio.addEventListener('click', () => {
        subTabAudio.classList.add('active');
        subTabLyrics.classList.remove('active');
        panelAudio.style.display = 'flex';
        panelLyrics.style.display = 'none';
        
        clearStatus(statusContainer);
        resultsContainer.style.display = 'none';
    });

    // Chuyển chế độ input nhạc: File vs YouTube
    const modeFileBtn = document.getElementById('ss-mode-file');
    const modeYtBtn = document.getElementById('ss-mode-yt');
    const containerFile = document.getElementById('ss-container-file');
    const containerYt = document.getElementById('ss-container-yt');
    const analyzeAudioBtn = document.getElementById('ss-btn-analyze-audio');
    
    let activeAudioMode = 'file'; // 'file' hoặc 'youtube'
    let selectedAudioFile = null;

    const updateAnalyzeAudioButtonState = () => {
        if (activeAudioMode === 'file') {
            analyzeAudioBtn.disabled = !selectedAudioFile;
        } else {
            const val = document.getElementById('ss-input-yt').value.trim();
            analyzeAudioBtn.disabled = !val.includes('youtube.com/') && !val.includes('youtu.be/');
        }
    };

    modeFileBtn.addEventListener('click', () => {
        activeAudioMode = 'file';
        modeFileBtn.classList.remove('ss-btn-transfer'); // làm nó sáng lên
        modeYtBtn.classList.add('ss-btn-transfer'); // làm nó mờ đi
        containerFile.style.display = 'block';
        containerYt.style.display = 'none';
        updateAnalyzeAudioButtonState();
    });

    modeYtBtn.addEventListener('click', () => {
        activeAudioMode = 'youtube';
        modeYtBtn.classList.remove('ss-btn-transfer');
        modeFileBtn.classList.add('ss-btn-transfer');
        containerYt.style.display = 'block';
        containerFile.style.display = 'none';
        updateAnalyzeAudioButtonState();
    });

    // File Upload Handler
    const dropzone = document.getElementById('ss-dropzone');
    const fileInput = document.getElementById('ss-file-input');
    const fileInfo = document.getElementById('ss-file-info');
    const fileName = document.getElementById('ss-file-name');

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleSelectedFile(e.dataTransfer.files[0]);
        }
    });

    function handleSelectedFile(file) {
        if (file.size > maxAudioSourceBytes) {
            setStatus(statusContainer, `Tệp ${formatFileSize(file.size)} quá lớn để xử lý trong trình duyệt. Hãy dùng file dưới ${formatFileSize(maxAudioSourceBytes)} hoặc dùng YouTube Link.`, 'error');
            selectedAudioFile = null;
            fileInfo.classList.remove('active');
            updateAnalyzeAudioButtonState();
            return;
        }

        clearStatus(statusContainer);
        selectedAudioFile = file;
        fileName.textContent = `${file.name} (${formatFileSize(file.size)})`;
        fileInfo.classList.add('active');
        const optimizationReason = getAudioOptimizationReason(file);
        if (optimizationReason === 'size') {
            setStatus(statusContainer, `Tệp lớn sẽ được đọc đặc trưng cục bộ trước khi gửi AI: ${file.name} (${formatFileSize(file.size)})`, 'warning');
        } else if (optimizationReason === 'format') {
            setStatus(statusContainer, `File ${getAudioFormatFromFile(file).toUpperCase()} sẽ được phân tích đặc trưng cục bộ trước khi gửi AI.`, 'warning');
        } else {
            setStatus(statusContainer, `Tệp đã sẵn sàng để đọc đặc trưng: ${file.name} (${formatFileSize(file.size)})`, 'success');
        }
        updateAnalyzeAudioButtonState();
    }

    // YouTube Input Change
    document.getElementById('ss-input-yt').addEventListener('input', updateAnalyzeAudioButtonState);

    // Xử lý Click Phân Tích Nhạc
    analyzeAudioBtn.addEventListener('click', async () => {
        clearStatus(statusContainer);
        resultsContainer.style.display = 'none';

        if (activeAudioMode === 'file') {
            if (!selectedAudioFile) return;
            
            // UI Loading state
            analyzeAudioBtn.disabled = true;
            const oldHtml = analyzeAudioBtn.innerHTML;
            analyzeAudioBtn.dataset.readyHtml = oldHtml;
            analyzeAudioBtn.innerHTML = iconLabel('loading', 'Đang đọc đặc trưng...');
            setStatus(statusContainer, 'Đang phân tích đặc trưng âm thanh trong trình duyệt...', 'loading');

            try {
                const audioProfile = await extractAudioFeatureProfile(selectedAudioFile);
                analyzeAudioBtn.innerHTML = iconLabel('loading', 'Đang phân tích AI...');
                const bpmText = audioProfile.tempo.estimatedBpm ? `${audioProfile.tempo.estimatedBpm} BPM` : 'tempo chưa rõ';
                setStatus(statusContainer, `Đã đọc đặc trưng: ${bpmText}, ${audioProfile.tone.brightness}. Đang gửi AI...`, 'info');

                callBackground(
                    'analyze_audio', 
                    { mode: 'features', fileName: selectedAudioFile.name, audioProfile: audioProfile }, 
                    'analyze',
                    'ss-btn-analyze-audio', 
                    'ss-status-analyze', 
                    'ss-results-analyze'
                );
            } catch (error) {
                setStatus(statusContainer, `Lỗi: ${error.message || 'Không thể đọc file âm thanh.'}`, 'error');
                analyzeAudioBtn.disabled = false;
                analyzeAudioBtn.innerHTML = oldHtml;
                delete analyzeAudioBtn.dataset.readyHtml;
            }
        } else {
            const ytLink = document.getElementById('ss-input-yt').value.trim();
            if (!ytLink) return;

            analyzeAudioBtn.disabled = true;
            const oldHtml = analyzeAudioBtn.innerHTML;
            analyzeAudioBtn.dataset.readyHtml = oldHtml;
            analyzeAudioBtn.innerHTML = iconLabel('loading', 'Lấy thông tin YouTube...');
            
            // Gọi oEmbed API của YouTube để lấy Metadata
            fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(ytLink) + '&format=json')
                .then(res => {
                    if (!res.ok) throw new Error('Không thể fetch oEmbed');
                    return res.json();
                })
                .then(data => {
                    analyzeAudioBtn.innerHTML = iconLabel('loading', 'Đang phân tích AI...');
                    callBackground(
                        'analyze_audio', 
                        { mode: 'youtube', title: data.title, author: data.author_name, url: ytLink }, 
                        'analyze',
                        'ss-btn-analyze-audio', 
                        'ss-status-analyze', 
                        'ss-results-analyze'
                    );
                })
                .catch(err => {
                    console.warn("oEmbed failed, fallback to direct title extraction.", err);
                    analyzeAudioBtn.innerHTML = iconLabel('loading', 'Đang phân tích AI...');
                    
                    // Fallback: Trích xuất tạm thời hoặc gửi trực tiếp đường link để GPT tự nhận diện
                    callBackground(
                        'analyze_audio', 
                        { mode: 'youtube', title: ytLink, author: '', url: ytLink }, 
                        'analyze',
                        'ss-btn-analyze-audio', 
                        'ss-status-analyze', 
                        'ss-results-analyze'
                    );
                });
        }
    });

    renderTemplates();
}

function callBackground(action, payload, tabId, customBtnId = null, customStatusId = null, customResultsId = null) {
    const btn = document.getElementById(customBtnId || `ss-btn-${tabId}`);
    const status = document.getElementById(customStatusId || `ss-status-${tabId}`);
    const results = document.getElementById(customResultsId || `ss-results-${tabId}`);
    
    // UI state
    btn.disabled = true;
    const oldHtml = btn.dataset.readyHtml || btn.innerHTML;
    delete btn.dataset.readyHtml;
    btn.innerHTML = iconLabel('loading', 'Đang xử lý AI...');
    clearStatus(status);
    setWaveformReacting(true);
    
    if(results) {
        results.style.display = 'none';
        results.innerHTML = '';
    }

    chrome.runtime.sendMessage({ action, ...payload }, (response) => {
        btn.disabled = false;
        btn.innerHTML = oldHtml;

        if (chrome.runtime.lastError || !response) {
            setStatus(status, 'Lỗi kết nối tới Background script.', 'error');
            return;
        }

        if (response.success) {
            setStatus(status, 'Thành công!', 'success');
            
            if (action === 'generate') {
                const style = response.data.style_of_music || response.data.style_tags;
                saveGeneratedSong(payload.prompt, response.data);
                fillSunoForm(response.data.lyrics, style);
                if (results) {
                    results.style.display = 'block';
                    results.innerHTML = `
                    <div class="ss-suggestion-card">
                        ${copyableField('Style of Music:', style, escapeHtml(style))}
                        ${copyableField('Lyrics / Structure:', response.data.lyrics, escapeHtml(response.data.lyrics), {
                                tag: 'pre',
                                className: 'ss-lyrics-box',
                                attributes: 'style="white-space: pre-wrap; font-family: inherit;"'
                            })}
                        ${response.data.exclude_styles ? `
                        ${copyableField('Exclude Styles:', response.data.exclude_styles, escapeHtml(response.data.exclude_styles))}` : ''}
                        ${response.data.production_notes ? `
                        ${copyableField('Production Notes:', response.data.production_notes, escapeHtml(response.data.production_notes), {
                                tag: 'pre',
                                className: 'ss-lyrics-box',
                                attributes: 'style="white-space: pre-wrap; font-family: inherit;"'
                            })}` : ''}
                        <div style="font-size:11px;color:#4ade80;margin-top:8px;">*Đã thử tự động điền Style of Music và Lyrics/Structure vào Suno. Nếu Suno không nhận, bạn có thể copy bên trên.</div>
                    </div>
                    `;
                }
            } else if (results) {
                results.style.display = 'block';
                let html = response.data;
                
                let suggestData = [];
                let optionRegex = /\[STYLE\]([\s\S]*?)\[\/STYLE\][\s\S]*?\[LYRICS\]([\s\S]*?)\[\/LYRICS\]/gi;
                
                html = html.replace(optionRegex, (match, style, lyrics) => {
                    let id = suggestData.length;
                    suggestData.push({ style: style.trim(), lyrics: lyrics.trim() });
                    
                    return `
                    <div class="ss-suggestion-card">
                        ${copyableField('Style of Music:', style.trim(), escapeHtml(style.trim()))}
                        ${copyableField('Lyrics / Structure:', lyrics.trim(), escapeHtml(lyrics.trim()), {
                                tag: 'pre',
                                className: 'ss-lyrics-box'
                            })}
                        <button class="ss-btn ss-btn-transfer ss-transfer-btn-${id}" data-id="${id}">${iconLabel('import', 'Chuyển vào Suno')}</button>
                    </div>
                    `;
                });

                // Hỗ trợ thêm trường hợp chỉ trả về [STYLE]...[/STYLE] (phân tích audio)
                let styleOnlyRegex = /\[STYLE\]([\s\S]*?)\[\/STYLE\]/gi;
                if (suggestData.length === 0) {
                    html = html.replace(styleOnlyRegex, (match, style) => {
                        let id = suggestData.length;
                        suggestData.push({ style: style.trim(), lyrics: "" });
                        
                        return `
                        <div class="ss-suggestion-card">
                            ${copyableField('Style of Music:', style.trim(), escapeHtml(style.trim()))}
                            <button class="ss-btn ss-btn-transfer ss-transfer-btn-${id}" data-id="${id}">${iconLabel('import', 'Điền Style vào Suno')}</button>
                        </div>
                        `;
                    });
                }

                html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                html = html.replace(/\n/g, '<br>');
                results.innerHTML = html;

                suggestData.forEach((data, id) => {
                    const btn = results.querySelector(`.ss-transfer-btn-${id}`);
                    if (btn) {
                        btn.addEventListener('click', () => {
                            fillSunoForm(data.lyrics, data.style);
                            const oldButtonHtml = btn.innerHTML;
                            btn.innerHTML = iconLabel('tick', 'Đã chuyển!');
                            btn.style.background = '#4ade80';
                            btn.style.color = '#0f172a';
                            setTimeout(() => {
                                btn.innerHTML = oldButtonHtml;
                                btn.style.background = '';
                                btn.style.color = '';
                            }, 2000);
                        });
                    }
                });
            }
        } else {
            setStatus(status, 'Lỗi AI: ' + response.error, 'error');
        }
    });
}

setInterval(() => {
    if (window.location.href.includes('/create')) {
        injectSidebar();
    }
}, 2000);

const ssTemplates = [
    { name: 'Pop/Ballad (Chuẩn)', tags: 'pop, ballad, standard structure, emotional', structure: '[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]' },
    { name: 'Phonk (Aggressive)', tags: 'phonk, cowbell, heavy 808 sub bass, distorted', structure: '[Intro]\\n(Muffled vocal sample, heavy 808)\\n\\n[Verse]\\n(Distorted 808, aggressive cowbells)\\n\\n[Build Up]\\n\\n[Drop]\\n(High energy, fast cowbell melody)\\n\\n[Verse 2]\\n\\n[Drop]\\n\\n[Outro]' },
    { name: 'Afrohouse', tags: 'afro house, organic percussion, deep bass, hypnotic, 120 bpm', structure: '[Intro] (Atmospheric pads, shaker)\\n\\n[Verse] (Tribal drums enter, deep vocal chant)\\n\\n[Build Up]\\n\\n[Drop] (Driving syncopated kick, deep bassline)\\n\\n[Breakdown] (Emotional chords)\\n\\n[Drop 2] (Full energy, rhythmic synths)\\n\\n[Outro] (Fading drums)' },
    { name: 'Tech House / Techno', tags: 'tech house, driving bass, minimal vocal cuts, 126 bpm', structure: '[Intro] (Punchy 4/4 Kick, hi-hats)\\n\\n[Verse] (Groovy rolling bass introduces)\\n\\n[Build Up] (Snare roll, riser synth)\\n\\n[Drop] (Heavy club bass, minimalistic vocal chop)\\n\\n[Breakdown] (Tension building pads)\\n\\n[Drop 2] (Maximum energy, driving groove)\\n\\n[Outro]' },
    { name: 'Rap / Hip-Hop', tags: 'hip hop, boom bap, rap, storytelling', structure: '[Intro]\n\n[Hook]\n\n[Verse 1]\n(Rap 16 bars)\n\n[Hook]\n\n[Verse 2]\n(Rap 16 bars)\n\n[Hook]\n\n[Outro]' },
    { name: 'EDM / Vinahouse', tags: 'edm, vinahouse, high energy, fast tempo, 140 bpm', structure: '[Intro Beat]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Beat Drop] (High Energy Vinahouse)\n\n[Verse]\n\n[Chorus]\n\n[Beat Drop]\n\n[Outro]' }
];

function renderTemplates() {
    const list = document.getElementById('ss-template-list');
    if (!list) return;
    let html = '';
    ssTemplates.forEach((tpl, i) => {
        html += `
        <div class="ss-suggestion-card">
            ${copyableField(tpl.name, tpl.tags, escapeHtml(tpl.tags), {
                    attributes: 'style="font-size: 11px; padding: 6px;"'
                })}
            ${copyableField('Structure:', tpl.structure.replace(/\\n/g, '\n'), escapeHtml(tpl.structure.replace(/\\n/g, '\n')), {
                    tag: 'pre',
                    className: 'ss-lyrics-box',
                    attributes: 'style="max-height: 100px;"'
                })}
            <button class="ss-btn ss-btn-transfer" id="ss-tpl-btn-${i}">${iconLabel('import', 'Dùng cấu trúc này')}</button>
        </div>`;
    });
    list.innerHTML = html;

    ssTemplates.forEach((tpl, i) => {
        const btn = document.getElementById(`ss-tpl-btn-${i}`);
        if(btn) {
            btn.addEventListener('click', () => {
                fillSunoForm(tpl.structure.replace(/\\n/g, '\n'), tpl.tags);
                const old = btn.innerHTML;
                btn.innerHTML = iconLabel('tick', 'Đã điền vào Suno!');
                btn.style.background = '#4ade80';
                btn.style.color = '#0f172a';
                setTimeout(() => {
                    btn.innerHTML = old;
                    btn.style.background = '';
                    btn.style.color = '';
                }, 2000);
            });
        }
    });
}
