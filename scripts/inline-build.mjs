/**
 * Folds the Vite build into one self-contained HTML file.
 *
 * The game makes no external requests — no CDN, no web fonts, no `fetch` — so
 * the whole thing collapses into a single page you can open from a file, email
 * to someone, or publish anywhere that serves static HTML.
 *
 * Output: `dist/standalone.html`, a complete document you can open from disk.
 *
 * This deliberately does *not* emit a wrapper-less variant for embedding hosts.
 * It used to, and that was a trap: Claude Artifacts silently truncates page
 * content at roughly 36 KB total (including its own ~11 KB runtime), far below
 * the limit its docs advertise. At ~295 KB this build gets cut mid-script, and a
 * truncated script is a syntax error — so the symptom is a blank page with
 * nothing in the console. The hand-written page at `docs/artifact-page.html` is
 * what gets published there instead.
 *
 * The lesson generalises: check the *published* byte count against the source.
 * Rendering the file locally proves nothing about what the host kept.
 *
 * Run via `npm run build:standalone`.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const ASSETS = join(DIST, 'assets')

function findAsset(extension) {
  const matches = readdirSync(ASSETS).filter((f) => f.endsWith(extension))
  if (matches.length === 0) {
    throw new Error(`No ${extension} file in ${ASSETS} — run \`vite build\` first.`)
  }
  // Vite emits exactly one of each for this app. More than one means the bundle
  // has been split, and silently inlining whichever came first would ship a
  // half-broken page — so stop instead.
  if (matches.length > 1) {
    throw new Error(
      `Expected one ${extension} bundle, found ${matches.length}: ${matches.join(', ')}. ` +
        'The single-file build needs a single chunk.',
    )
  }
  return readFileSync(join(ASSETS, matches[0]), 'utf8')
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const css = findAsset('.css')
const js = findAsset('.js')

/**
 * `</script>` inside the bundle's own string literals would close the inline
 * script tag early and break the page. Splitting the sequence is the standard
 * escape and is invisible to the JS parser.
 */
const safeJs = js.replaceAll('</script', '<\\/script')

const inlined = html
  .replace(/\s*<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/, '')
  .replace(/\s*<link rel="stylesheet"[^>]*>/, `\n    <style>\n${css}\n    </style>`)
  .replace('</body>', `  <script type="module">\n${safeJs}\n    </script>\n  </body>`)

writeFileSync(join(DIST, 'standalone.html'), inlined)

const kb = (s) => `${Math.round(s.length / 1024)} KB`
console.log(`dist/standalone.html  ${kb(inlined)}  (${kb(css)} CSS + ${kb(safeJs)} JS, inlined)`)
