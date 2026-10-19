/**
 * Wraps third-party assets in JS modules so cutie-client ships them in its own
 * bundle instead of loading them from a CDN or a path relative to the library:
 *
 * - quillSnowCss: Quill's snow theme CSS, injected through the StyleManager
 * - mathLiveFonts: MathLive's KaTeX fonts, registered through the FontFace API
 *
 * Runs after tsc. Each module's types come from a hand-written .d.ts next to
 * where the module would be in src.
 */
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectDir = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Write an ESM and a CJS module exporting `value` as `name` into dist, alongside
 * the module's hand-written .d.ts.
 */
function writeModule(modulePath, name, value) {
  const json = JSON.stringify(value);
  const outputs = {
    esm: `export const ${name} = ${json};\n`,
    cjs: `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.${name} = ${json};\n`,
  };

  for (const [format, source] of Object.entries(outputs)) {
    const outBase = join(projectDir, 'dist', format, modulePath);
    writeFileSync(`${outBase}.js`, source);
    copyFileSync(join(projectDir, 'src', `${modulePath}.d.ts`), `${outBase}.d.ts`);
  }
}

writeModule(
  'transformer/handlers/extendedText/quillSnowCss',
  'QUILL_SNOW_CSS',
  readFileSync(require.resolve('quill/dist/quill.snow.css'), 'utf8'),
);

// Font files are named <family>-<variant>.woff2, e.g. KaTeX_Main-BoldItalic.woff2
const fontsDir = join(dirname(require.resolve('mathlive/fonts.css')), 'fonts');
writeModule(
  'transformer/handlers/extendedText/mathLiveFonts',
  'MATHLIVE_FONTS',
  readdirSync(fontsDir).filter((file) => file.endsWith('.woff2')).sort().map((file) => {
    const [family, variant] = file.replace(/\.woff2$/, '').split('-');
    return {
      family,
      style: variant.includes('Italic') ? 'italic' : 'normal',
      weight: variant.includes('Bold') ? 'bold' : 'normal',
      data: readFileSync(join(fontsDir, file)).toString('base64'),
    };
  }),
);
