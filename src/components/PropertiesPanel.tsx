import type { Path } from 'slate';
import { useStyle } from '../hooks/useStyle';
import { choicePropertiesPanels } from '../interactions/choice';
import { textEntryPropertiesPanels } from '../interactions/textEntry';
import { extendedTextPropertiesPanels } from '../interactions/extendedText';
import type { SlateElement, ElementAttributes, XmlNode } from '../types';

interface PropertiesPanelProps {
  selectedElement: SlateElement | null;
  selectedPath: Path | null;
  onUpdateAttributes: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

// Single contact point per interaction: spread all properties panel objects
// Using any for the component type to handle the specific element types
const propertiesPanels: Record<string, React.ComponentType<any>> = {
  ...choicePropertiesPanels,
  ...textEntryPropertiesPanels,
  ...extendedTextPropertiesPanels,
};

/**
 * Main properties panel component that routes to interaction-specific editors
 */
export function PropertiesPanel({
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

  const Panel = propertiesPanels[selectedElement.type];
  if (Panel) {
    return (
      <div className="properties-panel">
        <Panel element={selectedElement} path={selectedPath} onUpdate={onUpdateAttributes} />
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="properties-panel-empty">
        Select an interaction to edit its properties
      </div>
    </div>
  );
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
