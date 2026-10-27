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

  /*
   * Sources sit in word banks and each target is a column: a header over its
   * slots. The banks come before the targets in the DOM (choices before
   * targets, as the QTI vocabulary asks for assistive technology); the
   * interaction's qti-choices-* class only changes visual placement, so
   * screen-reader order stays stable.
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
   * slots sit level across the row. With a shared bank the bank row is empty.
   */
  .cutie-match-column {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    row-gap: 0;
    text-align: center;
  }

  /* The target area (header + slots) takes the column's header and slot rows. */
  .cutie-match-target {
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
   * Slots. A column pre-allocates one slot per unit of its match-min and grows
   * one empty slot at a time while it has capacity left. Slots are the drop
   * targets; dropping onto a filled slot replaces its occupant.
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

  .cutie-match-slot:focus-visible {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  /* An inert slot (empty with nothing in hand, or the interaction disabled) offers nothing to do. */
  .cutie-match-slot[aria-disabled="true"] {
    cursor: default;
  }

  .cutie-match-slot:not([aria-disabled="true"]):hover {
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
   * Selection states must follow --filled: dashed while the slot can take the
   * current selection, shaded while its source is picked up.
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


  /* Source bank: a bordered tray above its target(s) by default (qti-choices-top). */
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

  /*
   * Shared bank: one bank for every source, placed against the whole row of
   * columns by qti-choices-*.
   */
  .cutie-match-body {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .cutie-match-body > .cutie-match-bank {
    margin: 0;
  }

  .cutie-match-body > .cutie-match-columns {
    flex: 1;
  }

  .cutie-match-interaction--shared-bank.qti-choices-bottom .cutie-match-body {
    flex-direction: column-reverse;
  }

  .cutie-match-interaction--shared-bank.qti-choices-left .cutie-match-body {
    flex-direction: row;
  }

  .cutie-match-interaction--shared-bank.qti-choices-right .cutie-match-body {
    flex-direction: row-reverse;
  }

  .cutie-match-interaction--shared-bank.qti-choices-left .cutie-match-body > .cutie-match-bank,
  .cutie-match-interaction--shared-bank.qti-choices-right .cutie-match-body > .cutie-match-bank {
    flex: 0 1 30%;
    flex-direction: column;
    align-items: stretch;
  }

  /* Per-column banks, qti-choices-bottom: bank below its target (header, slots, then bank rows) */
  .cutie-match-interaction--column-banks.qti-choices-bottom .cutie-match-bank {
    grid-row: 3;
    margin-top: 1em;
    margin-bottom: 0;
  }

  .cutie-match-interaction--column-banks.qti-choices-bottom .cutie-match-target {
    grid-row: 1 / span 2;
  }

  /*
   * Per-column banks, qti-choices-left / -right: bank beside its target. The
   * target area keeps the header and slot rows so they still line up across
   * columns, and the bank spans all three rows beside it — explicit placement,
   * so it does not depend on source order.
   */
  .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-column,
  .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-column {
    grid-template-columns: auto auto;
    justify-content: center;
    column-gap: 1em;
  }

  .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-bank,
  .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-bank {
    grid-row: 1 / -1;
    margin-bottom: 0;
  }

  .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-target,
  .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-target {
    grid-row: 1 / span 2;
  }

  .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-bank,
  .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-target {
    grid-column: 1;
  }

  .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-bank,
  .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-target {
    grid-column: 2;
  }

  /* Mobile: stack columns and drop the side-by-side target/bank placement. */
  @media (max-width: 600px) {
    .cutie-match-columns {
      grid-template-columns: 1fr;
    }

    .cutie-match-interaction--shared-bank.qti-choices-left .cutie-match-body,
    .cutie-match-interaction--shared-bank.qti-choices-right .cutie-match-body {
      flex-direction: column;
    }

    .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-column,
    .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-column {
      grid-template-columns: 1fr;
    }

    .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-bank,
    .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-bank {
      grid-row: 1;
      grid-column: 1;
      margin-bottom: 1em;
    }

    .cutie-match-interaction--column-banks.qti-choices-left .cutie-match-target,
    .cutie-match-interaction--column-banks.qti-choices-right .cutie-match-target {
      grid-row: 2 / span 2;
      grid-column: 1;
    }
  }

  /*
   * A column's correct answer, under its last slot: the label, then the
   * sources that belong in the slots, centered like the column
   */
  .cutie-match-slots > .cutie-correct-answer {
    margin-top: 0.25em;
  }
`;
