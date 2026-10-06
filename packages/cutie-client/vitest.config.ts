import { defineConfig } from 'vitest/config';

// quillSnowCss.js only exists in dist (see script/build-quill-css.mjs), so serve an empty stand-in for tests.
const QUILL_SNOW_CSS_STUB = '\0quill-snow-css-stub';

export default defineConfig({
  plugins: [
    {
      name: 'quill-snow-css-stub',
      resolveId: (id) => (/\/quillSnowCss$/.test(id) ? QUILL_SNOW_CSS_STUB : null),
      load: (id) => (id === QUILL_SNOW_CSS_STUB ? 'export const QUILL_SNOW_CSS = \'\';' : null),
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
