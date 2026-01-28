import type { Path } from 'slate';
import type { Editor } from 'slate';
import { useStyle } from '../hooks/useStyle';
import { ChoicePropertiesPanel } from '../interactions/choice/PropertiesPanel';
import { TextEntryPropertiesPanel } from '../interactions/textEntry/PropertiesPanel';
import { ExtendedTextPropertiesPanel } from '../interactions/extendedText/PropertiesPanel';
import type { SlateElement, ElementAttributes } from '../types';

interface PropertiesPanelProps {
  editor: Editor;
  selectedElement: SlateElement | null;
  selectedPath: Path | null;
  onUpdateAttributes: (path: Path, attributes: ElementAttributes) => void;
}

/**
 * Main properties panel component that routes to interaction-specific editors
 */
export function PropertiesPanel({
  editor,
  selectedElement,
  selectedPath,
  onUpdateAttributes,
}: PropertiesPanelProps): React.JSX.Element {
  useStyle('properties-panel', PROPERTIES_PANEL_STYLES);

  if (!selectedElement || !selectedPath) {
    return (
      <div className="properties-panel">
        <div className="properties-panel-empty">
          Select an interaction to edit its properties
        </div>
      </div>
    );
  }

  // Render appropriate editor based on interaction type
  let content: React.JSX.Element | null = null;

  switch (selectedElement.type) {
    case 'qti-text-entry-interaction':
      content = (
        <TextEntryPropertiesPanel
          element={selectedElement}
          path={selectedPath}
          onUpdate={onUpdateAttributes}
        />
      );
      break;

    case 'qti-extended-text-interaction':
      content = (
        <ExtendedTextPropertiesPanel
          element={selectedElement}
          path={selectedPath}
          onUpdate={onUpdateAttributes}
        />
      );
      break;

    case 'qti-choice-interaction':
      content = (
        <ChoicePropertiesPanel
          editor={editor}
          element={selectedElement}
          path={selectedPath}
          onUpdate={onUpdateAttributes}
        />
      );
      break;

    default:
      // Non-interaction element selected
      content = (
        <div className="properties-panel-empty">
          Select an interaction to edit its properties
        </div>
      );
  }

  return <div className="properties-panel">{content}</div>;
}

const PROPERTIES_PANEL_STYLES = `
  .properties-panel {
    width: 280px;
    min-width: 280px;
    border-left: 1px solid #ddd;
    padding: 16px;
    background: #fafafa;
    overflow-y: auto;
    height: 100%;
  }

  .properties-panel-empty {
    color: #666;
    font-size: 14px;
    text-align: center;
    padding: 32px 16px;
    line-height: 1.5;
  }
`;
