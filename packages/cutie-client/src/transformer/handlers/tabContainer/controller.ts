import type { TransformContext } from '../../types.js';
import { AccordionLayout, type Layout, type RenderedSection, TabsLayout } from './layouts.js';

/**
 * Controller for a tab container's open sections and layout.
 *
 * Shows tabs in wide space and an accordion in narrow space, switching when the
 * space crosses the breakpoint. The breakpoint is a container query, which has
 * no change event, so a sentinel the query resizes signals it: a resize
 * observer fires when the query flips, whether the space or the root font size
 * changed. The open sections are saved to state.
 */
export class TabContainerController {
  private context: TransformContext;
  private sections: RenderedSection[];
  private stateKey: string;
  private sentinel: HTMLElement;
  private tabs: TabsLayout;
  private accordion: AccordionLayout;

  // State
  private layout: Layout;
  private open: number[];

  constructor(
    list: HTMLElement,
    sentinel: HTMLElement,
    labels: Attr[],
    sections: RenderedSection[],
    stateKey: string,
    context: TransformContext
  ) {
    this.context = context;
    this.sections = sections;
    this.stateKey = stateKey;
    this.sentinel = sentinel;

    const saved = context.state?.get(stateKey);
    const isSection = (i: unknown): i is number =>
      Number.isInteger(i) &&
      (i as number) >= 0 &&
      (i as number) < sections.length;

    if (Array.isArray(saved)) {
      const filtered = saved.filter(isSection);
      this.open = filtered.length > 0 ? filtered : (saved.length === 0 ? [] : [0]);
    } else {
      this.open = [0];
    }

    this.tabs = new TabsLayout(list, labels, sections, (index) => this.activate(index));
    this.accordion = new AccordionLayout(list, labels, sections);
    // Tabs until the sentinel is laid out: the first observation comes after
    // the item is attached, before it's painted
    this.layout = this.tabs;

    sections.forEach(({ button }, i) => {
      button.addEventListener('click', () => this.activate(i));
      button.addEventListener('keydown', (event) => this.layout.handleKeydown?.(event, i));
    });

    // jsdom and other environments without ResizeObserver get tabs
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(this.onResize);
    observer.observe(sentinel);
    this.context.onCleanup?.(() => observer.disconnect());
  }

  initialize(): void {
    this.layout.apply();
    this.render();
  }

  /** The sentinel has width only while the space is narrow (see styles) */
  private currentLayout(): Layout {
    return this.sentinel.offsetWidth > 0 ? this.accordion : this.tabs;
  }

  private activate(index: number): void {
    this.open = this.layout.activate(index, this.open);
    this.render();
  }

  // Applying a layout only happens on a layout change, because moving a panel
  // drops focus from it
  private render(): void {
    this.layout.render(this.open);
    this.context.state?.set(this.stateKey, this.open);
  }

  // The section holding focus stays open across a layout change. Moving its
  // panel drops focus, so restore it.
  private onResize = (): void => {
    const layout = this.currentLayout();
    if (layout === this.layout) return;

    const active = document.activeElement as HTMLElement | null;
    const index = this.sections.findIndex((s) => s.button === active || s.panel.contains(active));
    if (index >= 0) this.open = [...this.open.filter((o) => o !== index), index];

    this.layout = layout;
    this.layout.apply();
    this.render();

    const section = this.sections[index];
    if (!section || !active) return;
    this.layout.elementToRefocus(active, section).focus();
  };
}
