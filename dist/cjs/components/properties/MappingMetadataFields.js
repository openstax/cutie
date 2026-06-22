"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingMetadataFields = MappingMetadataFields;
const jsx_runtime_1 = require("react/jsx-runtime");
const useStyle_1 = require("../../hooks/useStyle");
/**
 * Reusable component for editing mapping metadata:
 * - Default Value (required)
 * - Lower Bound (optional)
 * - Upper Bound (optional)
 */
function MappingMetadataFields({ metadata, onChange, }) {
    var _a, _b;
    (0, useStyle_1.useStyle)('mapping-metadata-fields', MAPPING_METADATA_STYLES);
    const handleDefaultValueChange = (value) => {
        const numValue = parseFloat(value);
        onChange({
            ...metadata,
            defaultValue: isNaN(numValue) ? 0 : numValue,
        });
    };
    const handleLowerBoundChange = (value) => {
        onChange({
            ...metadata,
            lowerBound: value === '' ? undefined : parseFloat(value),
        });
    };
    const handleUpperBoundChange = (value) => {
        onChange({
            ...metadata,
            upperBound: value === '' ? undefined : parseFloat(value),
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mapping-metadata-fields", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mapping-metadata-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "mapping-metadata-label", children: "Default Value" }), (0, jsx_runtime_1.jsx)("input", { type: "number", step: "any", className: "mapping-metadata-input", value: metadata.defaultValue, onChange: (e) => handleDefaultValueChange(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mapping-metadata-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "mapping-metadata-label", children: "Lower Bound" }), (0, jsx_runtime_1.jsx)("input", { type: "number", step: "any", className: "mapping-metadata-input", value: (_a = metadata.lowerBound) !== null && _a !== void 0 ? _a : '', onChange: (e) => handleLowerBoundChange(e.target.value), placeholder: "Optional" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mapping-metadata-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "mapping-metadata-label", children: "Upper Bound" }), (0, jsx_runtime_1.jsx)("input", { type: "number", step: "any", className: "mapping-metadata-input", value: (_b = metadata.upperBound) !== null && _b !== void 0 ? _b : '', onChange: (e) => handleUpperBoundChange(e.target.value), placeholder: "Optional" })] })] }));
}
const MAPPING_METADATA_STYLES = `
  .mapping-metadata-fields {
    margin-bottom: 16px;
  }

  .mapping-metadata-field {
    margin-bottom: 12px;
  }

  .mapping-metadata-field:last-child {
    margin-bottom: 0;
  }

  .mapping-metadata-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }

  .mapping-metadata-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .mapping-metadata-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .mapping-metadata-input::placeholder {
    color: #999;
  }
`;
