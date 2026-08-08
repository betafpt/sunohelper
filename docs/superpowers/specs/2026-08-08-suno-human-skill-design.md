# SUNO Human Skill Extension Design

## Goal

Apply `SUNO SKILL.md` to the Chrome extension so generated Suno prompts follow the new human-music structure without adding unnecessary architecture or dependencies.

## Scope

- Update the `generate` AI instruction to return `style_of_music`, `lyrics`, `exclude_styles`, and `production_notes`.
- Keep backward compatibility with the old `style_tags` field.
- Update sidebar result rendering so users can see all four sections.
- Continue auto-filling Suno with lyrics/structure and style of music.
- Update genre/audio suggestion parsing to accept richer style prompts while preserving existing transfer buttons.

## Non-Goals

- Do not embed the full `SUNO SKILL.md` into every API call.
- Do not change the API provider, model-selection logic, storage format, or manifest permissions.
- Do not redesign the whole sidebar.

## Architecture

Add a small shared helper for normalizing AI generation responses. `scripts/background.js` will import it in the service worker and use it after JSON parsing. Tests will run the same helper in Node. `scripts/content.js` will render optional output sections when present and keep old behavior as a fallback.

## Output Contract

For `generate`, the preferred JSON contract is:

```json
{
  "style_of_music": "string under 1000 characters",
  "lyrics": "string",
  "exclude_styles": "string",
  "production_notes": "string"
}
```

Legacy fallback:

```json
{
  "style_tags": "string",
  "lyrics": "string"
}
```

## Testing

Add a Node `assert` test for the normalizer covering the new contract and legacy fallback. Run it before implementation to verify failure, then after implementation to verify pass.
