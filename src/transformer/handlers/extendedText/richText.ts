import DOMPurify from 'dompurify';
import { createMissingAttributeError } from '../../../errors/errorDisplay';
import { registry } from '../../registry';
import type { ElementHandler, TransformContext } from '../../types';
import { getDefaultValue } from '../responseUtils';
import { loadQuill } from './quillLoader';
import {
  type CharacterCounter,
  createCharacterCounter,
  createConstraintElements,
  createInteractionContainer,
  parseConstraints,
  parseCounterDirection,
  parseExpectedLength,
  processPrompt,
  wireConstraintDescribedBy,
} from './utils';

const QUILL_CSS_URL = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
const QUILL_CSS_ID = 'cutie-quill-snow-css';

/**
 * Strip HTML tags and return plain text content.
 * Used to determine if editor content is empty.
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent ?? '';
}

/**
 * Quill toolbar configuration for rich text editing.
 */
const QUILL_TOOLBAR = [
  ['bold', 'italic', 'underline', 'strike'],
  [{ header: 1 }, { header: 2 }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['clean'],
];

/**
 * Handler for qti-extended-text-interaction with format="xhtml"
 *
 * Renders a Quill rich text editor for XHTML responses.
 * Loads Quill asynchronously to avoid bundling it with the main bundle.
 *
 * Response value is stored as HTML (not XHTML).
 */
class RichTextInteractionHandler implements ElementHandler {
  canHandle(element: Element): boolean {
    if (element.tagName.toLowerCase() !== 'qti-extended-text-interaction') {
      return false;
    }
    return element.getAttribute('format') === 'xhtml';
  }

  transform(element: Element, context: TransformContext): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const responseIdentifier = element.getAttribute('response-identifier');
    if (!responseIdentifier) {
      console.error('qti-extended-text-interaction missing required response-identifier attribute');
      fragment.appendChild(
        createMissingAttributeError('qti-extended-text-interaction', 'response-identifier')
      );
      return fragment;
    }

    // Register styles once
    if (context.styleManager && !context.styleManager.hasStyle('cutie-rich-text-interaction')) {
      context.styleManager.addStyle('cutie-rich-text-interaction', RICH_TEXT_INTERACTION_STYLES);
    }

    // Create container for the interaction
    const container = createInteractionContainer(element, 'cutie-rich-text-interaction', responseIdentifier);

    // Process qti-prompt if present
    const prompt = processPrompt(element, responseIdentifier, context);
    if (prompt) {
      container.appendChild(prompt.element);
    }

    // Create editor wrapper + loading placeholder
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'cutie-rich-text-wrapper';

    const loadingPlaceholder = document.createElement('div');
    loadingPlaceholder.className = 'cutie-rich-text-loading';
    loadingPlaceholder.textContent = 'Loading rich text editor...';
    editorWrapper.appendChild(loadingPlaceholder);

    container.appendChild(editorWrapper);

    // Parse constraints — skip pattern-mask for xhtml (regex on HTML is meaningless)
    const constraints = parseConstraints(element);

    // Character counter
    // data-max-characters forces the counter on (defaulting to 'down'),
    // otherwise expected-length + a counter direction class is required.
    const expectedLength = parseExpectedLength(element);
    const counterDirection = parseCounterDirection(element);
    const minCharacters = constraints.minCharacters;
    const maxCharacters = constraints.maxCharacters;
    const counterTarget = maxCharacters ?? expectedLength;
    const isHardLimit = maxCharacters !== null;
    const effectiveDirection = counterDirection ?? (isHardLimit ? 'down' : null);

    let counter: CharacterCounter | null = null;
    if (counterTarget !== null && effectiveDirection !== null) {
      counter = createCharacterCounter(
        counterTarget, effectiveDirection, responseIdentifier, context.styleManager, isHardLimit,
      );
      container.appendChild(counter.element);
    }
    const needsConstraint = constraints.minStrings > 0 || minCharacters !== null || maxCharacters !== null;
    const constraintResult = needsConstraint
      ? createConstraintElements(
          { minStrings: constraints.minStrings, patternMask: null, patternMessage: null, minCharacters, maxCharacters },
          responseIdentifier,
          context.styleManager,
        )
      : null;

    if (constraintResult) {
      container.appendChild(constraintResult.constraint.element);
    }

    fragment.appendChild(container);

    // Get default value
    const defaultValue = getDefaultValue(element.ownerDocument, responseIdentifier);
    const initialHtml = typeof defaultValue === 'string' ? defaultValue : '';

    // Track current HTML value for response accessor
    let currentHtml = initialHtml;

    // Track active editor root for aria wiring
    let activeEditorRoot: HTMLElement | null = null;

    // Validate constraints and update error UI. Returns true when valid.
    // Defined outside the itemState block so the Quill text-change handler can call it.
    const validate = (): boolean => {
      const textContent = stripHtml(currentHtml).trim();

      // Min-strings check: empty input when required
      if (constraints.minStrings > 0 && textContent.length === 0) {
        activeEditorRoot?.setAttribute('aria-invalid', 'true');
        if (constraintResult?.minStringsText) {
          constraintResult.constraint.setText(constraintResult.minStringsText);
        }
        constraintResult?.constraint.setError(true);
        return false;
      }

      // Min-characters check: too short (includes empty — implies required)
      if (minCharacters !== null && textContent.length < minCharacters) {
        activeEditorRoot?.setAttribute('aria-invalid', 'true');
        if (constraintResult?.minCharactersText) {
          constraintResult.constraint.setText(constraintResult.minCharactersText);
        }
        constraintResult?.constraint.setError(true);
        return false;
      }

      // Max-characters check: hard character limit exceeded
      if (maxCharacters !== null && textContent.length > maxCharacters) {
        activeEditorRoot?.setAttribute('aria-invalid', 'true');
        if (constraintResult?.maxCharactersText) {
          constraintResult.constraint.setText(constraintResult.maxCharactersText);
        }
        constraintResult?.constraint.setError(true);
        return false;
      }

      activeEditorRoot?.removeAttribute('aria-invalid');
      if (constraintResult) {
        constraintResult.constraint.setError(false);
        constraintResult.constraint.setText(constraintResult.initialText);
      }
      return true;
    };

    // Register response accessor before async load
    if (context.itemState) {
      context.itemState.registerResponse(responseIdentifier, () => {
        const isEmpty = stripHtml(currentHtml).trim().length === 0;
        const valid = validate();
        return { value: isEmpty ? null : currentHtml, valid };
      });
    }

    // Read expected-lines for min-height
    const expectedLines = element.getAttribute('expected-lines');

    // Load Quill asynchronously
    loadQuill()
      .then((quillModule) => {
        const Quill = quillModule.default;

        loadingPlaceholder.remove();

        // Inject Quill snow CSS if not already present
        if (!document.getElementById(QUILL_CSS_ID)) {
          const link = document.createElement('link');
          link.id = QUILL_CSS_ID;
          link.rel = 'stylesheet';
          link.href = QUILL_CSS_URL;
          document.head.appendChild(link);
        }

        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'cutie-rich-text-editor';
        editorWrapper.appendChild(editorContainer);

        // Instantiate Quill
        const quill = new Quill(editorContainer, {
          theme: 'snow',
          modules: { toolbar: QUILL_TOOLBAR },
        });

        // Set default value (sanitize before inserting)
        if (initialHtml) {
          quill.clipboard.dangerouslyPasteHTML(DOMPurify.sanitize(initialHtml));
          currentHtml = quill.root.innerHTML;
        }

        // Listen for text changes (sanitize output for defense in depth)
        quill.on('text-change', () => {
          currentHtml = DOMPurify.sanitize(quill.root.innerHTML);
        });

        // Wire counter to text-change events
        if (counter) {
          counter.update(stripHtml(quill.root.innerHTML).length);
          quill.on('text-change', () => {
            counter!.update(stripHtml(quill.root.innerHTML).length);
          });
        }

        // Re-validate on text-change so errors clear/update as the user edits
        quill.on('text-change', () => {
          if (activeEditorRoot?.hasAttribute('aria-invalid')) {
            validate();
          }
        });

        // Wire up aria attributes on the editor root
        activeEditorRoot = quill.root;
        if (prompt) {
          quill.root.setAttribute('aria-labelledby', prompt.id);
        } else {
          quill.root.setAttribute('aria-label', 'Rich text response input');
        }

        // Wire up constraint aria-describedby
        if (constraintResult) {
          wireConstraintDescribedBy(quill.root, constraintResult.constraint.element);
        }

        // Apply expected-lines min-height to .ql-editor
        if (expectedLines) {
          const lines = parseInt(expectedLines, 10);
          if (!isNaN(lines) && lines > 0) {
            quill.root.style.minHeight = `${Math.max(lines * 1.4, 3)}em`;
          }
        }

        // Handle disabled state
        if (context.itemState) {
          const setDisabled = (disabled: boolean) => {
            quill.enable(!disabled);
            if (disabled) {
              container.classList.add('cutie-rich-text-disabled');
            } else {
              container.classList.remove('cutie-rich-text-disabled');
            }
          };

          context.itemState.addObserver((state) => {
            setDisabled(!state.interactionsEnabled);
          });
          setDisabled(!context.itemState.interactionsEnabled);
        }
      })
      .catch((error) => {
        console.error('Failed to load Quill:', error);
        loadingPlaceholder.remove();

        const errorMsg = document.createElement('div');
        errorMsg.className = 'cutie-rich-text-error';
        errorMsg.textContent = 'Rich text editor failed to load. Please check that Quill is installed.';
        editorWrapper.appendChild(errorMsg);
      });

    return fragment;
  }
}

