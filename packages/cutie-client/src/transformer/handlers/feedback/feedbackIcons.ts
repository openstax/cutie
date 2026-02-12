const FEEDBACK_TYPES = ['correct', 'incorrect', 'info'] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

// SVG paths from Material Symbols Outlined (viewBox="0 -960 960 960")
// check and close paths match packages/cutie-editor/src/components/icons.tsx
const ICON_CONFIG: Record<FeedbackType, { path: string; color: string; label: string }> = {
  correct: {
    path: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z',
    color: '#22c55e',
    label: 'Correct:',
  },
  incorrect: {
    path: 'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
    color: '#ef4444',
    label: 'Incorrect:',
  },
  info: {
    path: 'M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
    color: '#4a90e2',
    label: 'Information:',
  },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createFeedbackIcon(type: FeedbackType): HTMLSpanElement {
  const config = ICON_CONFIG[type];

  const wrapper = document.createElement('span');
  wrapper.className = 'cutie-feedback-icon';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cutie-feedback-icon__svg');
  svg.setAttribute('fill', config.color);
  svg.setAttribute('viewBox', '0 -960 960 960');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', config.path);
  svg.appendChild(path);

  const srText = document.createElement('span');
  srText.className = 'cutie-feedback-sr-text';
  srText.textContent = config.label;

  wrapper.appendChild(svg);
  wrapper.appendChild(srText);

  return wrapper;
}

export const FEEDBACK_ICON_STYLES = `
  .cutie-feedback-icon {
    display: inline-flex;
    align-items: center;
  }

  .cutie-feedback-icon__svg {
    width: 1em;
    height: 1em;
  }

  .cutie-feedback-sr-text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
