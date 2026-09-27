export const MATCH_INTERACTION_STYLES = `
  .cutie-match-interaction {
    margin: 1em 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .cutie-match-interaction .cutie-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: var(--cutie-text);
  }

  .cutie-match-layout {
    display: flex;
    gap: 2em;
    justify-content: center;
  }

  /* Horizontal orientations: source and target side-by-side */
  .cutie-match-layout.cutie-match-source-left,
  .cutie-match-layout.cutie-match-source-right {
    flex-direction: row;
  }

  .cutie-match-layout.cutie-match-source-right {
    flex-direction: row-reverse;
  }

  /* Vertical orientations: source and target stacked */
  .cutie-match-layout.cutie-match-source-top,
  .cutie-match-layout.cutie-match-source-bottom {
    flex-direction: column;
  }

  .cutie-match-layout.cutie-match-source-bottom {
    flex-direction: column-reverse;
  }

  /* Visual separation for vertical layouts - divider between sets */
  .cutie-match-layout.cutie-match-source-top > .cutie-match-set--target,
  .cutie-match-layout.cutie-match-source-bottom > .cutie-match-set--source {
    padding-top: 1.5em;
    border-top: 1px solid var(--cutie-border);
  }

  /* Mobile: force vertical stack regardless of orientation preference */
  @media (max-width: 600px) {
    .cutie-match-layout.cutie-match-source-left,
    .cutie-match-layout.cutie-match-source-right,
    .cutie-match-layout.cutie-match-source-top,
    .cutie-match-layout.cutie-match-source-bottom {
      flex-direction: column;
      gap: 1.5em;
    }

    .cutie-match-set {
      min-width: unset;
      width: 100%;
    }

    /* Divider on second set (target comes after source in DOM) */
    .cutie-match-set--target {
      padding-top: 1.5em;
      border-top: 1px solid var(--cutie-border);
    }
  }

  .cutie-match-set {
    display: flex;
    flex-direction: column;
    gap: 1em;
    min-width: 200px;
  }

  .cutie-match-set-label {
    font-weight: 500;
    font-size: 0.875em;
    color: var(--cutie-text-muted);
    margin-bottom: 0.25em;
  }

  .cutie-match-choice-wrapper {
    display: flex;
    flex-direction: column;
  }

  .cutie-match-choice {
    display: flex;
    flex-direction: column;
    padding: 0.5em 0.75em;
    border: 2px solid var(--cutie-primary);
    border-radius: 4px;
    background-color: var(--cutie-bg);
    color: var(--cutie-text);
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .cutie-match-choice:hover {
    background-color: var(--cutie-bg-alt);
  }

  .cutie-match-choice:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .cutie-match-choice--selected {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-primary);
    color: var(--cutie-text);
  }

  .cutie-match-choice--drop-target {
    border: 2px dashed var(--cutie-primary);
    color: var(--cutie-text);
  }

  .cutie-match-choice--drag-over {
    border: 2px dashed var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
    color: var(--cutie-text);
    transform: scale(1.02);
  }

  .cutie-match-choice--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .cutie-match-choice--exhausted {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-match-choice--exhausted:hover {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-match-choice[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--cutie-bg-alt);
  }

  .cutie-match-choice-label {
    font-weight: 600;
  }

  .cutie-match-choice-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375em;
    margin-top: 0.5em;
  }

  .cutie-match-choice-chips:empty {
    display: none;
  }

  .cutie-match-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.25em 0.625em;
    font-size: 0.875em;
    font-weight: 600;
    font-family: inherit;
    background-color: transparent;
    border: 1.5px solid var(--cutie-primary);
    border-radius: 14px;
    color: var(--cutie-primary);
    cursor: grab;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .cutie-match-chip:hover {
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .cutie-match-chip:focus {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 1px;
  }

  .cutie-match-chip--selected {
    background-color: var(--cutie-primary);
    border-color: var(--cutie-primary);
    color: var(--cutie-primary-fg);
  }

  .cutie-match-chip--selected::after {
    content: '×';
    margin-left: 0.375em;
    font-weight: bold;
  }

  .cutie-match-chip--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .cutie-match-interaction--disabled .cutie-match-choice {
    cursor: default;
    opacity: 0.8;
  }

  .cutie-match-interaction--disabled .cutie-match-choice:hover {
    background-color: var(--cutie-bg);
    border-color: var(--cutie-primary);
  }

  .cutie-match-interaction--disabled .cutie-match-choice:focus {
    outline: none;
  }

  .cutie-match-interaction--disabled .cutie-match-chip {
    cursor: default;
  }

  .cutie-match-interaction--disabled .cutie-match-chip:hover {
    box-shadow: none;
  }

  /*
   * Grouped (bowtie) layout. When source choices carry match-group, the handler
   * renders one column per target choice: the target is the column's drop slot
   * and each column owns a bank of the sources that may fill it. DOM order is
   * slot -> bank; the interaction's qti-choices-* class only changes visual
   * placement, so screen-reader order stays stable.
   */
  .cutie-match-columns {
    display: flex;
    gap: 2em;
    justify-content: center;
    align-items: start;
    flex-wrap: wrap;
  }

  .cutie-match-column {
    display: flex;
    flex-direction: column;
    text-align: center;
    flex: 1 1 0;
    min-width: 11em;
  }

  /* Only the column's own slot spans the column; bank source pills stay inline. */
  .cutie-match-column > .cutie-match-choice-wrapper {
    width: 100%;
  }

  /* The target choice reads as a labelled drop slot for its column. */
  .cutie-match-slot {
    width: 100%;
    min-height: 3em;
  }

  /* Source bank: a bordered tray beneath its slot by default. */
  .cutie-match-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    justify-content: center;
    padding: 0.75em;
    margin-top: 1em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: var(--cutie-bg-alt);
    box-sizing: border-box;
  }

  /* qti-choices-top: bank above its slot */
  .cutie-match-interaction--grouped.qti-choices-top .cutie-match-bank {
    order: -1;
    margin-top: 0;
    margin-bottom: 1em;
  }

  /*
   * qti-choices-left / -right: bank beside its slot via a two-column grid
   * (bank first for -left, slot first for -right) — explicit placement, so it
   * does not depend on source order.
   */
  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column {
    display: grid;
    grid-template-columns: auto auto;
    align-items: start;
    justify-content: center;
    column-gap: 1em;
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column {
    grid-template-areas: "bank slot";
  }

  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column {
    grid-template-areas: "slot bank";
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column > .cutie-match-choice-wrapper,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column > .cutie-match-choice-wrapper {
    grid-area: slot;
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-bank,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-bank {
    grid-area: bank;
    margin-top: 0;
  }

  /* Mobile: stack columns and drop the side-by-side slot/bank grid. */
  @media (max-width: 600px) {
    .cutie-match-columns {
      flex-direction: column;
      gap: 1.5em;
    }

    .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column,
    .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column {
      display: flex;
      flex-direction: column;
    }

    .cutie-match-interaction--grouped.qti-choices-left .cutie-match-bank,
    .cutie-match-interaction--grouped.qti-choices-right .cutie-match-bank {
      margin-top: 1em;
    }
  }

`;
