import { Editor, Element, Node, Transforms } from 'slate';
import type { Path } from 'slate';
import { useSlate } from 'slate-react';
import { AddIcon, ArrowDownIcon, ArrowUpIcon, DeleteIcon } from '../../components/icons';
import { MapEntryList } from '../../components/properties/MapEntryList';
import { MappingMetadataFields } from '../../components/properties/MappingMetadataFields';
import { PropertyCheckbox } from '../../components/properties/PropertyCheckbox';
import { PropertyField } from '../../components/properties/PropertyField';
import { ToggleableFormSection } from '../../components/properties/ToggleableFormSection';
import { useStyle } from '../../hooks/useStyle';
import type {
  ElementAttributes,
  QtiGap,
  QtiGapImg,
  QtiGapMatchInteraction,
  QtiGapText,
  XmlNode,
} from '../../types';
import {
  addEmptyMapping,
  getMapping,
  hasMapping,
  removeMapping,
  type MapEntry,
  type MappingMetadata,
  updateMapping,
} from '../../utils/mappingDeclaration';
import {
  getCorrectValues,
  hasCorrectResponse,
  removeCorrectResponse,
  updateIdentifier,
} from '../../utils/responseDeclaration';
import { generateChoiceId, insertGapOrChoiceAtSelection } from './insertion';

interface GapMatchPropertiesPanelProps {
  element: QtiGapMatchInteraction;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes, responseDeclaration?: XmlNode) => void;
}

/**
 * Get choice identifiers from the element
 */
function getChoiceIdentifiers(element: QtiGapMatchInteraction): string[] {
  const choicesContainer = element.children.find(
    (child): child is { type: 'gap-match-choices'; children: Array<QtiGapText | QtiGapImg> } =>
      'type' in child && child.type === 'gap-match-choices'
  );

  if (!choicesContainer) return [];

  return choicesContainer.children
    .filter(
      (child): child is QtiGapText | QtiGapImg =>
        'type' in child && (child.type === 'qti-gap-text' || child.type === 'qti-gap-img')
    )
    .map((choice) => choice.attributes.identifier)
    .filter(Boolean);
}

/**
 * Get gap identifiers from the element's content
 */
function getGapIdentifiers(editor: Editor, path: Path): string[] {
  const gaps: string[] = [];

  for (const [node] of Editor.nodes(editor, {
    at: path,
    match: (n) => Element.isElement(n) && 'type' in n && n.type === 'qti-gap',
  })) {
    if (Element.isElement(node) && 'attributes' in node) {
      const attrs = node.attributes as { identifier?: string };
      if (attrs.identifier) {
        gaps.push(attrs.identifier);
      }
    }
  }

  return gaps;
}

/**
 * Parse directedPair values into a map of gap -> choice
 */
function parseCorrectPairings(correctValues: string[]): Map<string, string> {
  const pairings = new Map<string, string>();
  for (const value of correctValues) {
    const parts = value.split(' ');
    if (parts.length === 2) {
      const [choice, gap] = parts;
      pairings.set(gap, choice);
    }
  }
  return pairings;
}

/**
 * Convert a map of gap -> choice to directedPair values
 */
function pairingsToCorrectValues(pairings: Map<string, string>): string[] {
  return Array.from(pairings.entries()).map(([gap, choice]) => `${choice} ${gap}`);
}

/**
 * Set correct values with directedPair format
 */
function setCorrectPairValues(decl: XmlNode, values: string[]): XmlNode {
  // Remove old correct response
  const otherChildren = decl.children.filter(
    (c): c is XmlNode => typeof c !== 'string' && c.tagName !== 'qti-correct-response'
  );

  if (values.length === 0) {
    return {
      tagName: decl.tagName,
      attributes: { ...decl.attributes },
      children: otherChildren,
    };
  }

  const correctResponse: XmlNode = {
    tagName: 'qti-correct-response',
    attributes: {},
    children: values.map((v) => ({
      tagName: 'qti-value',
      attributes: {},
      children: [v],
    })),
  };

  return {
    tagName: decl.tagName,
    attributes: { ...decl.attributes },
    children: [...otherChildren, correctResponse],
  };
}

/**
 * Add an empty correct response to a declaration
 */
function addEmptyCorrectResponseForGapMatch(decl: XmlNode): XmlNode {
  const cleanDecl = removeCorrectResponse(decl);
  return {
    ...cleanDecl,
    children: [
      ...cleanDecl.children,
      {
        tagName: 'qti-correct-response',
        attributes: {},
        children: [],
      },
    ],
  };
}

/**
 * Properties panel for editing gap-match interaction attributes
 */
