/* spell-checker: ignore tablist tabpanel */
import { focusNext, focusPrev, updateRovingTabindex } from '../../utils/rovingTabindex.js';
import { registry } from '../registry.js';
import type { ElementHandler, TransformContext } from '../types.js';

/**
 * Custom presentation class (QTI 3 has no tab vocabulary; the implementation
 * guide permits custom classes for presentation the shared vocabulary lacks).
 */
const TAB_CONTAINER_CLASS = 'cutie-tab-container';
const TAB_CONTAINER_SELECTOR = `[class~="${TAB_CONTAINER_CLASS}"]`;

let idCounter = 0;

interface TabSection {
  heading: Element;
  content: Node[];
}

function hasClassToken(element: Element, token: string): boolean {
  return (element.getAttribute('class') ?? '').split(/\s+/).includes(token);
}

function isHeading(element: Element): boolean {
  return /^h[1-6]$/.test(element.localName.toLowerCase());
}

/**
 * Split a container's flat content into tabs. Each heading at the level of the
 * container's first heading starts a tab; everything up to the next such
 * heading (including lower-level headings) is that tab's panel.
 *
 * Returns null when the content doesn't prove the shape: no leading heading,
 * or text before it. The container then renders as plain stacked HTML.
 */
function splitSections(element: Element): TabSection[] | null {
  const first = element.firstElementChild;
  if (!first || !isHeading(first)) return null;

  const level = first.localName.toLowerCase();
  const sections: TabSection[] = [];

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).localName.toLowerCase() === level) {
      sections.push({ heading: node as Element, content: [] });
      continue;
    }

    const current = sections[sections.length - 1];
    if (current) {
      current.content.push(node);
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return null;
    }
  }

  return sections;
}

/**
 * Handler for `<div class="cutie-tab-container">`: flat heading-delimited
 * stimulus content (e.g. an NCLEX-style client record) rendered as WAI-ARIA
 * tabs. Systems without this handler show the same markup as stacked headings
 * and paragraphs.
 *
 * Tabs are presentational, so they ignore the item's interaction state and
 * stay usable after submission. The selected tab persists across update().
 */
class TabContainerHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return hasClassToken(element, TAB_CONTAINER_CLASS) && splitSections(element) !== null;
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const sections = splitSections(element) ?? [];

    if (context.styleManager && !context.styleManager.hasStyle('cutie-tab-container')) {
      context.styleManager.addStyle('cutie-tab-container', TAB_CONTAINER_STYLES);
    }

    const container = document.createElement('div');
    for (const attr of Array.from(element.attributes)) {
      container.setAttribute(attr.name, attr.value);
    }

    const tablist = document.createElement('div');
    tablist.className = 'cutie-tablist';
    tablist.setAttribute('role', 'tablist');
    container.appendChild(tablist);

    const tabs = new Map<string, HTMLElement>();
    const panels = new Map<string, HTMLElement>();

    for (const section of sections) {
      const id = `cutie-tab-${++idCounter}`;
      const panelId = `${id}-panel`;

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'cutie-tab';
      tab.id = id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panelId);
      if (context.transformChildren) {
        tab.appendChild(context.transformChildren(section.heading));
      }
      tablist.appendChild(tab);
      tabs.set(id, tab);

      // Transform the panel's nodes through the normal pipeline via a shallow
      // copy of the container that holds only this section's content.
      const panelSource = element.cloneNode(false) as Element;
      for (const node of section.content) {
        panelSource.appendChild(node.cloneNode(true));
      }

      const panel = document.createElement('div');
      panel.className = 'cutie-tabpanel';
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', id);
      panel.setAttribute('tabindex', '0');
      if (context.transformChildren) {
        panel.appendChild(context.transformChildren(panelSource));
      }
      container.appendChild(panel);
      panels.set(id, panel);
    }

    const ids = Array.from(tabs.keys());
    const stateKey = `tab-container:${Array.from(
      element.ownerDocument.querySelectorAll(TAB_CONTAINER_SELECTOR)
    ).indexOf(element)}`;

    const select = (id: string): void => {
      for (const [tabId, tab] of tabs) {
        const selected = tabId === id;
        tab.setAttribute('aria-selected', String(selected));
        panels.get(tabId)!.hidden = !selected;
      }
      updateRovingTabindex(tabs, tabs.get(id)!);
      context.state?.set(stateKey, ids.indexOf(id));
    };

    // Selection follows focus (automatic activation): panels are already in
    // the DOM, so showing one is instant.
    tablist.addEventListener('keydown', (event) => {
      const current = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
      if (!current) return;

      let target: HTMLElement | null = null;
      if (event.key === 'ArrowRight') target = focusNext(tabs, current.id);
      else if (event.key === 'ArrowLeft') target = focusPrev(tabs, current.id);
      else if (event.key === 'Home') target = tabs.get(ids[0]!) ?? null;
      else if (event.key === 'End') target = tabs.get(ids[ids.length - 1]!) ?? null;
      if (!target) return;

      event.preventDefault();
      select(target.id);
      target.focus();
    });

    for (const [id, tab] of tabs) {
      tab.addEventListener('click', () => select(id));
    }

    const saved = context.state?.get(stateKey);
    const initial = typeof saved === 'number' && ids[saved] ? ids[saved] : ids[0];
    if (initial) select(initial);

    fragment.appendChild(container);
    return fragment;
  }
}

// Ahead of the html-passthrough catch-all (priority 1000)
registry.register('tab-container', new TabContainerHandler(), 900);

/**
 * Folder-tab styles: unselected tabs sit on the alt background; the selected
 * tab takes the panel background and covers the panel's top border so the two
 * read as one surface.
 */
const TAB_CONTAINER_STYLES = `
  .cutie-tab-container {
    margin: 1em 0;
  }

  .cutie-tab-container .cutie-tablist {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
    padding: 0 0.5em;
    margin-bottom: -1px;
  }

  .cutie-tab-container .cutie-tab {
    position: relative;
    padding: 0.4em 1em;
    border: 1px solid var(--cutie-border);
    border-radius: 6px 6px 0 0;
    background-color: var(--cutie-bg-alt);
    color: var(--cutie-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .cutie-tab-container .cutie-tab[aria-selected="true"] {
    z-index: 1;
    background-color: var(--cutie-bg);
    border-bottom-color: var(--cutie-bg);
  }

  .cutie-tab-container .cutie-tabpanel {
    padding: 1em;
    border: 1px solid var(--cutie-border);
    background-color: var(--cutie-bg);
  }

  .cutie-tab-container .cutie-tabpanel > :first-child {
    margin-top: 0;
  }

  .cutie-tab-container .cutie-tabpanel > :last-child {
    margin-bottom: 0;
  }

  .cutie-tab-container .cutie-tab:focus-visible,
  .cutie-tab-container .cutie-tabpanel:focus-visible {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 2px;
  }
`;
