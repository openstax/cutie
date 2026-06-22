"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapEntryList = MapEntryList;
const jsx_runtime_1 = require("react/jsx-runtime");
const useStyle_1 = require("../../hooks/useStyle");
/**
 * Extensible component for editing map entries.
 * Uses a slot pattern (responseDisplay render prop) to allow customization
 * of how response keys are displayed/edited for different interaction types.
 */
function MapEntryList({ entries, onEntriesChange, responseDisplay, onAddEntry, addButtonLabel = 'Add entry', }) {
    (0, useStyle_1.useStyle)('map-entry-list', MAP_ENTRY_LIST_STYLES);
    const handleResponseChange = (index, mapKey) => {
        const newEntries = [...entries];
        newEntries[index] = { ...newEntries[index], mapKey };
        onEntriesChange(newEntries);
    };
    const handlePointsChange = (index, value) => {
        const mappedValue = parseFloat(value);
        const newEntries = [...entries];
        newEntries[index] = {
            ...newEntries[index],
            mappedValue: isNaN(mappedValue) ? 0 : mappedValue,
        };
        onEntriesChange(newEntries);
    };
    const handleRemoveEntry = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        onEntriesChange(newEntries);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "map-entry-list", children: [entries.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "map-entry-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "map-entry-header-response", children: "Response" }), (0, jsx_runtime_1.jsx)("span", { className: "map-entry-header-points", children: "Points" }), (0, jsx_runtime_1.jsx)("span", { className: "map-entry-header-action" })] })), entries.map((entry, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "map-entry-row", children: [(0, jsx_runtime_1.jsx)("div", { className: "map-entry-response", children: responseDisplay(entry.mapKey, (value) => handleResponseChange(index, value), index) }), (0, jsx_runtime_1.jsx)("div", { className: "map-entry-points", children: (0, jsx_runtime_1.jsx)("input", { type: "number", step: "any", className: "map-entry-points-input", value: entry.mappedValue, onChange: (e) => handlePointsChange(index, e.target.value) }) }), (0, jsx_runtime_1.jsx)("div", { className: "map-entry-action", children: (0, jsx_runtime_1.jsx)("button", { type: "button", className: "map-entry-remove-btn", onClick: () => handleRemoveEntry(index), title: "Remove entry", children: "\u00D7" }) })] }, index))), (0, jsx_runtime_1.jsxs)("button", { type: "button", className: "map-entry-add-btn", onClick: onAddEntry, children: ["+ ", addButtonLabel] })] }));
}
const MAP_ENTRY_LIST_STYLES = `
  .map-entry-list {
    margin-top: 12px;
  }

  .map-entry-header {
    display: grid;
    grid-template-columns: 1fr 80px 32px;
    gap: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 8px;
  }

  .map-entry-header span {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .map-entry-header-action {
    /* Empty column for remove button alignment */
  }

  .map-entry-row {
    display: grid;
    grid-template-columns: 1fr 80px 32px;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .map-entry-response select,
  .map-entry-response input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .map-entry-response select:focus,
  .map-entry-response input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .map-entry-points-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
    text-align: right;
  }

  .map-entry-points-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .map-entry-remove-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, color 0.15s;
  }

  .map-entry-remove-btn:hover {
    background-color: #ffebee;
    color: #d32f2f;
  }

  .map-entry-add-btn {
    width: 100%;
    padding: 8px;
    border: 1px dashed #ccc;
    border-radius: 4px;
    background: transparent;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    margin-top: 4px;
  }

  .map-entry-add-btn:hover {
    background-color: #f5f5f5;
    border-color: #2196f3;
    color: #2196f3;
  }
`;
