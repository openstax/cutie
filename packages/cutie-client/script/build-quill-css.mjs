/**
 * Wraps Quill's snow theme CSS in a JS module so cutie-client can inject it
 * through its StyleManager instead of loading it from a CDN.
 *
 * Runs after tsc. The module's types come from the hand-written
 * src/transformer/handlers/extendedText/quillSnowCss.d.ts.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = 'transformer/handlers/extendedText/quillSnowCss';

const css = JSON.stringify(readFileSync(require.resolve('quill/dist/quill.snow.css'), 'utf8'));

const outputs = {
  esm: `export const QUILL_SNOW_CSS = ${css};\n`,
  cjs: `"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\nexports.QUILL_SNOW_CSS = ${css};\n`,
};

for (const [format, source] of Object.entries(outputs)) {
  const outBase = join(projectDir, 'dist', format, modulePath);
  writeFileSync(`${outBase}.js`, source);
  copyFileSync(join(projectDir, 'src', `${modulePath}.d.ts`), `${outBase}.d.ts`);
}
