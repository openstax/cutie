/* spell-checker: ignore tablist tabpanel */
import { updateRovingTabindex } from '../../../utils/rovingTabindex.js';

export const TABLIST_LABEL_ATTRIBUTES = ['aria-label', 'aria-labelledby'];
const LAYOUT_ATTRIBUTES = ['role', 'aria-selected', 'aria-expanded', 'tabindex'];

export interface RenderedSection {
  heading: HTMLElement;
  button: HTMLButtonElement;
  panel: HTMLElement;
}

/** One way of presenting a container's sections, as tabs or as an accordion */
export interface Layout {
  /** Set roles and labels, and place the panels */
  apply(): void;
  /** Show the open sections and hide the rest */
  render(open: number[]): void;
  /** The sections left open after the user activates one */
  activate(index: number, open: number[]): number[];
  /** The element to focus after switching to this layout, given the one that had focus in a section */
  elementToRefocus(active: HTMLElement, section: RenderedSection): HTMLElement;
  handleKeydown?(event: KeyboardEvent, index: number): void;
}

/** Remove what either layout sets, so the next one starts clean */
function clearLayout(list: HTMLElement, sections: RenderedSection[]): void {
  list.removeAttribute('role');
  for (const name of TABLIST_LABEL_ATTRIBUTES) list.removeAttribute(name);
  for (const { heading, button, panel } of sections) {
    for (const name of LAYOUT_ATTRIBUTES) {
      heading.removeAttribute(name);
      button.removeAttribute(name);
      panel.removeAttribute(name);
    }
  }
}

function labelList(list: HTMLElement, role: string, labels: Attr[]): void {
  list.setAttribute('role', role);
  for (const attr of labels) list.setAttribute(attr.name, attr.value);
}

export class TabsLayout implements Layout {
  private list: HTMLElement;
  private labels: Attr[];
  private sections: RenderedSection[];
  private tabs: Map<string, HTMLElement>;
  private select: (index: number) => void;

  constructor(
    list: HTMLElement,
    labels: Attr[],
    sections: RenderedSection[],
    select: (index: number) => void
  ) {
    this.list = list;
    this.labels = labels;
    this.sections = sections;
    this.tabs = new Map(sections.map(({ button }) => [button.id, button]));
    this.select = select;
  }

  apply(): void {
    clearLayout(this.list, this.sections);
    labelList(this.list, 'tablist', this.labels);
    for (const { heading, button, panel } of this.sections) {
      heading.setAttribute('role', 'presentation');
      button.setAttribute('role', 'tab');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('tabindex', '0');
    }
    this.list.after(...this.sections.map((s) => s.panel));
  }

  /** The most recently opened section is the selected tab */
  render(open: number[]): void {
    const selected = this.sections[open[open.length - 1] ?? 0];
    for (const section of this.sections) {
      section.button.setAttribute('aria-selected', String(section === selected));
      section.panel.hidden = section !== selected;
    }
    updateRovingTabindex(this.tabs, selected.button);
  }

  activate(index: number): number[] {
    return [index];
  }

  elementToRefocus(active: HTMLElement): HTMLElement {
    return active;
  }

  // Selection follows focus (automatic activation): panels are already in the
  // DOM, so showing one is instant.
  handleKeydown(event: KeyboardEvent, index: number): void {
    // Leave modified keys to the browser, e.g. Alt+ArrowLeft for back
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const count = this.sections.length;
    const target = new Map([
      ['ArrowRight', (index + 1) % count],
      ['ArrowLeft', (index - 1 + count) % count],
      ['Home', 0],
      ['End', count - 1]
    ]).get(event.key);
    if (target === undefined) return;

    event.preventDefault();
    this.select(target);
    this.sections[target].button.focus();
  }
}

export class AccordionLayout implements Layout {
  private list: HTMLElement;
  private labels: Attr[];
  private sections: RenderedSection[];

  constructor(list: HTMLElement, labels: Attr[], sections: RenderedSection[]) {
    this.list = list;
    this.labels = labels;
    this.sections = sections;
  }

  apply(): void {
    clearLayout(this.list, this.sections);
    // An unlabeled group adds nothing, so the accordion gets one only with a label
    if (this.labels.length > 0) labelList(this.list, 'group', this.labels);
    for (const { heading, panel } of this.sections) {
      panel.setAttribute('role', 'region');
      heading.after(panel);
    }
  }

  render(open: number[]): void {
    this.sections.forEach(({ button, panel }, i) => {
      button.setAttribute('aria-expanded', String(open.includes(i)));
      panel.hidden = !open.includes(i);
    });
  }

  activate(index: number, open: number[]): number[] {
    return open.includes(index) ? open.filter((o) => o !== index) : [...open, index];
  }

  // An accordion panel can't take focus, so focus on a tab panel moves to that
  // section's button
  elementToRefocus(active: HTMLElement, section: RenderedSection): HTMLElement {
    return active === section.panel ? section.button : active;
  }
}
