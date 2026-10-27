/**
 * MathLive's KaTeX fonts, as base64-encoded woff2 data.
 *
 * The implementation is generated into dist by script/build-bundled-assets.mjs.
 */
export interface MathLiveFont {
  family: string;
  style: 'normal' | 'italic';
  weight: 'normal' | 'bold';
  data: string;
}

export declare const MATHLIVE_FONTS: readonly MathLiveFont[];
