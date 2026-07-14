const FEEDBACK_TYPES = ['correct', 'incorrect', 'info'] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

// SVG paths from Material Symbols. viewBox is tracked per icon so
// each path renders in its own coordinate system. The 24-grid icons are
// inset by 0.75 units per side so their ink fills the same share of the
// box as the 960-grid info icon.
const ICON_CONFIG: Record<
  FeedbackType,
  { path: string; viewBox: string; label: string }
> = {
  correct: {
    path: 'M9.55006 15.15L18.0251 6.675C18.2251 6.475 18.4584 6.375 18.7251 6.375C18.9917 6.375 19.2251 6.475 19.4251 6.675C19.6251 6.875 19.7251 7.11267 19.7251 7.388C19.7251 7.66333 19.6251 7.90067 19.4251 8.1L10.2501 17.3C10.0501 17.5 9.81673 17.6 9.55006 17.6C9.28339 17.6 9.05006 17.5 8.85006 17.3L4.55006 13C4.35006 12.8 4.25406 12.5627 4.26206 12.288C4.27006 12.0133 4.37439 11.7757 4.57506 11.575C4.77572 11.3743 5.01339 11.2743 5.28806 11.275C5.56272 11.2757 5.80006 11.3757 6.00006 11.575L9.55006 15.15Z',
    viewBox: '0.75 0.75 22.5 22.5',
    label: 'Correct:',
  },
  incorrect: {
    path: 'M12 13.4L7.10005 18.3C6.91672 18.4834 6.68338 18.575 6.40005 18.575C6.11672 18.575 5.88338 18.4834 5.70005 18.3C5.51672 18.1167 5.42505 17.8834 5.42505 17.6C5.42505 17.3167 5.51672 17.0834 5.70005 16.9L10.6 12L5.70005 7.10005C5.51672 6.91672 5.42505 6.68338 5.42505 6.40005C5.42505 6.11672 5.51672 5.88338 5.70005 5.70005C5.88338 5.51672 6.11672 5.42505 6.40005 5.42505C6.68338 5.42505 6.91672 5.51672 7.10005 5.70005L12 10.6L16.9 5.70005C17.0834 5.51672 17.3167 5.42505 17.6 5.42505C17.8834 5.42505 18.1167 5.51672 18.3 5.70005C18.4834 5.88338 18.575 6.11672 18.575 6.40005C18.575 6.68338 18.4834 6.91672 18.3 7.10005L13.4 12L18.3 16.9C18.4834 17.0834 18.575 17.3167 18.575 17.6C18.575 17.8834 18.4834 18.1167 18.3 18.3C18.1167 18.4834 17.8834 18.575 17.6 18.575C17.3167 18.575 17.0834 18.4834 16.9 18.3L12 13.4Z',
    viewBox: '0.75 0.75 22.5 22.5',
    label: 'Incorrect:',
  },
  info: {
    path: 'M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
    viewBox: '0 -960 960 960',
    label: 'Information:',
  },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createFeedbackIcon(type: FeedbackType): HTMLSpanElement {
  const config = ICON_CONFIG[type];

  const wrapper = document.createElement('span');
  wrapper.className = `cutie-feedback-icon cutie-feedback-icon--${type}`;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'cutie-feedback-icon__svg');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('viewBox', config.viewBox);

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

  .cutie-feedback-icon--correct {
    color: var(--cutie-feedback-correct);
  }

  .cutie-feedback-icon--incorrect {
    color: var(--cutie-feedback-incorrect);
  }

  .cutie-feedback-icon--info {
    color: var(--cutie-feedback-info);
  }

  .cutie-feedback-icon__svg {
    width: 1em;
    height: 1em;
    transform: translateY(0.06em);
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
