import { XMLSerializer } from '@xmldom/xmldom';
import { AssetRequest, AssetResolver, ProcessingOptions } from '../types.js';
import { collectAssetReferences } from './collectAssetReferences.js';

/**
 * Steps shared by every document cutie-core prepares for the client
 * (item templates and stimuli), whatever its type.
 */

/**
 * The verdict on the item as a whole: "correct", "incorrect" or "partial", on
 * the item body.
 */
export const VERDICT_ATTRIBUTE = 'data-cutie-evaluation';

/**
 * The message shown with the verdict on a fresh try, on the item body.
 */
export const RETRY_MESSAGE_ATTRIBUTE = 'data-cutie-retry-message';

/**
 * Marks a preview (see renderPreview), on the item body.
 */
export const PREVIEW_ATTRIBUTE = 'data-cutie-preview';

/**
 * The attributes cutie-core adds for the client.
 */
const RESERVED_ATTRIBUTES = [VERDICT_ATTRIBUTE, RETRY_MESSAGE_ATTRIBUTE, PREVIEW_ATTRIBUTE];

/**
 * Removes any authored copy of the attributes cutie-core adds for the client,
 * from the root and everything in it, so the client only ever sees what core
 * computed.
 */
export function removeReservedMarkup(root: Element): void {
  for (const element of [root, ...Array.from(root.getElementsByTagName('*'))]) {
    for (const attribute of RESERVED_ATTRIBUTES) element.removeAttribute(attribute);
  }
}

/**
 * The href of the document an element's content came from, when it is not the
 * rendered document itself (see AssetRequest.base).
 */
export type BaseOf = (element: Element) => string | undefined;

/**
 * Finishes a sanitized document for the client: resolves asset URLs if a
 * resolver is provided, then serializes it to an XML string. Mutates the document.
 *
 * @param baseOf - Where content inlined from other documents came from;
 *   without it, every asset is the rendered document's own
 */
export async function finishContent(
  doc: Document,
  options?: ProcessingOptions,
  baseOf?: BaseOf
): Promise<string> {
  if (options?.resolveAssets) {
    await resolveAssetUrls(doc.documentElement, options.resolveAssets, baseOf);
  }

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Resolves asset URLs in the document using the provided resolver.
 *
 * Collects the unique asset requests (URL and document) from `src` and
 * `data` attributes, calls the resolver with the batch, and replaces the
 * attribute values with the resolved URLs.
 */
async function resolveAssetUrls(
  root: Element,
  resolver: AssetResolver,
  baseOf?: BaseOf
): Promise<void> {
  const references = collectAssetReferences(root).map((reference) => {
    const base = baseOf?.(reference.element);
    const request: AssetRequest = base === undefined ? { url: reference.url } : { url: reference.url, base };
    return { ...reference, request, key: JSON.stringify([base ?? null, reference.url]) };
  });

  // The same URL in different documents is a different asset
  const requests = new Map<string, AssetRequest>();
  for (const { key, request } of references) {
    if (!requests.has(key)) requests.set(key, request);
  }

  // If no assets found, nothing to resolve
  if (requests.size === 0) {
    return;
  }

  // Call resolver with all unique requests
  const keys = Array.from(requests.keys());
  const resolvedUrls = await resolver(Array.from(requests.values()));

  // Create mapping from request to resolved URL
  const urlMap = new Map<string, string>();
  keys.forEach((key, i) => {
    const resolvedUrl = resolvedUrls[i];
    if (resolvedUrl !== undefined) urlMap.set(key, resolvedUrl);
  });

  // Replace attribute values with resolved URLs
  for (const { element, attr, key } of references) {
    const resolvedUrl = urlMap.get(key);
    if (resolvedUrl !== undefined) {
      element.setAttribute(attr, resolvedUrl);
    }
  }
}
