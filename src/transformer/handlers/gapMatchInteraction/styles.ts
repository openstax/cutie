export const GAP_STYLES = `
  .qti-gap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 4em;
    min-height: 1.5em;
    padding: 0.125em 0.5em;
    margin: 0 0.25em;
    border: 2px solid #999;
    border-radius: 4px;
    background-color: #f9f9f9;
    cursor: pointer;
    vertical-align: middle;
    transition: border-color 0.2s, background-color 0.2s, border-style 0.2s;
  }

  .qti-gap:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .qti-gap:hover {
    border-color: #666;
    background-color: #f0f0f0;
  }

  /* Filled gaps match word bank item styling */
  .qti-gap--filled {
    border-color: var(--cutie-primary);
    background-color: #fff;
    cursor: grab;
  }

  .qti-gap--filled:hover {
    border-color: var(--cutie-primary);
    background-color: #f5f5f5;
  }

  .qti-gap--selected {
    border-color: var(--cutie-primary);
    background-color: #ebebeb;
  }

  .qti-gap--drop-target {
    border: 2px dashed var(--cutie-primary);
    background-color: #f5f5f5;
  }

  .qti-gap--drag-over {
    border: 2px dashed var(--cutie-primary);
    background-color: #ebebeb;
    transform: scale(1.05);
  }

  .qti-gap--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  /* Placeholder uses nbsp for consistent height */
  .qti-gap-placeholder::before {
    content: '\\00a0\\00a0\\00a0\\00a0';
  }

  .qti-gap-content {
    font-weight: 600;
  }

  .qti-gap--error {
    border-color: #f44336;
    background-color: #ffebee;
    color: #c62828;
  }

  /* Disabled state for filled gaps */
  .qti-gap-match-interaction--disabled .qti-gap--filled {
    background-color: #e0e0e0;
    border-color: #9e9e9e;
    cursor: default;
    opacity: 0.8;
  }

  .qti-gap-match-interaction--disabled .qti-gap--filled:hover {
    background-color: #e0e0e0;
    border-color: #9e9e9e;
  }

  .qti-gap-match-interaction--disabled .qti-gap:focus {
    outline: none;
  }

  .qti-gap-match-interaction--disabled .qti-gap:not(.qti-gap--filled) {
    cursor: default;
  }

  .qti-gap-match-interaction--disabled .qti-gap:not(.qti-gap--filled):hover {
    border-color: #999;
    background-color: #f9f9f9;
  }
`;

export const GAP_MATCH_INTERACTION_STYLES = `
  .qti-gap-match-interaction {
    margin: 1em 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .qti-gap-match-interaction .qti-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: #333;
  }

  .qti-gap-match-choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    padding: 0.75em;
    margin-bottom: 1em;
    border: 2px solid #ddd;
    border-radius: 4px;
    background-color: #fafafa;
    transition: border-color 0.2s, background-color 0.2s, border-style 0.2s;
  }

  /* Word bank drop target — border only, no fill (contains child elements) */
  .qti-gap-match-choices--drop-target {
    border: 2px dashed var(--cutie-primary);
  }

  .qti-gap-match-choices--drag-over {
    border: 2px dashed var(--cutie-primary);
  }

  .qti-gap-text {
    display: inline-flex;
    align-items: center;
    padding: 0.5em 0.75em;
    border: 2px solid var(--cutie-primary);
    border-radius: 4px;
    background-color: #fff;
    color: #333;
    font-weight: 600;
    font-size: inherit;
    font-family: inherit;
    cursor: grab;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .qti-gap-text:hover {
    background-color: #f5f5f5;
    border-color: #bbb;
    color: #333;
  }

  .qti-gap-text:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .qti-gap-text--selected {
    background-color: #ebebeb;
    border-color: var(--cutie-primary);
    color: #333;
  }

  .qti-gap-text--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .qti-gap-text--exhausted {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }

  .qti-gap-text--exhausted:hover {
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }

  .qti-gap-text[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f5f5;
  }

  .qti-gap-text[disabled]:hover {
    background-color: #f5f5f5;
    border-color: var(--cutie-primary);
  }

  .qti-gap-text[disabled]:focus {
    outline: none;
  }

  .qti-gap-img-content {
    max-height: 2em;
    max-width: 4em;
    object-fit: contain;
  }

  .qti-gap-match-content {
    line-height: 2;
  }
`;
