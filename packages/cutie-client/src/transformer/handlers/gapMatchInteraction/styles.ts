export const GAP_STYLES = `
  .cutie-gap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4em;
    min-height: 1.5em;
    padding: 0.125em 0.5em;
    margin: 0 0.25em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: var(--cutie-bg-alt);
    cursor: pointer;
    vertical-align: middle;
    transition: border-color 0.2s, background-color 0.2s, border-style 0.2s;
  }

  .cutie-gap:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .cutie-gap:hover {
    background-color: var(--cutie-bg-alt);
  }

  /* Filled gaps match word bank item styling */
  .cutie-gap--filled {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg);
    cursor: grab;
  }

  .cutie-gap--filled:hover {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
  }

  .cutie-gap--selected {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
  }

  .cutie-gap--drop-target {
    border: 2px dashed var(--cutie-primary);
    background-color: var(--cutie-bg);
  }

  .cutie-gap--drag-over {
    border: 2px dashed var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
    transform: scale(1.05);
  }

  .cutie-gap--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  /* Placeholder uses nbsp for consistent height */
  .cutie-gap-placeholder::before {
    content: '\\00a0\\00a0\\00a0\\00a0';
  }

  .cutie-gap-content {
    font-weight: 600;
  }

  .cutie-gap--error {
    border-color: var(--cutie-feedback-incorrect);
    background-color: var(--cutie-bg);
    color: var(--cutie-feedback-incorrect);
  }

  /* Disabled state for filled gaps */
  .cutie-gap-match-interaction--disabled .cutie-gap--filled {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
    cursor: default;
    opacity: 0.8;
  }

  .cutie-gap-match-interaction--disabled .cutie-gap--filled:hover {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-gap-match-interaction--disabled .cutie-gap:focus {
    outline: none;
  }

  .cutie-gap-match-interaction--disabled .cutie-gap:not(.cutie-gap--filled) {
    cursor: default;
  }

  .cutie-gap-match-interaction--disabled .cutie-gap:not(.cutie-gap--filled):hover {
    border-color: var(--cutie-border);
    background-color: var(--cutie-bg-alt);
  }
`;

