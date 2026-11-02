/* spell-checker: ignore tablist tabpanel */
import { CONTENT_CONTAINER } from '../../../styles/breakpoints.js';

/** Space below which a tab container shows an accordion instead of tabs */
const TABS_MIN_WIDTH = '40rem';

export const TAB_CONTAINER_STYLES = `
  /*
   * A grid, so in tabs mode every panel shares one cell (see below). In an
   * accordion the tablist is the only child, so the grid changes nothing.
   */
  .cutie-tab-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    margin: 1em 0;
  }

  /*
   * Signals the layout to the controller: it has width only while the space
   * is narrow, and a resize observer watches it. Out of flow and invisible.
   */
  .cutie-tab-container .cutie-tab-sentinel {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }

  @container ${CONTENT_CONTAINER} (width < ${TABS_MIN_WIDTH}) {
    .cutie-tab-container .cutie-tab-sentinel {
      width: 1px;
    }
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

  /*
   * Tabs reserve the tallest panel's height, so switching doesn't move the
   * page. Unselected panels stay in layout but invisible, which also keeps
   * them out of the accessibility tree and tab order.
   */
  .cutie-tab-container .cutie-tabpanel[role="tabpanel"] {
    grid-area: 2 / 1;
  }

  .cutie-tab-container .cutie-tabpanel[role="tabpanel"][hidden] {
    display: block;
    visibility: hidden;
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
`;
