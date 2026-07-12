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
   * Bowtie layout (NCLEX-style): the three content regions — Actions to Take,
   * Condition, Parameters to Monitor — are laid out as a 3-column grid. Each
   * region is authored as a top-level block in gap-match-content, so document
   * order maps to left / center / right.
   */
  .cutie-gap-match-bowtie .cutie-gap-match-content {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1em;
    line-height: 1.5;
  }

  .cutie-gap-match-bowtie .cutie-gap-match-content > * {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    padding: 1em;
    border: 2px solid var(--cutie-border);
    border-radius: 8px;
    text-align: center;
  }

  /* The central "Condition" region is the focal point of the bowtie */
  .cutie-gap-match-bowtie .cutie-gap-match-content > *:nth-child(2) {
    border-color: var(--cutie-primary);
    background-color: var(--cutie-bg-alt);
    font-weight: 600;
  }

  /* Collapse to a single column on narrow screens */
  @media (max-width: 40em) {
    .cutie-gap-match-bowtie .cutie-gap-match-content {
      grid-template-columns: 1fr;
    }
  }
`;
