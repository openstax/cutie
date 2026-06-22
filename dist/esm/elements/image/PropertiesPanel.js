import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { PropertyField } from '../../components/properties/PropertyField';
import { useAssetHandlers } from '../../contexts/AssetContext';
/**
 * Properties panel for editing image attributes
 */
export function ImagePropertiesPanel({ element, path, onUpdate, }) {
    const attrs = element.attributes;
    const { uploadAsset } = useAssetHandlers();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
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
    return (_jsxs("div", { className: "property-editor", children: [_jsx("h3", { children: "Image" }), uploadAsset && (_jsxs("div", { className: "property-field", children: [_jsx("label", { className: "property-label", children: "Replace Image" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileChange, disabled: isUploading, className: "property-input", style: { padding: '6px' } }), isUploading && (_jsx("div", { style: { fontSize: '12px', color: '#666', marginTop: '4px' }, children: "Uploading..." }))] })), _jsx(PropertyField, { label: "Alt Text", value: attrs.alt || '', onChange: (val) => handleAttributeChange('alt', val), placeholder: "Description for accessibility" }), _jsx(PropertyField, { label: "Width", value: attrs.width || '', onChange: (val) => handleAttributeChange('width', val), placeholder: "e.g., 200 or 50%" }), _jsx(PropertyField, { label: "Height", value: attrs.height || '', onChange: (val) => handleAttributeChange('height', val), placeholder: "e.g., 150 or auto" })] }));
}
