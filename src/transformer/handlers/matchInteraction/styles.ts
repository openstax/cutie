export const MATCH_INTERACTION_STYLES = `
  .qti-match-interaction {
    margin: 1em 0;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .qti-match-interaction .qti-prompt {
    font-weight: 600;
    margin-bottom: 0.75em;
    color: #333;
  }

  .qti-match-layout {
    display: flex;
    gap: 2em;
    justify-content: center;
  }

  /* Horizontal orientations: source and target side-by-side */
  .qti-match-layout.qti-match-source-left,
  .qti-match-layout.qti-match-source-right {
    flex-direction: row;
  }

  .qti-match-layout.qti-match-source-right {
    flex-direction: row-reverse;
  }

  /* Vertical orientations: source and target stacked */
  .qti-match-layout.qti-match-source-top,
  .qti-match-layout.qti-match-source-bottom {
    flex-direction: column;
  }

  .qti-match-layout.qti-match-source-bottom {
    flex-direction: column-reverse;
  }

  /* Visual separation for vertical layouts - divider between sets */
  .qti-match-layout.qti-match-source-top > .qti-match-set--target,
  .qti-match-layout.qti-match-source-bottom > .qti-match-set--source {
    padding-top: 1.5em;
    border-top: 1px solid #ccc;
  }

  /* Mobile: force vertical stack regardless of orientation preference */
  @media (max-width: 600px) {
    .qti-match-layout.qti-match-source-left,
    .qti-match-layout.qti-match-source-right,
    .qti-match-layout.qti-match-source-top,
    .qti-match-layout.qti-match-source-bottom {
      flex-direction: column;
      gap: 1.5em;
    }

    .qti-match-set {
      min-width: unset;
      width: 100%;
    }

    /* Divider on second set (target comes after source in DOM) */
    .qti-match-set--target {
      padding-top: 1.5em;
      border-top: 1px solid #ccc;
    }
  }

  .qti-match-set {
    display: flex;
    flex-direction: column;
    gap: 1em;
    min-width: 200px;
  }

  .qti-match-set-label {
    font-weight: 500;
    font-size: 0.875em;
    color: #666;
    margin-bottom: 0.25em;
  }

  .qti-match-choice-wrapper {
    display: flex;
    flex-direction: column;
  }

  .qti-match-choice {
    display: flex;
    flex-direction: column;
    padding: 0.5em 0.75em;
    border: 2px solid var(--cutie-primary);
    border-radius: 4px;
    background-color: #fff;
    color: #333;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .qti-match-choice:hover {
    background-color: #f5f5f5;
  }

  .qti-match-choice:focus {
    outline: 3px solid var(--cutie-primary);
    outline-offset: 2px;
  }

  .qti-match-choice--selected {
    background-color: #ebebeb;
    border-color: var(--cutie-primary);
    color: #333;
  }

  .qti-match-choice--drop-target {
    border: 2px dashed var(--cutie-primary);
    background-color: #f5f5f5;
    color: #333;
  }

  .qti-match-choice--drag-over {
    border: 2px dashed var(--cutie-primary);
    background-color: #ebebeb;
    color: #333;
    transform: scale(1.02);
  }

  .qti-match-choice--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .qti-match-choice--exhausted {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }

  .qti-match-choice--exhausted:hover {
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }

  .qti-match-choice[aria-disabled="true"] {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f5f5f5;
  }

  .qti-match-choice-label {
    font-weight: 600;
  }

  .qti-match-choice-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375em;
    margin-top: 0.5em;
  }

  .qti-match-choice-chips:empty {
    display: none;
  }

  .qti-match-chip {
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

  .qti-match-chip:hover {
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .qti-match-chip:focus {
    outline: 2px solid var(--cutie-primary);
    outline-offset: 1px;
  }

  .qti-match-chip--selected {
    background-color: var(--cutie-primary);
    border-color: var(--cutie-primary);
    color: #fff;
  }

  .qti-match-chip--dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .qti-match-interaction--disabled .qti-match-choice {
    cursor: default;
    opacity: 0.8;
  }

  .qti-match-interaction--disabled .qti-match-choice:hover {
    background-color: #fff;
    border-color: var(--cutie-primary);
  }

  .qti-match-interaction--disabled .qti-match-choice:focus {
    outline: none;
  }

  .qti-match-interaction--disabled .qti-match-chip {
    cursor: default;
  }

  .qti-match-interaction--disabled .qti-match-chip:hover {
    box-shadow: none;
  }

`;
