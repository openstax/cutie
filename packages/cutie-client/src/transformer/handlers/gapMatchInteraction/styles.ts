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
    outline: 3px solid #2196f3;
    outline-offset: 2px;
  }

  .qti-gap:hover {
    border-color: #666;
    background-color: #f0f0f0;
  }

  /* Filled gaps match word bank item styling */
  .qti-gap--filled {
    border-color: #1976d2;
    background-color: #fff;
    cursor: grab;
  }

  .qti-gap--filled:hover {
    border-color: #1565c0;
    background-color: #e3f2fd;
  }

  .qti-gap--selected {
    border-color: #0d47a1;
    background-color: #bbdefb;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
  }

  /* Drop target uses blue theme instead of green */
  .qti-gap--drop-target {
    border: 2px dashed #1976d2;
    background-color: #e3f2fd;
  }

  .qti-gap--drag-over {
    border: 2px dashed #0d47a1;
    background-color: #bbdefb;
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
    font-weight: 500;
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

  /* Word bank drop target uses blue theme */
  .qti-gap-match-choices--drop-target {
    border: 2px dashed #1976d2;
    background-color: #e3f2fd;
  }

  .qti-gap-match-choices--drag-over {
    border: 2px dashed #0d47a1;
    background-color: #bbdefb;
  }

  .qti-gap-text {
    display: inline-flex;
    align-items: center;
    padding: 0.5em 0.75em;
    border: 2px solid #1976d2;
    border-radius: 4px;
    background-color: #fff;
    color: #333;
    font-size: inherit;
    font-family: inherit;
    cursor: grab;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .qti-gap-text:hover {
    background-color: #e3f2fd;
    border-color: #1565c0;
  }

  .qti-gap-text:focus {
    outline: 3px solid #2196f3;
    outline-offset: 2px;
  }

  .qti-gap-text--selected {
    background-color: #bbdefb;
    border-color: #0d47a1;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
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
    border-color: #1976d2;
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
