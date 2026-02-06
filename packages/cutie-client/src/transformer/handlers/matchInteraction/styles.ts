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
    border: 2px solid #1976d2;
    border-radius: 4px;
    background-color: #fff;
    color: #333;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s, background-color 0.2s;
  }

  .qti-match-choice:hover {
    background-color: #e3f2fd;
    border-color: #1565c0;
  }

  .qti-match-choice:focus {
    outline: 3px solid #2196f3;
    outline-offset: 2px;
  }

  .qti-match-choice--selected {
    background-color: #bbdefb;
    border-color: #0d47a1;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
  }

  .qti-match-choice--drop-target {
    border: 2px dashed #1976d2;
    background-color: #e3f2fd;
  }

  .qti-match-choice--drag-over {
    border: 2px dashed #0d47a1;
    background-color: #bbdefb;
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
    font-weight: 500;
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
    font-family: inherit;
    background-color: transparent;
    border: 1.5px solid #1976d2;
    border-radius: 14px;
    color: #1976d2;
    cursor: grab;
    transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .qti-match-chip:hover {
    background-color: #e3f2fd;
    border-color: #1565c0;
  }

  .qti-match-chip:focus {
    outline: 2px solid #2196f3;
    outline-offset: 1px;
  }

  .qti-match-chip--selected {
    background-color: #bbdefb;
    border-color: #0d47a1;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
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
    border-color: #1976d2;
  }

  .qti-match-interaction--disabled .qti-match-choice:focus {
    outline: none;
  }

  .qti-match-interaction--disabled .qti-match-chip {
    cursor: default;
  }

  .qti-match-interaction--disabled .qti-match-chip:hover {
    background-color: transparent;
    border-color: #1976d2;
  }

  .qti-match-live {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`;