export function GapMatchPropertiesPanel({
  element,
  path,
  onUpdate,
}: GapMatchPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  const attrs = element.attributes;
  const responseDecl = element.responseDeclaration;

  const choiceIdentifiers = getChoiceIdentifiers(element);
  const gapIdentifiers = getGapIdentifiers(editor, path);

  const correctValues = getCorrectValues(responseDecl);
  const hasCorrectAnswer = hasCorrectResponse(responseDecl);
  const correctPairings = parseCorrectPairings(correctValues);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'response-identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }

    let updatedDecl = responseDecl;

    // If response-identifier changed, update it in the response declaration too
    if (key === 'response-identifier') {
      updatedDecl = updateIdentifier(updatedDecl, value);
    }

    onUpdate(path, newAttrs, updatedDecl);
  };

  const handleShuffleChange = (checked: boolean) => {
    const newAttrs = { ...attrs };
    if (checked) {
      newAttrs.shuffle = 'true';
    } else {
      delete newAttrs.shuffle;
    }
    onUpdate(path, newAttrs, responseDecl);
  };

  const handleToggleCorrectAnswer = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyCorrectResponseForGapMatch(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeCorrectResponse(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleCorrectPairingChange = (gapId: string, choiceId: string | null) => {
    const newPairings = new Map(correctPairings);
    if (choiceId === null || choiceId === '') {
      newPairings.delete(gapId);
    } else {
      newPairings.set(gapId, choiceId);
    }
    const newValues = pairingsToCorrectValues(newPairings);
    const updatedDecl = setCorrectPairValues(responseDecl, newValues);
    onUpdate(path, attrs, updatedDecl);
  };

  // Mapping data
  const mappingEnabled = hasMapping(responseDecl);
  const mappingData = getMapping(responseDecl);
  const mappingEntries = mappingData?.entries ?? [];
  const mappingMetadata: MappingMetadata = mappingData?.metadata ?? { defaultValue: 0 };

  const handleToggleMapping = (enabled: boolean) => {
    if (enabled) {
      const updatedDecl = addEmptyMapping(responseDecl, -1);
      onUpdate(path, attrs, updatedDecl);
    } else {
      const updatedDecl = removeMapping(responseDecl);
      onUpdate(path, attrs, updatedDecl);
    }
  };

  const handleMappingMetadataChange = (metadata: MappingMetadata) => {
    const updatedDecl = updateMapping(responseDecl, metadata, mappingEntries);
    onUpdate(path, attrs, updatedDecl);
  };

  const handleMappingEntriesChange = (entries: MapEntry[]) => {
    const updatedDecl = updateMapping(responseDecl, mappingMetadata, entries);
    onUpdate(path, attrs, updatedDecl);
  };

  const handleAddMappingEntry = () => {
    // Default to first choice and first gap if available
    const defaultChoice = choiceIdentifiers[0] || '';
    const defaultGap = gapIdentifiers[0] || '';
    const newEntry: MapEntry = {
      mapKey: defaultChoice && defaultGap ? `${defaultChoice} ${defaultGap}` : '',
      mappedValue: 1,
    };
    handleMappingEntriesChange([...mappingEntries, newEntry]);
  };

  const handleAddGapAtCursor = () => {
    insertGapOrChoiceAtSelection(editor);
  };

  return (
    <div className="property-editor">
      <h3>Gap Match Interaction</h3>

      <PropertyField
        label="Response Identifier"
        value={attrs['response-identifier']}
        onChange={(val) => handleAttributeChange('response-identifier', val)}
        required
      />

      <PropertyCheckbox
        label="Shuffle choices"
        checked={attrs.shuffle === 'true'}
        onChange={handleShuffleChange}
      />

      <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAddGapAtCursor}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add gap at cursor
        </button>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
          Position cursor in content, or select text to create a choice.
        </p>
      </div>

      <ToggleableFormSection
        label="Set correct answers"
        enabled={hasCorrectAnswer}
        onToggle={handleToggleCorrectAnswer}
      >
        <fieldset className="radio-fieldset">
          <legend className="radio-fieldset-legend">Correct pairings</legend>

          {gapIdentifiers.length === 0 ? (
            <p className="property-empty-state">Add gaps to set correct answers.</p>
          ) : (
            gapIdentifiers.map((gapId) => (
              <div key={gapId} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                  Gap {gapId} =
                </label>
                <select
                  value={correctPairings.get(gapId) || ''}
                  onChange={(e) =>
                    handleCorrectPairingChange(gapId, e.target.value || null)
                  }
                  className="property-select"
                >
                  <option value="">Select choice...</option>
                  {choiceIdentifiers.map((choiceId) => (
                    <option key={choiceId} value={choiceId}>
                      {choiceId}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </fieldset>
      </ToggleableFormSection>

      <ToggleableFormSection
        label="Response mapping"
        enabled={mappingEnabled}
        onToggle={handleToggleMapping}
      >
        <MappingMetadataFields
          metadata={mappingMetadata}
          onChange={handleMappingMetadataChange}
        />
        <MapEntryList
          entries={mappingEntries}
          onEntriesChange={handleMappingEntriesChange}
          responseDisplay={(response, onChange) => {
            // Parse "CHOICE GAP" format (e.g., "A G1")
            const parts = response.split(' ');
            const currentChoice = parts[0] || '';
            const currentGap = parts[1] || '';

            const handleChoiceChange = (choice: string) => {
              onChange(`${choice} ${currentGap}`.trim());
            };

            const handleGapChange = (gap: string) => {
              onChange(`${currentChoice} ${gap}`.trim());
            };

            return (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <select
                  value={currentChoice}
                  onChange={(e) => handleChoiceChange(e.target.value)}
                  className="property-select"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="">Choice...</option>
                  {choiceIdentifiers.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <span style={{ color: '#666', fontSize: '12px' }}>→</span>
                <select
                  value={currentGap}
                  onChange={(e) => handleGapChange(e.target.value)}
                  className="property-select"
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <option value="">Gap...</option>
                  {gapIdentifiers.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
            );
          }}
          onAddEntry={handleAddMappingEntry}
          addButtonLabel="Add pair mapping"
        />
      </ToggleableFormSection>
    </div>
  );
}

/**
 * Properties panel for gap-text element
 */
interface GapTextPropertiesPanelProps {
  element: QtiGapText;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

export function GapTextPropertiesPanel({
  element,
  path,
  onUpdate,
}: GapTextPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('gap-text-actions', GAP_TEXT_ACTIONS_STYLES);
  const attrs = element.attributes;

  // Get parent choices container and position info
  const parentPath = path.slice(0, -1);
  const myIndex = path[path.length - 1];
  const parent = Node.get(editor, parentPath) as { type: string; children: Array<QtiGapText | QtiGapImg> };

  // Count choices
  const choices = parent.children.filter(
    (c) => 'type' in c && (c.type === 'qti-gap-text' || c.type === 'qti-gap-img')
  );
  const choiceCount = choices.length;
  const isFirstChoice = myIndex === 0;
  const isLastChoice = myIndex === choiceCount - 1;
  const canDelete = choiceCount > 1;

  // Get interaction path for generating new IDs
  const interactionPath = parentPath.slice(0, -1);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  const handleMoveLeft = () => {
    if (isFirstChoice) return;
    Transforms.moveNodes(editor, {
      at: path,
      to: [...parentPath, myIndex - 1],
    });
  };

  const handleMoveRight = () => {
    if (isLastChoice) return;
    Transforms.moveNodes(editor, {
      at: path,
      to: [...parentPath, myIndex + 2],
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    Transforms.removeNodes(editor, { at: path });
  };

  const handleAddChoice = () => {
    const newId = generateChoiceId(editor, interactionPath);
    const newChoice = {
      type: 'qti-gap-text',
      attributes: { identifier: newId, 'match-max': '1' },
      children: [{ text: `Choice ${newId}` }],
    };

    // Insert after current choice
    Transforms.insertNodes(editor, newChoice as any, {
      at: [...parentPath, myIndex + 1],
    });
  };

  return (
    <div className="property-editor">
      <h3>Gap Text Choice</h3>

      <PropertyField
        label="Identifier"
        value={attrs.identifier}
        onChange={(val) => handleAttributeChange('identifier', val)}
        required
      />

      <PropertyField
        label="Match Max"
        type="number"
        value={attrs['match-max'] || '1'}
        onChange={(val) => handleAttributeChange('match-max', val)}
        min="0"
      />

      <PropertyCheckbox
        label="Fixed position"
        checked={attrs.fixed === 'true'}
        onChange={(checked) =>
          handleAttributeChange('fixed', checked ? 'true' : '')
        }
      />

      <div className="gap-text-actions">
        <button
          type="button"
          className="gap-text-action-btn"
          onClick={handleMoveLeft}
          disabled={isFirstChoice}
          title="Move left"
        >
          <ArrowUpIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn"
          onClick={handleMoveRight}
          disabled={isLastChoice}
          title="Move right"
        >
          <ArrowDownIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn gap-text-action-btn-delete"
          onClick={handleDelete}
          disabled={!canDelete}
          title={canDelete ? 'Delete choice' : 'Cannot delete (minimum 1 choice)'}
        >
          <DeleteIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn gap-text-action-btn-add"
          onClick={handleAddChoice}
          title="Add choice"
        >
          <AddIcon size={16} />
        </button>
      </div>
    </div>
  );
}

const GAP_TEXT_ACTIONS_STYLES = `
  .gap-text-actions {
    display: flex;
    gap: 4px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .gap-text-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #555;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }

  .gap-text-action-btn:hover:not(:disabled) {
    background-color: #f5f5f5;
    border-color: #bbb;
    color: #333;
  }

  .gap-text-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .gap-text-action-btn-delete:hover:not(:disabled) {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }

  .gap-text-action-btn-add:hover:not(:disabled) {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
`;

/**
 * Properties panel for gap-img element
 */
interface GapImgPropertiesPanelProps {
  element: QtiGapImg;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

export function GapImgPropertiesPanel({
  element,
  path,
  onUpdate,
}: GapImgPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('gap-text-actions', GAP_TEXT_ACTIONS_STYLES);
  const attrs = element.attributes;

  // Get parent choices container and position info
  const parentPath = path.slice(0, -1);
  const myIndex = path[path.length - 1];
  const parent = Node.get(editor, parentPath) as { type: string; children: Array<QtiGapText | QtiGapImg> };

  // Count choices
  const choices = parent.children.filter(
    (c) => 'type' in c && (c.type === 'qti-gap-text' || c.type === 'qti-gap-img')
  );
  const choiceCount = choices.length;
  const isFirstChoice = myIndex === 0;
  const isLastChoice = myIndex === choiceCount - 1;
  const canDelete = choiceCount > 1;

  // Get interaction path for generating new IDs
  const interactionPath = parentPath.slice(0, -1);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  const handleMoveLeft = () => {
    if (isFirstChoice) return;
    Transforms.moveNodes(editor, {
      at: path,
      to: [...parentPath, myIndex - 1],
    });
  };

  const handleMoveRight = () => {
    if (isLastChoice) return;
    Transforms.moveNodes(editor, {
      at: path,
      to: [...parentPath, myIndex + 2],
    });
  };

  const handleDelete = () => {
    if (!canDelete) return;
    Transforms.removeNodes(editor, { at: path });
  };

  const handleAddChoice = () => {
    const newId = generateChoiceId(editor, interactionPath);
    const newChoice = {
      type: 'qti-gap-text',
      attributes: { identifier: newId, 'match-max': '1' },
      children: [{ text: `Choice ${newId}` }],
    };

    // Insert after current choice
    Transforms.insertNodes(editor, newChoice as any, {
      at: [...parentPath, myIndex + 1],
    });
  };

  return (
    <div className="property-editor">
      <h3>Gap Image Choice</h3>

      <PropertyField
        label="Identifier"
        value={attrs.identifier}
        onChange={(val) => handleAttributeChange('identifier', val)}
        required
      />

      <PropertyField
        label="Match Max"
        type="number"
        value={attrs['match-max'] || '1'}
        onChange={(val) => handleAttributeChange('match-max', val)}
        min="0"
      />

      <PropertyCheckbox
        label="Fixed position"
        checked={attrs.fixed === 'true'}
        onChange={(checked) =>
          handleAttributeChange('fixed', checked ? 'true' : '')
        }
      />

      <div className="gap-text-actions">
        <button
          type="button"
          className="gap-text-action-btn"
          onClick={handleMoveLeft}
          disabled={isFirstChoice}
          title="Move left"
        >
          <ArrowUpIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn"
          onClick={handleMoveRight}
          disabled={isLastChoice}
          title="Move right"
        >
          <ArrowDownIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn gap-text-action-btn-delete"
          onClick={handleDelete}
          disabled={!canDelete}
          title={canDelete ? 'Delete choice' : 'Cannot delete (minimum 1 choice)'}
        >
          <DeleteIcon size={16} />
        </button>
        <button
          type="button"
          className="gap-text-action-btn gap-text-action-btn-add"
          onClick={handleAddChoice}
          title="Add choice"
        >
          <AddIcon size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Properties panel for gap element
 */
interface GapPropertiesPanelProps {
  element: QtiGap;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

export function GapPropertiesPanel({
  element,
  path,
  onUpdate,
}: GapPropertiesPanelProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('gap-panel-actions', GAP_PANEL_ACTIONS_STYLES);
  const attrs = element.attributes;

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'identifier') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  const handleDelete = () => {
    Transforms.removeNodes(editor, { at: path });
  };

  return (
    <div className="property-editor">
      <h3>Gap</h3>

      <PropertyField
        label="Identifier"
        value={attrs.identifier}
        onChange={(val) => handleAttributeChange('identifier', val)}
        required
      />

      <div className="gap-panel-actions">
        <button
          type="button"
          className="gap-panel-delete-btn"
          onClick={handleDelete}
          title="Delete gap"
        >
          <DeleteIcon size={16} />
          <span>Delete gap</span>
        </button>
      </div>
    </div>
  );
}

const GAP_PANEL_ACTIONS_STYLES = `
  .gap-panel-actions {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .gap-panel-delete-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #555;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
  }

  .gap-panel-delete-btn:hover {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }
`;
