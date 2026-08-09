/**
 * iconsax — web component `<iconsax-icon>`, works in any framework
 * (React, Vue, Svelte, plain HTML) because it's a native Custom Element.
 *
 * Free: resolves itself, fetches one chunk per category (dist/data/*.json)
 * the first time an icon from that category is used, then it's cached in
 * memory. Never hits any Iconsax server.
 *
 * Pro: nothing ships inside the package. It's resolved in your local project
 * by running `npx iconsax sync` (see bin/iconsax.js), which writes a JSON
 * with the icons you're authorized to use. That JSON is registered once with
 * `registerProIcons(json)` at app startup. A Pro icon that's already been
 * resolved keeps working in production even if the subscription is later
 * canceled — the gate only applies at `sync` time, never on each render.
 */

// ── Free manifest (name -> { category, styles }), loaded once
let manifestPromise = null
let nameIndexPromise = null

function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(new URL("./manifest.json", import.meta.url)).then((r) => {
      if (!r.ok) throw new Error(`manifest.json ${r.status}`)
      return r.json()
    })
  }
  return manifestPromise
}

function getNameIndex() {
  if (!nameIndexPromise) {
    nameIndexPromise = loadManifest().then((manifest) => {
      const index = new Map()
      for (const [name, meta] of Object.entries(manifest)) {
        index.set(name.toLowerCase(), { name, ...meta })
      }
      return index
    })
  }
  return nameIndexPromise
}

// ── Per-category chunks, cached in memory once loaded
const categoryPromises = new Map()

function loadCategory(category) {
  if (!categoryPromises.has(category)) {
    categoryPromises.set(
      category,
      fetch(new URL(`./data/${category}.json`, import.meta.url)).then((r) => {
        if (!r.ok) throw new Error(`data/${category}.json ${r.status}`)
        return r.json()
      })
    )
  }
  return categoryPromises.get(category)
}

async function resolveFreeIcon(name, style) {
  const index = await getNameIndex()
  const entry = index.get(name.toLowerCase())
  if (!entry) return null

  const finalStyle = entry.styles.includes(style) ? style : entry.styles[0]
  const data = await loadCategory(entry.category)
  return data[entry.name]?.[finalStyle] || null
}

// ── Pro icon registry (populated by the consumer via registerProIcons)
const proIcons = new Map()

// Mounted <iconsax-icon pro> instances that haven't resolved their icon yet.
// If registerProIcons() is called after the element is already in the DOM
// (static HTML, SSR, or any load order other than "register first, render
// after"), these instances re-render themselves automatically.
const pendingProInstances = new Set()

/**
 * Registers Pro icons already resolved locally (output of `npx iconsax sync`).
 * Expected shape: { [name]: { [style]: svgString } }
 */
export function registerProIcons(data) {
  for (const [name, styleMap] of Object.entries(data || {})) {
    for (const [style, svg] of Object.entries(styleMap)) {
      proIcons.set(`${name.toLowerCase()}:${style}`, svg)
    }
  }
  for (const instance of pendingProInstances) instance._scheduleRender()
}

function resolveProIcon(name, style) {
  const key = name.toLowerCase()
  const exact = proIcons.get(`${key}:${style}`)
  if (exact) return exact
  // If the requested style isn't there, return whatever variant was registered
  for (const [k, svg] of proIcons) {
    if (k.startsWith(`${key}:`)) return svg
  }
  return null
}

// ── Applies size/color to the root SVG without touching anything nested (clipPaths, etc)
function applySvgProps(svg, size, color) {
  const withSize = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
    let next = attrs
      .replace(/\swidth="[^"]*"/, "")
      .replace(/\sheight="[^"]*"/, "")
      .replace(/\sstyle="[^"]*"/, "")
    return `<svg${next} width="${size}" height="${size}" style="color:${color}">`
  })
  // Source SVGs use literal colors (white/black/hex) instead of currentColor
  return withSize.replace(/(fill|stroke)="(?!none)[^"]*"/g, '$1="currentColor"')
}

const MISSING_ICON_MSG =
  '[iconsax] Icon "%s" (%s) not found. Check the name, or run "npx iconsax sync" if it\'s a Pro icon.'

class IconsaxIcon extends HTMLElement {
  static get observedAttributes() {
    return ["name", "type", "size", "color", "pro"]
  }

  connectedCallback() {
    this._scheduleRender()
  }

  disconnectedCallback() {
    pendingProInstances.delete(this)
  }

  attributeChangedCallback() {
    if (this.isConnected) this._scheduleRender()
  }

  // The parser sets several attributes in a row when mounting the element —
  // each one fires attributeChangedCallback separately. Without this we'd
  // render (and, for free icons, fetch) once per attribute instead of once.
  _scheduleRender() {
    if (this._renderScheduled) return
    this._renderScheduled = true
    queueMicrotask(() => {
      this._renderScheduled = false
      this._render()
    })
  }

  async _render() {
    const token = (this._token = Symbol())
    const name = this.getAttribute("name")
    if (!name) {
      this.innerHTML = ""
      return
    }

    const type = this.getAttribute("type") || "linear"
    const size = this.getAttribute("size") || "24"
    const color = this.getAttribute("color") || "currentColor"
    const isPro = this.hasAttribute("pro")

    let svg = null

    if (isPro) {
      svg = resolveProIcon(name, type)
      if (svg) {
        pendingProInstances.delete(this)
      } else {
        pendingProInstances.add(this)
        console.warn(
          `[iconsax] Pro icon "${name}" (${type}) not resolved yet. It will re-render automatically once you call registerProIcons(). If you already did, run "npx iconsax sync" with your API key.`
        )
      }
    } else {
      try {
        svg = await resolveFreeIcon(name, type)
      } catch (err) {
        console.warn(`[iconsax] Error loading "${name}":`, err.message)
      }
      if (this._token !== token) return // attributes changed while the fetch was in flight
      if (!svg) console.warn(MISSING_ICON_MSG.replace("%s", name).replace("%s", type))
    }

    this.innerHTML = svg ? applySvgProps(svg, size, color) : ""
  }
}

if (typeof customElements !== "undefined" && !customElements.get("iconsax-icon")) {
  customElements.define("iconsax-icon", IconsaxIcon)
}

export { IconsaxIcon }
