import type { Path } from 'slate';
import { useSlate } from 'slate-react';
import { AddIcon, DeleteIcon } from '../../components/icons.js';
import { useStyle } from '../../hooks/useStyle.js';
import type { MatchGroup, QtiGapMatchInteraction } from '../../types.js';
import {
  generateMatchGroupId,
  getMatchGroups,
  parseMatchGroupAttribute,
  removeMatchGroup,
  setMatchGroups,
} from './matchGroups.js';

interface MatchGroupsSectionProps {
  element: QtiGapMatchInteraction;
  path: Path;
}

/**
 * Interaction-level list of match-groups: add or remove a group and set the
 * heading shown over its word bank
 */
export function MatchGroupsSection({ element, path }: MatchGroupsSectionProps): React.JSX.Element {
  const editor = useSlate();
  useStyle('match-groups-section', MATCH_GROUPS_STYLES);
  const groups = getMatchGroups(element);

  const handleHeadingChange = (identifier: string, heading: string) => {
    setMatchGroups(
      editor,
      path,
      groups.map((group) => (group.identifier === identifier ? { ...group, heading } : group))
    );
  };

  const handleAdd = () => {
    setMatchGroups(editor, path, [...groups, { identifier: generateMatchGroupId(groups), heading: '' }]);
  };

  return (
    <div className="match-groups-section">
      <h4 className="match-groups-title">Match groups</h4>
      <p className="match-groups-help">
        Limit which choices fit which gaps. Each group gets its own word bank; assign groups to
        choices and gaps in their properties.
      </p>

      {groups.map((group) => (
        <div key={group.identifier} className="match-group-row">
          <label className="match-group-label" htmlFor={`match-group-${group.identifier}`}>
            Heading for {group.identifier}
          </label>
          <div className="match-group-controls">
            <input
              id={`match-group-${group.identifier}`}
              type="text"
              value={group.heading}
              onChange={(e) => handleHeadingChange(group.identifier, e.target.value)}
              className="property-input"
              placeholder="Word bank heading (optional)"
            />
            <button
              type="button"
              className="match-group-delete-btn"
              onClick={() => removeMatchGroup(editor, path, group.identifier)}
              title={`Delete ${group.identifier}`}
              aria-label={`Delete ${group.identifier}`}
            >
              <DeleteIcon size={16} />
            </button>
          </div>
        </div>
      ))}

      <button type="button" className="match-group-add-btn" onClick={handleAdd}>
        <AddIcon size={16} />
        <span>Add match group</span>
      </button>
    </div>
  );
}

interface MatchGroupSelectProps {
  groups: MatchGroup[];
  value: string | undefined;
  onChange: (value: string) => void;
}

/**
 * Picks the match-group for a choice or gap. An empty value means no group.
 */
export function MatchGroupSelect({ groups, value, onChange }: MatchGroupSelectProps): React.JSX.Element {
  const current = value ?? '';
  // Keep a value the list can't express (several groups, or an unknown one)
  // selectable so viewing the panel doesn't change it
  const isListed =
    current === '' ||
    (parseMatchGroupAttribute(current).length === 1 && groups.some((group) => group.identifier === current));

  return (
    <div className="property-field">
      <label className="property-label">
        Match group
        <select value={current} onChange={(e) => onChange(e.target.value)} className="property-select">
          <option value="">None</option>
          {groups.map((group) => (
            <option key={group.identifier} value={group.identifier}>
              {group.heading ? `${group.heading} (${group.identifier})` : group.identifier}
            </option>
          ))}
          {!isListed && <option value={current}>{current}</option>}
        </select>
      </label>
    </div>
  );
}

const MATCH_GROUPS_STYLES = `
  .match-groups-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }

  .match-groups-title {
    margin: 0 0 4px 0;
    font-size: 13px;
  }

  .match-groups-help {
    margin: 0 0 12px 0;
    font-size: 12px;
    color: #666;
  }

  .match-group-row {
    margin-bottom: 12px;
  }

  .match-group-label {
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .match-group-controls {
    display: flex;
    gap: 4px;
  }

  .match-group-controls .property-input {
    flex: 1;
    min-width: 0;
  }

  .match-group-delete-btn,
  .match-group-add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    color: #555;
    cursor: pointer;
    font-size: 13px;
  }

  .match-group-delete-btn:hover {
    background-color: #ffebee;
    border-color: #ef9a9a;
    color: #c62828;
  }

  .match-group-add-btn:hover {
    background-color: #e8f5e9;
    border-color: #a5d6a7;
    color: #2e7d32;
  }
`;
