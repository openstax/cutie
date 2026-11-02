/* spell-checker: ignore tablist tabpanel */
import { NARROW_MEDIA_QUERY } from '../../../styles/breakpoints.js';

export const TAB_CONTAINER_STYLES = `
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
