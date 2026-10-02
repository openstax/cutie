/* spell-checker: ignore inlines */
import { DOMParser } from '@xmldom/xmldom';
import { StimulusReference, StimulusResolver } from '../types';
import { BaseOf, removeReservedMarkup } from './content';

/**
 * Shared stimuli (`qti-assessment-stimulus`): content kept outside the items
 * that reference it with `qti-assessment-stimulus-ref`. A stimulus declares no
 * variables and has no processing, so it renders the same for every learner.
 *
 * An item can dock a stimulus in its body, with an element whose
 * `data-stimulus-idref` names the reference; otherwise the delivery system
 * decides where it goes (QTI 3 implementation guide, "Shared Stimulus").
 */

/**
 * Parses a stimulus definition, checking it is a qti-assessment-stimulus with
 * a qti-stimulus-body.
 */
export function parseStimulus(stimulusXml: string): Document {
  const doc = new DOMParser().parseFromString(stimulusXml.trim(), 'text/xml');
  const root = doc.documentElement;

  if (!root || root.tagName !== 'qti-assessment-stimulus') {
    throw new Error('Invalid stimulus: the root element must be qti-assessment-stimulus');
  }
  if (!getStimulusBody(root)) {
    throw new Error('Invalid stimulus: missing qti-stimulus-body element');
  }

  return doc;
}

/**
 * Builds the sanitized stimulus document for the client: a copy of the stimulus
 * without any authored copy of the markup only core may add.
 */
export function buildStimulusDocument(stimulusDoc: Document): Document {
  const clonedDoc = stimulusDoc.cloneNode(true) as Document;
  removeReservedMarkup(clonedDoc.documentElement);
  return clonedDoc;
}

/**
 * The stimulus references of an item, in document order.
 */
export function collectStimulusReferences(root: Element): StimulusReference[] {
  return Array.from(root.getElementsByTagName('qti-assessment-stimulus-ref')).flatMap((element) => {
    const identifier = element.getAttribute('identifier');
    const href = element.getAttribute('href');
    if (!identifier || !href) return [];

    const title = element.getAttribute('title');
    return [title ? { identifier, href, title } : { identifier, href }];
  });
}

/**
 * The elements of an item body that dock a stimulus, in document order.
 */
export function findStimulusDocks(root: Element): Element[] {
  const itemBody = root.getElementsByTagName('qti-item-body')[0];
  if (!itemBody) return [];

  return Array.from(itemBody.getElementsByTagName('*')).filter((element) =>
    element.hasAttribute('data-stimulus-idref')
  );
}

/**
 * Inlines the stimuli an item's template docks: resolves them in one batch, and
 * replaces the content of each dock with the body of its sanitized stimulus,
 * asset URLs as authored. The stimulus's stylesheets and catalog are not
 * carried over. Mutates the document.
 *
 * Without the stimuli it docks the item cannot be shown as authored, so this
 * throws when a dock names a stimulus the item does not reference, when no
 * resolver is provided, or when the resolver does not return a stimulus.
 *
 * @returns Which stimulus inlined content came from: the `href` of its stimulus,
 *   for resolving its asset URLs (see finishContent)
 */
export async function inlineDockedStimuli(
  root: Element,
  resolver: StimulusResolver | undefined
): Promise<BaseOf> {
  const docks = findStimulusDocks(root);
  if (docks.length === 0) return () => undefined;

  const references = new Map(collectStimulusReferences(root).map((ref) => [ref.identifier, ref]));
  const docked = new Map<string, StimulusReference>();
  for (const dock of docks) {
    const identifier = dock.getAttribute('data-stimulus-idref') ?? '';
    const ref = references.get(identifier);
    if (!ref) {
      throw new Error(`The item body docks stimulus "${identifier}", which the item does not reference`);
    }
    docked.set(identifier, ref);
  }

  const refs = Array.from(docked.values());
  if (!resolver) {
    throw new Error(
      `The item docks stimulus "${refs[0]?.identifier}"; rendering it requires a resolveStimuli processing option`
    );
  }

  const stimulusXml = await resolver(refs);
  const bodies = new Map<string, Element>();
  refs.forEach((ref, index) => {
    const xml = stimulusXml[index];
    if (!xml) {
      throw new Error(`The stimulus resolver returned nothing for stimulus "${ref.identifier}"`);
    }
    bodies.set(
      ref.identifier,
      getStimulusBody(buildStimulusDocument(parseStimulus(xml)).documentElement) as Element
    );
  });

  const dockSources = new Map<Element, string>();
  for (const dock of docks) {
    const identifier = dock.getAttribute('data-stimulus-idref') ?? '';
    const body = bodies.get(identifier) as Element;
    while (dock.firstChild) {
      dock.removeChild(dock.firstChild);
    }
    for (const child of Array.from(body.childNodes)) {
      dock.appendChild(root.ownerDocument.importNode(child, true));
    }
    dockSources.set(dock, (docked.get(identifier) as StimulusReference).href);
  }

  // Content inside a filled dock came from its stimulus
  return (element) => {
    for (let node = element.parentNode; node; node = node.parentNode) {
      const href = dockSources.get(node as Element);
      if (href !== undefined) return href;
    }
    return undefined;
  };
}

function getStimulusBody(root: Element): Element | undefined {
  return root.getElementsByTagName('qti-stimulus-body')[0];
}
