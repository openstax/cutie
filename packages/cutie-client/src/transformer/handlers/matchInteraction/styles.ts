// cspell:ignore subgrid
export const MATCH_INTERACTION_STYLES = `
  .cutie-match-interaction {
    margin: 1em 0;
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
    outline: var(--cutie-focus-ring);
    outline-offset: var(--cutie-focus-ring-offset);
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
    outline: var(--cutie-focus-ring);
    outline-offset: var(--cutie-focus-ring-offset);
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
   * renders one column per target choice: each column owns a bank of the
   * sources that may fill it, and the target labels the column's slots. DOM
   * order is bank -> target (choices before targets, as the QTI vocabulary asks
   * for assistive technology); the interaction's qti-choices-* class only
   * changes visual placement, so screen-reader order stays stable.
   */
  .cutie-match-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(11em, 1fr));
    gap: 1.5em 2em;
  }

  /*
   * Each column spans three rows of the shared grid (bank, header, slots) and
   * adopts them as a subgrid, so the columns line up row by row whatever each
   * holds: every bank is as tall as the tallest, and the headers and the first
   * slots sit level across the row.
   */
  .cutie-match-column {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    row-gap: 0;
    text-align: center;
  }

  /* The target area (header + slots) takes the column's header and slot rows. */
  .cutie-match-column > .cutie-match-choice-wrapper {
    display: grid;
    grid-row: 2 / span 2;
    grid-template-rows: subgrid;
    row-gap: 0;
  }

  /*
   * The target is a plain column HEADER, not a drop box: the slots beneath it are
   * the only drop targets. It just labels the column.
   */
  .cutie-match-target-header {
    align-self: end;
    padding: 0.25em 0.5em 0.5em;
    margin-bottom: 0.5em;
    font-weight: 700;
    color: var(--cutie-text);
  }

  /*
   * Visual slots. A grouped column draws one slot box per unit of capacity
   * (match-max, else the interaction's max-associations) beneath its header, so
   * empty capacity is visible. Slots are the drop targets; dropping onto a
   * filled slot replaces its occupant.
   */
  .cutie-match-slots {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }

  .cutie-match-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5em;
    padding: 0.25em 0.5em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: var(--cutie-bg);
    box-sizing: border-box;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s, transform 0.1s;
  }

  .cutie-match-slot:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .cutie-match-slot:hover {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
  }

  /* Filled slots read as a pill holding the placed source. */
  .cutie-match-slot--filled {
    border-color: var(--cutie-primary);
    cursor: grab;
    font-weight: 600;
  }

  /*
   * Selection states mirror a classic match choice and must follow --filled:
   * dashed while the slot can take the current selection, shaded while its
   * source is picked up.
   */
  .cutie-match-slot--drop-target {
    border-style: dashed;
    border-color: var(--cutie-primary);
  }

  .cutie-match-slot--selected {
    background-color: var(--cutie-bg-alt);
  }

  .cutie-match-slot--drag-over {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
    transform: scale(1.02);
  }

  .cutie-match-slot--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .cutie-match-slot-placeholder::before {
    content: '\\00a0';
  }

  /* Slots are inert once the interaction is disabled; a placed answer stays readable. */
  .cutie-match-interaction--disabled .cutie-match-slot {
    cursor: default;
    opacity: 0.8;
  }

  .cutie-match-interaction--disabled .cutie-match-slot:hover {
    border-color: var(--cutie-border);
    background-color: var(--cutie-bg);
  }

  .cutie-match-interaction--disabled .cutie-match-slot--filled:hover {
    border-color: var(--cutie-primary);
  }

  /* Source bank: a bordered tray above its target by default (qti-choices-top). */
  .cutie-match-bank {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    justify-content: center;
    padding: 0.75em;
    margin-bottom: 1em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: var(--cutie-bg-alt);
    box-sizing: border-box;
    /* Banks stretch to the tallest in the row; keep the sources at the top. */
    align-content: flex-start;
  }

  /*
   * Word bank highlighted as a return target while moving a placed source. Must
   * follow the base bank rule, whose border and background it overrides.
   */
  .cutie-match-bank--drop-target,
  .cutie-match-bank--drag-over {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg);
  }

  /* qti-choices-bottom: bank below its target (header, slots, then bank rows) */
  .cutie-match-interaction--grouped.qti-choices-bottom .cutie-match-bank {
    grid-row: 3;
    margin-top: 1em;
    margin-bottom: 0;
  }

  .cutie-match-interaction--grouped.qti-choices-bottom .cutie-match-column > .cutie-match-choice-wrapper {
    grid-row: 1 / span 2;
  }

  /*
   * qti-choices-left / -right: bank beside its target. The target area keeps the
   * header and slot rows so they still line up across columns, and the bank
   * spans all three rows beside it — explicit placement, so it does not depend
   * on source order.
   */
  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column {
    grid-template-columns: auto auto;
    justify-content: center;
    column-gap: 1em;
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-bank,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-bank {
    grid-row: 1 / -1;
    margin-bottom: 0;
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column > .cutie-match-choice-wrapper,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column > .cutie-match-choice-wrapper {
    grid-row: 1 / span 2;
  }

  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-bank,
  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column > .cutie-match-choice-wrapper {
    grid-column: 1;
  }

  .cutie-match-interaction--grouped.qti-choices-right .cutie-match-bank,
  .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column > .cutie-match-choice-wrapper {
    grid-column: 2;
  }

  /* Mobile: stack columns and drop the side-by-side target/bank placement. */
  @media (max-width: 600px) {
    .cutie-match-columns {
      grid-template-columns: 1fr;
    }

    .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column,
    .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column {
      grid-template-columns: 1fr;
    }

    .cutie-match-interaction--grouped.qti-choices-left .cutie-match-bank,
    .cutie-match-interaction--grouped.qti-choices-right .cutie-match-bank {
      grid-row: 1;
      grid-column: 1;
      margin-bottom: 1em;
    }

    .cutie-match-interaction--grouped.qti-choices-left .cutie-match-column > .cutie-match-choice-wrapper,
    .cutie-match-interaction--grouped.qti-choices-right .cutie-match-column > .cutie-match-choice-wrapper {
      grid-row: 2 / span 2;
      grid-column: 1;
    }
  }

  /*
   * The choice's correct answer (shown once an attempt is evaluated), between
   * the choice and its chips: the label and the matched choices on one line
   */
  .cutie-match-choice-wrapper > .cutie-correct-answer {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.35em;
    margin-top: 0.35em;
  }

  .cutie-match-choice-wrapper > .cutie-correct-answer > .cutie-correct-answer__value {
    margin-top: 0;
  }
`;
