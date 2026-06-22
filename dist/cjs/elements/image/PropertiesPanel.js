"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePropertiesPanel = ImagePropertiesPanel;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const PropertyField_1 = require("../../components/properties/PropertyField");
const AssetContext_1 = require("../../contexts/AssetContext");
/**
 * Properties panel for editing image attributes
 */
function ImagePropertiesPanel({ element, path, onUpdate, }) {
    const attrs = element.attributes;
    const { uploadAsset } = (0, AssetContext_1.useAssetHandlers)();
    const fileInputRef = (0, react_1.useRef)(null);
    const [isUploading, setIsUploading] = (0, react_1.useState)(false);
    const handleAttributeChange = (key, value) => {
        const newAttrs = { ...attrs };
        if (value === '') {
            if (key !== 'src') {
                delete newAttrs[key];
            }
        }
        else {
            newAttrs[key] = value;
        }
        onUpdate(path, newAttrs);
    };
    const handleFileChange = async (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file || !uploadAsset)
            return;
        setIsUploading(true);
        try {
            const newSrc = await uploadAsset(file);
            onUpdate(path, { ...attrs, src: newSrc });
        }
        finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "property-editor", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Image" }), uploadAsset && ((0, jsx_runtime_1.jsxs)("div", { className: "property-field", children: [(0, jsx_runtime_1.jsx)("label", { className: "property-label", children: "Replace Image" }), (0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileChange, disabled: isUploading, className: "property-input", style: { padding: '6px' } }), isUploading && ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: '12px', color: '#666', marginTop: '4px' }, children: "Uploading..." }))] })), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Alt Text", value: attrs.alt || '', onChange: (val) => handleAttributeChange('alt', val), placeholder: "Description for accessibility" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Width", value: attrs.width || '', onChange: (val) => handleAttributeChange('width', val), placeholder: "e.g., 200 or 50%" }), (0, jsx_runtime_1.jsx)(PropertyField_1.PropertyField, { label: "Height", value: attrs.height || '', onChange: (val) => handleAttributeChange('height', val), placeholder: "e.g., 150 or auto" })] }));
}