export const GAP_MATCH_INTERACTION_STYLES = `
  .cutie-gap-match-interaction {
    margin: 1em 0;
  }

  .cutie-gap-match-interaction .cutie-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: var(--cutie-text);
  }

  .cutie-gap-match-choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    padding: 0.75em;
    margin-bottom: 1em;
    border: 2px solid var(--cutie-border);
    border-radius: 4px;
    background-color: var(--cutie-bg-alt);
    transition: border-color 0.2s, background-color 0.2s, border-style 0.2s;
    box-sizing: border-box;
    max-width: 100%;
  }

  /* Word bank drop target — border only, no fill (contains child elements) */
  .cutie-gap-match-choices--drop-target {
    border: 2px dashed var(--cutie-primary);
  }

  .cutie-gap-match-choices--drag-over {
    border: 2px dashed var(--cutie-primary);
  }

  .cutie-gap-text {
    display: inline-flex;
    align-items: center;
    padding: 0.5em 0.75em;
    border-radius: 4px;
    background-color: var(--cutie-bg);
    color: var(--cutie-text);
    font-weight: 600;
    font-size: inherit;
    font-family: inherit;
    cursor: grab;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;

    &:not(:disabled) {
      border: 2px solid var(--cutie-primary);
    }
  }

  .cutie-gap-text:hover {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-primary);
    color: var(--cutie-text);
  }

  .cutie-gap-text:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .cutie-gap-text--selected {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-primary);
    color: var(--cutie-text);
  }

  .cutie-gap-text--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .cutie-gap-text--exhausted {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-gap-text--exhausted:hover {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-gap-text[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-gap-text[disabled]:hover {
    background-color: var(--cutie-bg-alt);
    border-color: var(--cutie-border);
  }

  .cutie-gap-text[disabled]:focus {
    outline: none;
  }

  .cutie-gap-img-content {
    max-height: 2em;
    max-width: 4em;
    object-fit: contain;
  }

  .cutie-gap-match-content {
    line-height: 2;
  }

  /*
   * QTI shared vocabulary: qti-choices-bottom|left|right reposition the shared
   * word bank relative to the content (qti-choices-top matches the default
   * order). These apply only when there IS a shared tray (a plain gap-match or
   * leftover ungrouped choices) — column layouts use the per-column rules
   * below. Only the visual order changes — DOM order stays prompt, choices,
   * content, constraint, so screen-reader order is stable.
   */
  .cutie-gap-match-interaction--shared-tray.qti-choices-bottom {
    display: flex;
    flex-direction: column;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-bottom > .cutie-gap-match-choices {
    order: 1;
    margin-bottom: 0;
    margin-top: 1em;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-bottom > .cutie-constraint-text {
    order: 2;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-left,
  .cutie-gap-match-interaction--shared-tray.qti-choices-right {
    display: grid;
    grid-template-areas: "prompt prompt" "choices content" "constraint constraint";
    grid-template-columns: minmax(10em, max-content) 1fr;
    column-gap: 1.5em;
    align-items: start;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-right {
    grid-template-areas: "prompt prompt" "content choices" "constraint constraint";
    grid-template-columns: 1fr minmax(10em, max-content);
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-left > .cutie-prompt,
  .cutie-gap-match-interaction--shared-tray.qti-choices-right > .cutie-prompt {
    grid-area: prompt;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-left > .cutie-gap-match-choices,
  .cutie-gap-match-interaction--shared-tray.qti-choices-right > .cutie-gap-match-choices {
    grid-area: choices;
    align-content: flex-start;
    margin-bottom: 0;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-left > .cutie-gap-match-content,
  .cutie-gap-match-interaction--shared-tray.qti-choices-right > .cutie-gap-match-content {
    grid-area: content;
  }

  .cutie-gap-match-interaction--shared-tray.qti-choices-left > .cutie-constraint-text,
  .cutie-gap-match-interaction--shared-tray.qti-choices-right > .cutie-constraint-text {
    grid-area: constraint;
  }

  /*
   * Per-column choice banks. When the content is laid out with the QTI layout
   * grid, each column that owns a match-group gets that group's choices banked
   * inside it (cutie-gap-match-column on the column, --column on the bank). The
   * bank sits beneath its gaps by default; the interaction's qti-choices-*
   * class repositions it within the column. DOM order stays gaps → bank, so
   * screen-reader order is stable.
   */
  .cutie-gap-match-column {
    display: flex;
    flex-direction: column;
  }

  .cutie-gap-match-choices--column {
    margin-top: 1em;
    margin-bottom: 0;
    justify-content: center;
  }

  /* qti-choices-top: bank above its gaps */
  .cutie-gap-match-interaction.qti-choices-top .cutie-gap-match-choices--column {
    order: -1;
    margin-top: 0;
    margin-bottom: 1em;
  }

  /* qti-choices-left / -right: bank beside its gaps */
  .cutie-gap-match-interaction.qti-choices-left .cutie-gap-match-column,
  .cutie-gap-match-interaction.qti-choices-right .cutie-gap-match-column {
    flex-direction: row;
    align-items: flex-start;
  }

  .cutie-gap-match-interaction.qti-choices-left .cutie-gap-match-choices--column {
    order: -1;
    margin: 0 1em 0 0;
  }

  .cutie-gap-match-interaction.qti-choices-right .cutie-gap-match-choices--column {
    margin: 0 0 0 1em;
  }

  /*
   * Diagram presentation for gap-match layout columns: the gaps become
   * full-width stacked drop targets and the columns center-align, so a shorter
   * middle column sits centered against taller side columns (the NCLEX bowtie
   * silhouette). Scoped to gap-match columns, not the general layout grid.
   */
  .cutie-gap-match-content > .qti-layout-row {
    align-items: center;
  }

  .cutie-gap-match-column {
    text-align: center;
  }

  .cutie-gap-match-column .cutie-gap {
    display: flex;
    width: 100%;
    min-height: 3em;
    margin: 0.25em 0;
    box-sizing: border-box;
  }
`;
