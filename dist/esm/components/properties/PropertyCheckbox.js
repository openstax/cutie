import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStyle } from '../../hooks/useStyle';
/**
 * Reusable checkbox component for property editing
 */
export function PropertyCheckbox({ label, checked, onChange, }) {
    useStyle('property-checkbox', PROPERTY_CHECKBOX_STYLES);
    return (_jsx("div", { className: "property-checkbox", children: _jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => onChange(e.target.checked), className: "checkbox-input" }), _jsx("span", { className: "checkbox-text", children: label })] }) }));
}
const PROPERTY_CHECKBOX_STYLES = `
  .property-checkbox {
    margin-bottom: 16px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #333;
  }

  .checkbox-input {
    margin-right: 8px;
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .checkbox-text {
    user-select: none;
  }

  .checkbox-label:hover .checkbox-text {
    color: #2196f3;
  }
`;
