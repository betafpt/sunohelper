# iconsax

Web component `<iconsax-icon>` — works in React, Vue, Svelte, or plain HTML because it's a native Custom Element, not a component tied to one framework.

## Install

```bash
npm install iconsax
```

```js
import "iconsax" // registers <iconsax-icon> as a custom element
```

## Usage — free icons (1200+, no key, no network)

```html
<iconsax-icon name="home" type="linear" size="24" color="#6366f1"></iconsax-icon>
```

- `type`: `bold` · `broken` · `bulk` · `linear` · `outline` · `twotone` (default `linear`)
- `size`: px (default `24`)
- `color`: any CSS color (default `currentColor`)

## Usage — Pro icons

1. Write the icon in your code with the `pro` attribute:

```html
<iconsax-icon pro name="rocket" type="bold" size="24"></iconsax-icon>
```

2. Run the CLI with your API key (Settings → API Key on iconsax.io) to resolve it:

```bash
npx iconsax sync --key ix_pro_xxxxx
```

This scans your code, asks the API for any new Pro icons you use, and saves them to `iconsax-pro.icons.json` at your project root — commit that file like any other asset.

3. Register them once in your app's entry point:

```js
import proIcons from "./iconsax-pro.icons.json"
import { registerProIcons } from "iconsax"

registerProIcons(proIcons)
```

An icon that's already been resolved keeps working in production forever, with no network dependency and regardless of whether your subscription stays active — the license check only happens at `sync` time, never at runtime.

## Development (iconsax.io monorepo)

```bash
npm run build:icons:free   # from repo root — generates server/assets/icons-free.json
npm --prefix packages/iconsax run build   # generates dist/manifest.json + dist/data/*.json
```
