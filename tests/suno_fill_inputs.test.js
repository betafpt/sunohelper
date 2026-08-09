const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'scripts/content.js'), 'utf8');

class FakeElement {
    constructor({ id = '', attrs = {}, text = '', scrollHeight = 100, parent = null, hasValue = true, isContentEditable = false } = {}) {
        this.id = id;
        this.attrs = attrs;
        this.textContent = text;
        this.innerText = text;
        this.scrollHeight = scrollHeight;
        this.parentElement = parent;
        this.isContentEditable = isContentEditable;
        if (hasValue) this.value = '';
        this.events = [];
    }

    getAttribute(name) {
        return this.attrs[name] || null;
    }

    dispatchEvent(event) {
        this.events.push(event.type);
    }

    focus() {
        this.focused = true;
        if (this.ownerDocument) this.ownerDocument.activeElement = this;
    }
}

function loadContentScript(document) {
    const context = {
        document,
        window: { location: { href: 'https://suno.com/create' } },
        chrome: { runtime: { getURL: (value) => value } },
        console,
        Event,
        setInterval: () => null,
        clearTimeout,
        setTimeout
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return context;
}

const lyricsPanel = new FakeElement({ text: 'Lyrics Start writing lyrics...' });
const stylesPanel = new FakeElement({ text: 'Styles acoustic guitar tambourine' });
const lyricsTextarea = new FakeElement({ scrollHeight: 120, parent: lyricsPanel });
const stylesTextarea = new FakeElement({ scrollHeight: 220, parent: stylesPanel });

const document = {
    querySelectorAll(selector) {
        if (selector === 'textarea') return [lyricsTextarea, stylesTextarea];
        if (selector === 'input[type="text"]') return [];
        return [];
    }
};

const context = loadContentScript(document);
context.fillSunoForm('[Verse 1]\nLyrics go here', 'acoustic folk, warm vocal');

assert.strictEqual(lyricsTextarea.value, '[Verse 1]\nLyrics go here');
assert.strictEqual(stylesTextarea.value, 'acoustic folk, warm vocal');
assert.deepStrictEqual(lyricsTextarea.events, ['input', 'change']);
assert.deepStrictEqual(stylesTextarea.events, ['input', 'change']);

const sidebarPanel = new FakeElement({ id: 'suno-studio-sidebar', text: 'Style of Music Lyrics / Structure' });
const sidebarTextarea = new FakeElement({ parent: sidebarPanel });
const sunoLyricsPanel = new FakeElement({ text: 'Lyrics Start writing lyrics...' });
const sunoStylesPanel = new FakeElement({ text: 'Styles acoustic guitar tambourine' });
const sunoLyricsEditor = new FakeElement({ attrs: { role: 'textbox' }, parent: sunoLyricsPanel, hasValue: false });
const sunoStylesEditor = new FakeElement({ attrs: { role: 'textbox' }, parent: sunoStylesPanel, hasValue: false });

const documentWithSidebar = {
    querySelectorAll(selector) {
        if (selector === 'textarea') return [sidebarTextarea];
        if (selector === 'input[type="text"]') return [];
        if (selector === '[contenteditable="true"]') return [];
        if (selector === '[role="textbox"]') return [sunoLyricsEditor, sunoStylesEditor];
        return [];
    }
};

const contextWithSidebar = loadContentScript(documentWithSidebar);
contextWithSidebar.fillSunoForm('[Chorus]\nReal lyrics', 'dream pop, warm synth');

assert.strictEqual(sidebarTextarea.value, '');
assert.strictEqual(sunoLyricsEditor.textContent, '[Chorus]\nReal lyrics');
assert.strictEqual(sunoStylesEditor.textContent, 'dream pop, warm synth');

const lyricsEditablePanel = new FakeElement({ text: 'Lyrics Start writing lyrics...' });
const stylesEditablePanel = new FakeElement({ text: 'Styles acoustic guitar tambourine' });
const lyricsEditable = new FakeElement({
    attrs: { contenteditable: 'plaintext-only' },
    parent: lyricsEditablePanel,
    hasValue: false,
    isContentEditable: true
});
const stylesEditable = new FakeElement({
    attrs: { contenteditable: 'plaintext-only' },
    parent: stylesEditablePanel,
    hasValue: false,
    isContentEditable: true
});

const documentWithPlaintextEditors = {
    querySelectorAll(selector) {
        if (selector === 'textarea') return [];
        if (selector === 'input[type="text"]') return [];
        if (selector === '[contenteditable="true"]') return [];
        if (selector === '[contenteditable]') return [lyricsEditable, stylesEditable];
        if (selector === '[role="textbox"]') return [];
        return [];
    }
};

const contextWithPlaintextEditors = loadContentScript(documentWithPlaintextEditors);
contextWithPlaintextEditors.fillSunoForm('[Bridge]\nPlain editor lyrics', 'ambient pop, 90 bpm');

assert.strictEqual(lyricsEditable.textContent, '[Bridge]\nPlain editor lyrics');
assert.strictEqual(stylesEditable.textContent, 'ambient pop, 90 bpm');

const execLyricsPanel = new FakeElement({ text: 'Lyrics Start writing lyrics...' });
const execStylesPanel = new FakeElement({ text: 'Styles acoustic guitar tambourine' });
const execLyricsEditor = new FakeElement({
    attrs: { contenteditable: 'true' },
    parent: execLyricsPanel,
    hasValue: false,
    isContentEditable: true
});
const execStylesEditor = new FakeElement({
    attrs: { contenteditable: 'true' },
    parent: execStylesPanel,
    hasValue: false,
    isContentEditable: true
});
const execCommands = [];
const documentWithExecCommand = {
    activeElement: null,
    querySelectorAll(selector) {
        if (selector === 'textarea') return [];
        if (selector === 'input[type="text"]') return [];
        if (selector === '[contenteditable="true"]') return [execLyricsEditor, execStylesEditor];
        if (selector === '[contenteditable]') return [execLyricsEditor, execStylesEditor];
        if (selector === '[role="textbox"]') return [];
        return [];
    },
    execCommand(command, _showUi, value) {
        execCommands.push({ command, value });
        if (command === 'insertText' && this.activeElement) {
            this.activeElement.textContent = value;
            return true;
        }
        return command === 'selectAll';
    }
};
execLyricsEditor.ownerDocument = documentWithExecCommand;
execStylesEditor.ownerDocument = documentWithExecCommand;

const contextWithExecCommand = loadContentScript(documentWithExecCommand);
contextWithExecCommand.fillSunoForm('[Outro]\nInserted lyrics', 'cinematic pop, wide drums');

assert.strictEqual(execLyricsEditor.focused, true);
assert.strictEqual(execStylesEditor.focused, true);
assert.deepStrictEqual(execCommands, [
    { command: 'selectAll', value: null },
    { command: 'insertText', value: '[Outro]\nInserted lyrics' },
    { command: 'selectAll', value: null },
    { command: 'insertText', value: 'cinematic pop, wide drums' }
]);
assert.strictEqual(execLyricsEditor.textContent, '[Outro]\nInserted lyrics');
assert.strictEqual(execStylesEditor.textContent, 'cinematic pop, wide drums');

const lyricsTextareaForUntypedInput = new FakeElement({
    attrs: { placeholder: 'Start writing lyrics...' }
});
const styleUntypedInputPanel = new FakeElement({ text: 'Styles' });
const styleUntypedInput = new FakeElement({
    attrs: { placeholder: 'Add a style tag' },
    parent: styleUntypedInputPanel
});

const documentWithUntypedStyleInput = {
    querySelectorAll(selector) {
        if (selector === 'textarea') return [lyricsTextareaForUntypedInput];
        if (selector === 'input[type="text"]') return [];
        if (selector === '[contenteditable="true"]') return [];
        if (selector === '[contenteditable]') return [];
        if (selector === '[role="textbox"]') return [];
        if (selector === 'input:not([type])') return [styleUntypedInput];
        return [];
    }
};

const contextWithUntypedStyleInput = loadContentScript(documentWithUntypedStyleInput);
contextWithUntypedStyleInput.fillSunoForm('[Verse]\nTyped lyrics', 'lofi pop, soft drums');

assert.strictEqual(lyricsTextareaForUntypedInput.value, '[Verse]\nTyped lyrics');
assert.strictEqual(styleUntypedInput.value, 'lofi pop, soft drums');

console.log('suno fill input tests passed');
