/* spell-checker: ignore tablist tabpanel viewports */
import type { ElementHandler, TransformContext } from '../../types.js';
import { TabContainerController } from './controller.js';
import { type RenderedSection, TABLIST_LABEL_ATTRIBUTES } from './layouts.js';
import { TAB_CONTAINER_STYLES } from './styles.js';

const TAB_CONTAINER_CLASS = 'cutie-tab-container';
const TAB_CONTAINER_SELECTOR = `[class~="${TAB_CONTAINER_CLASS}"]`;
const SECTION_TEXT_ATTRIBUTES = ['lang', 'dir'];

let idCounter = 0;

interface TabSection {
  section: Element;
  heading: Element;
  content: Node[];
}

function isHeading(element: Element): boolean {
  return /^h[1-6]$/.test(element.localName.toLowerCase());
}

/** Copy authored attributes (or those `include` accepts) onto a rendered element, adding to its classes */
function copyAttributes(from: Element, to: HTMLElement, include: (name: string) => boolean = () => true): void {
  for (const attr of Array.from(from.attributes)) {
    if (!include(attr.name)) continue;
    if (attr.name === 'class') to.classList.add(...from.classList);
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
    if (node.nodeType !== Node.ELEMENT_NODE ||
        (node as Element).localName.toLowerCase() !== 'section') {
      return null;
    }

    const nodes = Array.from(node.childNodes);
    const start = nodes.findIndex((child) => !isBlank(child));
    const heading = nodes[start];
    if (!heading || heading.nodeType !== Node.ELEMENT_NODE || !isHeading(heading as Element)) {
      return null;
    }

    sections.push({
      section: node as Element,
      heading: heading as Element,
      content: nodes.slice(start + 1)
    });
  }

  return sections.length > 0 ? sections : null;
}

/**
 * Handler for `<div class="cutie-tab-container">` holding `<section>`s
 *
 * Renders tabs on wide viewports and an accordion on narrow ones, from one set
 * of elements: each section is a heading wrapping a button, plus a panel.
 * Switching layouts changes their roles and moves the panels.
 *
 * Sections hold reference content (text, tables, media, links), not
 * interactions or form controls.
 */
export class TabContainerHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    return element.classList.contains(TAB_CONTAINER_CLASS) && splitSections(element) !== null;
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
      copyAttributes(
        section.section,
        heading,
        (name) => SECTION_TEXT_ATTRIBUTES.includes(name)
      );
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

      return { heading, button, panel };
    });

    const stateKey = `tab-container:${Array.from(
      element.ownerDocument.querySelectorAll(TAB_CONTAINER_SELECTOR)
    ).indexOf(element)}`;
    new TabContainerController(list, labels, sections, stateKey, context).initialize();

    fragment.appendChild(container);
    return fragment;
  }
}
