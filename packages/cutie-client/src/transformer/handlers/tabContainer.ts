/* spell-checker: ignore tablist tabpanel viewports iframes */
import { NARROW_MEDIA_QUERY } from '../../styles/breakpoints.js';
import { focusNext, focusPrev, updateRovingTabindex } from '../../utils/rovingTabindex.js';
import { registry } from '../registry.js';
import type { ElementHandler, TransformContext } from '../types.js';

const TAB_CONTAINER_CLASS = 'cutie-tab-container';
const TAB_CONTAINER_SELECTOR = `[class~="${TAB_CONTAINER_CLASS}"]`;
const TABLIST_LABEL_ATTRIBUTES = ['aria-label', 'aria-labelledby'];
const MODE_ATTRIBUTES = ['role', 'aria-selected', 'aria-expanded', 'tabindex'];
const SECTION_TEXT_ATTRIBUTES = ['lang', 'xml:lang', 'dir'];
const FOCUSABLE_SELECTOR =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

let idCounter = 0;

interface TabSection {
  section: Element;
  heading: Element;
  content: Node[];
}

interface RenderedSection {
  heading: HTMLElement;
  button: HTMLButtonElement;
  panel: HTMLElement;
  needsTabStop: boolean;
}

type Mode = 'tabs' | 'accordion';

function hasClassToken(element: Element, token: string): boolean {
  return (element.getAttribute('class') ?? '').split(/\s+/).includes(token);
}

function isHeading(element: Element): boolean {
  return /^h[1-6]$/.test(element.localName.toLowerCase());
}

/** Copy authored attributes (or those `include` accepts) onto a rendered element, adding to its classes */
function copyAttributes(from: Element, to: HTMLElement, include: (name: string) => boolean = () => true): void {
  for (const attr of Array.from(from.attributes)) {
    if (!include(attr.name)) continue;
    if (attr.name === 'class') to.classList.add(...attr.value.split(/\s+/).filter(Boolean));
    else to.setAttribute(attr.name, attr.value);
  }
}

function isAria(name: string): boolean {
  return name.startsWith('aria-');
}

/** Whitespace and comments, which may sit between the elements we look for */
function isBlank(node: Node): boolean {
  if (node.nodeType === Node.COMMENT_NODE) return true;
  return node.nodeType === Node.TEXT_NODE && !node.textContent?.trim();
}

/**
 * Find a container's tabs. Each child `<section>` is a tab: its first heading
 * labels the tab, and the rest of the section is that tab's panel.
 */
function splitSections(element: Element): TabSection[] | null {
  const sections: TabSection[] = [];

  for (const node of Array.from(element.childNodes)) {
    if (isBlank(node)) continue;
    if (node.nodeType !== Node.ELEMENT_NODE || (node as Element).localName.toLowerCase() !== 'section') {
      return null;
    }

    const nodes = Array.from(node.childNodes);
    const start = nodes.findIndex((child) => !isBlank(child));
    const heading = nodes[start];
    if (!heading || heading.nodeType !== Node.ELEMENT_NODE || !isHeading(heading as Element)) return null;

    sections.push({ section: node as Element, heading: heading as Element, content: nodes.slice(start + 1) });
  }

  return sections.length > 0 ? sections : null;
}

/**
 * Handler for `<div class="cutie-tab-container">` holding `<section>`s
 *
 * Renders tabs on wide viewports and an accordion on narrow ones, from one set
 * of elements: each section is a heading wrapping a button, plus a panel.
 * Switching modes changes their roles and moves the panels.
 *
 * Sections hold reference content (text, tables, media, links), not
 * interactions or form controls.
 */
class TabContainerHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return hasClassToken(element, TAB_CONTAINER_CLASS) && splitSections(element) !== null;
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    if (context.styleManager && !context.styleManager.hasStyle('cutie-tab-container')) {
      context.styleManager.addStyle('cutie-tab-container', TAB_CONTAINER_STYLES);
    }

    const container = document.createElement('div');
    const list = document.createElement('div');
    list.className = 'cutie-tablist';
    container.appendChild(list);

    // The container has no role, so an authored label names the tablist instead,
    // or in an accordion, the group of section buttons.
    const labels: Attr[] = [];
    for (const attr of Array.from(element.attributes)) {
      if (TABLIST_LABEL_ATTRIBUTES.includes(attr.name)) labels.push(attr);
      else container.setAttribute(attr.name, attr.value);
    }

    const sections: RenderedSection[] = (splitSections(element) ?? []).map((section) => {
      const id = `cutie-tab-${++idCounter}`;

      // Keeps the authored heading level, so the accordion's outline matches.
      // In tabs mode the heading sits apart from its panel, so it takes the
      // section's language and direction too; its own attributes win. Its ARIA
      // attributes go on the button: on the heading they would override its
      // presentation role in tabs mode, putting a heading in the tablist.
      const heading = document.createElement(section.heading.localName.toLowerCase());
      heading.className = 'cutie-tab-heading';
      copyAttributes(section.section, heading, (name) => SECTION_TEXT_ATTRIBUTES.includes(name));
      copyAttributes(section.heading, heading, (name) => !isAria(name));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cutie-tab';
      button.id = id;
      copyAttributes(section.heading, button, isAria);
      if (context.transformChildren) {
        button.appendChild(context.transformChildren(section.heading));
      }
      heading.appendChild(button);
      list.appendChild(heading);

      // The panel stands in for the section, keeping its attributes. The tab
      // wiring is set after, so authored attributes can't break it.
      const panel = document.createElement('div');
      panel.className = 'cutie-tabpanel';
      copyAttributes(section.section, panel);
      if (!panel.id) panel.id = `${id}-panel`;
      panel.setAttribute('aria-labelledby', id);
      button.setAttribute('aria-controls', panel.id);
      // Transforms the authored nodes in place, so handlers inside a panel can
      // still find their ancestors (qti-item-body, feedback, blocks)
      for (const node of section.content) {
        if (node.nodeType === Node.TEXT_NODE) {
          panel.appendChild(node.cloneNode(true));
        } else if (node.nodeType === Node.ELEMENT_NODE && context.transformNode) {
          panel.appendChild(context.transformNode(node as Element));
        }
      }

      // Tab panels without focusable content need a tab stop so keyboard users
      // can reach them; otherwise Tab goes straight to the panel's first control.
      return { heading, button, panel, needsTabStop: !panel.querySelector(FOCUSABLE_SELECTOR) };
    });

    const tabs = new Map(sections.map((section) => [section.button.id, section.button as HTMLElement]));
    const indexOf = (button: HTMLElement): number => sections.findIndex((s) => s.button === button);
    const stateKey = `tab-container:${Array.from(
      element.ownerDocument.querySelectorAll(TAB_CONTAINER_SELECTOR)
    ).indexOf(element)}`;

    const saved = context.state?.get(stateKey);
    let open = Array.isArray(saved) ? (saved as number[]).filter((i) => i < sections.length) : [0];

    // jsdom and other environments without matchMedia get tabs
    const media = typeof window.matchMedia === 'function' ? window.matchMedia(NARROW_MEDIA_QUERY) : null;
    let mode: Mode = media?.matches ? 'accordion' : 'tabs';

    // Sets roles and places panels for the current mode. Runs only on the first
    // render and when the mode changes, because moving a panel reloads its
    // iframes and drops focus.
    const layout = (): void => {
      list.removeAttribute('role');
      for (const name of TABLIST_LABEL_ATTRIBUTES) list.removeAttribute(name);
      for (const { heading, button, panel } of sections) {
        for (const name of MODE_ATTRIBUTES) {
          heading.removeAttribute(name);
          button.removeAttribute(name);
          panel.removeAttribute(name);
        }
      }

      // An unlabeled group adds nothing, so the accordion gets one only with a label
      if (mode === 'tabs' || labels.length > 0) {
        list.setAttribute('role', mode === 'tabs' ? 'tablist' : 'group');
        for (const attr of labels) list.setAttribute(attr.name, attr.value);
      }

      if (mode === 'tabs') {
        for (const { heading, button, panel, needsTabStop } of sections) {
          heading.setAttribute('role', 'presentation');
          button.setAttribute('role', 'tab');
          panel.setAttribute('role', 'tabpanel');
          if (needsTabStop) panel.setAttribute('tabindex', '0');
        }
        list.after(...sections.map((s) => s.panel));
      } else {
        for (const { heading, panel } of sections) {
          panel.setAttribute('role', 'region');
          heading.after(panel);
        }
      }
    };

    const render = (): void => {
      if (mode === 'tabs') {
        const selected = open[open.length - 1] ?? 0;
        sections.forEach(({ button, panel }, i) => {
          button.setAttribute('aria-selected', String(i === selected));
          panel.hidden = i !== selected;
        });
        updateRovingTabindex(tabs, sections[selected]!.button);
      } else {
        sections.forEach(({ button, panel }, i) => {
          button.setAttribute('aria-expanded', String(open.includes(i)));
          panel.hidden = !open.includes(i);
        });
      }

      context.state?.set(stateKey, open);
    };

    for (const [i, { button }] of sections.entries()) {
      button.addEventListener('click', () => {
        if (mode === 'tabs') open = [i];
        else open = open.includes(i) ? open.filter((o) => o !== i) : [...open, i];
        render();
      });
    }

    // Selection follows focus (automatic activation): panels are already in
    // the DOM, so showing one is instant.
    list.addEventListener('keydown', (event) => {
      if (mode !== 'tabs') return;
      const current = (event.target as HTMLElement).closest<HTMLElement>('[role="tab"]');
      if (!current) return;

      let target: HTMLElement | null = null;
      if (event.key === 'ArrowRight') target = focusNext(tabs, current.id);
      else if (event.key === 'ArrowLeft') target = focusPrev(tabs, current.id);
      else if (event.key === 'Home') target = sections[0]!.button;
      else if (event.key === 'End') target = sections[sections.length - 1]!.button;
      if (!target) return;

      event.preventDefault();
      open = [indexOf(target)];
      render();
      target.focus();
    });

    // The section holding focus stays open across a mode change. Moving its
    // panel drops focus, so restore it; an accordion panel can't take focus, so
    // focus on a tab panel moves to that section's button.
    const onMediaChange = (): void => {
      const active = document.activeElement as HTMLElement | null;
      const index = sections.findIndex((s) => s.button === active || s.panel.contains(active));
      if (index >= 0) open = [...open.filter((o) => o !== index), index];

      mode = media?.matches ? 'accordion' : 'tabs';
      layout();
      render();

      const section = sections[index];
      if (!section || !active) return;
      (mode === 'accordion' && active === section.panel ? section.button : active).focus();
    };
    media?.addEventListener('change', onMediaChange);
    context.onCleanup?.(() => media?.removeEventListener('change', onMediaChange));

    layout();
    render();
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

  .cutie-tab-container .cutie-tab-heading {
    margin: 0;
    font: inherit;
  }

  .cutie-tab-container .cutie-tab {
    color: var(--cutie-text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    overflow-wrap: anywhere;
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
    outline: var(--cutie-focus-ring);
    outline-offset: var(--cutie-focus-ring-offset);
  }

  /*
   * Tabs stay on one row: they shrink and their labels wrap. Each heading is a
   * stretched flex item holding a stretched button, so all tabs match in height.
   */
  .cutie-tab-container .cutie-tablist[role="tablist"] {
    display: flex;
    gap: 0.25em;
    margin-bottom: -1px;
  }

  .cutie-tab-container .cutie-tab-heading[role="presentation"] {
    display: flex;
    flex: 1;
    min-width: 0;
    container-type: inline-size;
  }

  .cutie-tab-container .cutie-tab[role="tab"] {
    position: relative;
    flex: 1;
    padding: 0.4em 1em;
    border: 1px solid var(--cutie-border);
    border-radius: 6px 6px 0 0;
    background-color: var(--cutie-bg-alt);
  }

  .cutie-tab-container .cutie-tab[aria-selected="true"] {
    z-index: 1;
    padding-top: calc(0.4em - 3px);
    border-top: 4px solid var(--cutie-primary);
    background-color: var(--cutie-bg);
    border-bottom-color: var(--cutie-bg);
  }

  @container (max-width: 8em) {
    .cutie-tab-container .cutie-tab[role="tab"] {
      padding-inline: 0.5em;
    }
  }

  @container (max-width: 6em) {
    .cutie-tab-container .cutie-tab[role="tab"] {
      padding-inline: 0.25em;
    }
  }

  @media (forced-colors: active) {
    .cutie-tab-container .cutie-tab[aria-selected="true"] {
      border-top-color: Highlight;
    }
  }

  /* Accordion: each heading's button sits directly above its panel */
  .cutie-tab-container .cutie-tablist:not([role="tablist"]) > .cutie-tab-heading:not(:first-child) {
    margin-top: 0.25em;
  }

  .cutie-tab-container .cutie-tab[aria-expanded] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1em;
    width: 100%;
    padding: 0.6em 1em;
    border: 1px solid var(--cutie-border);
    background-color: var(--cutie-bg-alt);
    text-align: start;
  }

  .cutie-tab-container .cutie-tab[aria-expanded="true"] {
    background-color: var(--cutie-bg);
  }

  /* Chevron drawn with currentColor borders, so forced colors restyle it */
  .cutie-tab-container .cutie-tab[aria-expanded]::after {
    content: "";
    flex: none;
    width: 0.5em;
    height: 0.5em;
    margin-bottom: 0.25em;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .cutie-tab-container .cutie-tab[aria-expanded="true"]::after {
    margin: 0.25em 0 0;
    transform: rotate(-135deg);
  }

  .cutie-tab-container .cutie-tabpanel[role="region"] {
    border-top: none;
  }

  /*
   * A record that is the sole content of a layout column beside other columns
   * takes the row's height from its siblings, and the active panel scrolls.
   * Off when the row stacks to one column (see baseStyles).
   */
  @media not all and ${NARROW_MEDIA_QUERY} {
    .qti-layout-row > [class*="qti-layout-col"]:not(:only-child):has(> .cutie-tab-container:only-child) {
      position: relative;
      align-self: stretch;
      min-height: 20em;
    }

    .qti-layout-row > [class*="qti-layout-col"]:not(:only-child) > .cutie-tab-container:only-child {
      position: absolute;
      inset: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
    }

    .qti-layout-row > [class*="qti-layout-col"]:not(:only-child) > .cutie-tab-container:only-child .cutie-tablist {
      flex: none;
    }

    .qti-layout-row > [class*="qti-layout-col"]:not(:only-child) > .cutie-tab-container:only-child .cutie-tabpanel {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
  }
`;