const RICH_TEXT_INTERACTION_STYLES = `
.cutie-rich-text-interaction {
  display: block;
  margin: 8px 0;
}

.cutie-rich-text-interaction .cutie-prompt {
  margin-bottom: 8px;
}

.cutie-rich-text-wrapper {
  width: 100%;
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
  overflow: hidden;
}

.cutie-rich-text-wrapper:focus-within {
  outline: 2px solid var(--cutie-primary);
  outline-offset: 1px;
  border-color: var(--cutie-primary);
}

.cutie-rich-text-interaction .ql-toolbar {
  border: none;
  border-bottom: 1px solid var(--cutie-border);
}

.cutie-rich-text-interaction .ql-container {
  border: none;
  font-size: 1.6rem;
  font-family: inherit;
}

.cutie-rich-text-interaction .ql-editor {
  min-height: 7.5em;
  padding: 8px;
}

.cutie-rich-text-disabled .ql-toolbar {
  opacity: 0.6;
  pointer-events: none;
}

.cutie-rich-text-disabled .ql-container {
  background-color: var(--cutie-bg-alt);
  opacity: 0.6;
}

.cutie-rich-text-loading {
  padding: 12px;
  color: var(--cutie-text-muted);
  font-style: italic;
  background-color: var(--cutie-bg-alt);
  border: 1px solid var(--cutie-border);
  border-radius: 4px;
}

.cutie-rich-text-error {
  color: var(--cutie-feedback-incorrect);
  background-color: var(--cutie-bg-alt);
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.cutie-rich-text-interaction.qti-height-lines-3 .ql-editor { min-height: 4.2em; }
.cutie-rich-text-interaction.qti-height-lines-6 .ql-editor { min-height: 8.4em; }
.cutie-rich-text-interaction.qti-height-lines-15 .ql-editor { min-height: 21em; }
`.trim();

// Register with priority 45 (between formula@40 and plainText@50)
registry.register('rich-text-interaction', new RichTextInteractionHandler(), 45);
