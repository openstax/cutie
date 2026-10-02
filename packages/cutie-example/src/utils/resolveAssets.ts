import type { ProcessingOptions } from '@openstax/cutie-core';

/**
 * Asset resolver for the example app.
 * In development, Vite serves files from public/ at the root.
 * This resolver prepends the app's base path to relative paths to resolve them correctly.
 */
export const resolveAssets: ProcessingOptions['resolveAssets'] = async (assets) => {
  return assets.map(({ url }) => {
    // If already an absolute URL, data URL, or starts with /, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) {
      return url;
    }
    // Resolve from public/, under the app's base path (e.g. /cutie/)
    return `${import.meta.env.BASE_URL}${url}`;
  });
};
