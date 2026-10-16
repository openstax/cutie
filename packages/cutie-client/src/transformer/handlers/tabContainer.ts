/* spell-checker: ignore tablist tabpanel */
import { focusNext, focusPrev, updateRovingTabindex } from '../../utils/rovingTabindex.js';
import { registry } from '../registry.js';
import type { ElementHandler, TransformContext } from '../types.js';

const TAB_CONTAINER_CLASS = 'cutie-tab-container';
const TAB_CONTAINER_SELECTOR = `[class~="${TAB_CONTAINER_CLASS}"]`;
const TABLIST_LABEL_ATTRIBUTES = ['aria-label', 'aria-labelledby'];
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

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
 * heading is that tab's panel.
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
 * Handler for `<div class="cutie-tab-container">`
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
    const tablist = document.createElement('div');
    tablist.className = 'cutie-tablist';
    tablist.setAttribute('role', 'tablist');
    container.appendChild(tablist);

    // The container has no role, so an authored label names the tablist instead
    for (const attr of Array.from(element.attributes)) {
      const target = TABLIST_LABEL_ATTRIBUTES.includes(attr.name) ? tablist : container;
      target.setAttribute(attr.name, attr.value);
    }

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

      const panelSource = element.cloneNode(false) as Element;
      for (const node of section.content) {
        panelSource.appendChild(node.cloneNode(true));
      }

      const panel = document.createElement('div');
      panel.className = 'cutie-tabpanel';
      panel.id = panelId;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', id);
      if (context.transformChildren) {
        panel.appendChild(context.transformChildren(panelSource));
      }
      // Panels without focusable content need a tab stop so keyboard users can
      // reach them; otherwise Tab goes straight to the panel's first control.
      if (!panel.querySelector(FOCUSABLE_SELECTOR)) {
        panel.setAttribute('tabindex', '0');
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
    padding-top: calc(0.4em - 3px);
    border-top: 4px solid var(--cutie-primary);
    background-color: var(--cutie-bg);
    border-bottom-color: var(--cutie-bg);
  }

  @media (forced-colors: active) {
    .cutie-tab-container .cutie-tab[aria-selected="true"] {
      border-top-color: Highlight;
    }
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
