import { defineConfig } from 'vitest/config';

// These modules only exist in dist (see script/build-bundled-assets.mjs), so serve empty stand-ins for tests.
const BUNDLED_ASSET_STUBS: Record<string, string> = {
  quillSnowCss: 'export const QUILL_SNOW_CSS = \'\';',
  mathLiveFonts: 'export const MATHLIVE_FONTS = [];',
};
const STUB_PREFIX = '\0bundled-asset-stub:';

export default defineConfig({
  plugins: [
    {
      name: 'bundled-asset-stubs',
      resolveId: (id) => {
        const name = /\/([^/]+)$/.exec(id)?.[1];
        return name && name in BUNDLED_ASSET_STUBS ? STUB_PREFIX + name : null;
      },
      load: (id) => (id.startsWith(STUB_PREFIX) ? BUNDLED_ASSET_STUBS[id.slice(STUB_PREFIX.length)] : null),
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
