# SUNO Human Skill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the SUNO Human Music skill to the extension's generation and result display flow.

**Architecture:** Add one small normalizer helper shared by the background service worker and Node tests. Update prompts and rendering in place, preserving existing sidebar structure and fallback behavior.

**Tech Stack:** Chrome extension Manifest V3, plain JavaScript, Node `assert` for tests.

---

## File Structure

- Create: `scripts/suno_format.js` for response normalization.
- Create: `tests/suno_format.test.js` for TDD coverage.
- Modify: `manifest.json` to load the helper before the background service worker.
- Modify: `scripts/background.js` to use the SUNO Human Music instruction and normalizer.
- Modify: `scripts/content.js` to render and transfer the richer output.

## Tasks

### Task 1: Normalizer

- [ ] Write failing tests for new and legacy generation contracts in `tests/suno_format.test.js`.
- [ ] Run `node tests/suno_format.test.js` and confirm it fails because `scripts/suno_format.js` is missing.
- [ ] Implement `normalizeGeneratedSong` in `scripts/suno_format.js` with no dependencies.
- [ ] Run `node tests/suno_format.test.js` and confirm it passes.

### Task 2: Background Prompt and Parsing

- [ ] Update `manifest.json` background service worker to load `scripts/suno_format.js` before `scripts/background.js`.
- [ ] Replace the `generate` system instruction with a concise version of `SUNO SKILL.md`.
- [ ] Parse `generate` responses through `normalizeGeneratedSong`.
- [ ] Run `node tests/suno_format.test.js`.

### Task 3: Sidebar Rendering

- [ ] Update generate results in `scripts/content.js` to show Style of Music, Lyrics/Structure, Exclude Styles, and Production Notes.
- [ ] Keep auto-fill using `lyrics` plus `style_of_music`, with `style_tags` fallback.
- [ ] Update suggestion label text from `Style of Music` only where parsed `[STYLE]` content may be richer.
- [ ] Run syntax checks with `node --check scripts/suno_format.js`, `node --check scripts/background.js`, and `node --check scripts/content.js`.

### Task 4: Final Verification

- [ ] Run all available checks.
- [ ] Review `git diff --check`.
- [ ] Summarize changed files and any verification limitations.
