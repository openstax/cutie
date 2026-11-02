/* spell-checker: ignore viewports */
import { NARROW_MEDIA_QUERY } from '../../../styles/breakpoints.js';
import type { TransformContext } from '../../types.js';
import { AccordionLayout, type Layout, type RenderedSection, TabsLayout } from './layouts.js';

/**
 * Controller for a tab container's open sections and layout.
 *
 * Shows tabs on wide viewports and an accordion on narrow ones, switching when
 * the viewport crosses the breakpoint. The open sections are saved to state.
 */
export class TabContainerController {
  private context: TransformContext;
  private sections: RenderedSection[];
  private stateKey: string;
  private media: MediaQueryList | null;
  private tabs: TabsLayout;
  private accordion: AccordionLayout;

  // State
  private layout: Layout;
  private open: number[];

  constructor(
    list: HTMLElement,
    labels: Attr[],
    sections: RenderedSection[],
    stateKey: string,
    context: TransformContext
  ) {
    this.context = context;
    this.sections = sections;
    this.stateKey = stateKey;

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

    // jsdom and other environments without matchMedia get tabs
    this.media = typeof window.matchMedia === 'function' ?
      window.matchMedia(NARROW_MEDIA_QUERY) : null;
    this.tabs = new TabsLayout(list, labels, sections, (index) => this.activate(index));
    this.accordion = new AccordionLayout(list, labels, sections);
    this.layout = this.currentLayout();

    sections.forEach(({ button }, i) => {
      button.addEventListener('click', () => this.activate(i));
      button.addEventListener('keydown', (event) => this.layout.handleKeydown?.(event, i));
    });

    this.media?.addEventListener('change', this.onMediaChange);
    this.context.onCleanup?.(() => this.media?.removeEventListener('change', this.onMediaChange));
  }

  initialize(): void {
    this.layout.apply();
    this.render();
  }

  private currentLayout(): Layout {
    return this.media?.matches ? this.accordion : this.tabs;
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
  private onMediaChange = (): void => {
    const active = document.activeElement as HTMLElement | null;
    const index = this.sections.findIndex((s) => s.button === active || s.panel.contains(active));
    if (index >= 0) this.open = [...this.open.filter((o) => o !== index), index];

    this.layout = this.currentLayout();
    this.layout.apply();
    this.render();

    const section = this.sections[index];
    if (!section || !active) return;
    this.layout.elementToRefocus(active, section).focus();
  };
}
