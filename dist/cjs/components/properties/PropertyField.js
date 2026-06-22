"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyField = PropertyField;
const jsx_runtime_1 = require("react/jsx-runtime");
const useStyle_1 = require("../../hooks/useStyle");
/**
 * Reusable input field component for property editing
 */
function PropertyField({ label, value, onChange, type = 'text', required = false, placeholder, min, }) {
    (0, useStyle_1.useStyle)('property-field', PROPERTY_FIELD_STYLES);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsxs)("label", { className: "property-label", children: [label, required && (0, jsx_runtime_1.jsx)("span", { className: "required-indicator", children: "*" })] }), (0, jsx_runtime_1.jsx)("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), className: "property-input", placeholder: placeholder, min: min })] }));
}
const PROPERTY_FIELD_STYLES = `
  .property-field {
    margin-bottom: 16px;
  }

  .property-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }

  .required-indicator {
    color: #d32f2f;
    margin-left: 4px;
  }

  .property-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .property-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .property-input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;
