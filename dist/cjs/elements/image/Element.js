"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageElement = ImageElement;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const slate_react_1 = require("slate-react");
const AssetContext_1 = require("../../contexts/AssetContext");
/**
 * Render an image element with asset resolution.
 * Edit UI is provided by the ImagePropertiesPanel.
 */
function ImageElement({ attributes, children, element, }) {
    const el = element;
    const { resolveAsset } = (0, AssetContext_1.useAssetHandlers)();
    const selected = (0, slate_react_1.useSelected)();
    const focused = (0, slate_react_1.useFocused)();
    const [resolvedSrc, setResolvedSrc] = (0, react_1.useState)(el.attributes.src);
    // Resolve URL asynchronously when src changes
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        if (resolveAsset) {
            resolveAsset(el.attributes.src).then((resolved) => {
                if (!cancelled) {
                    setResolvedSrc(resolved);
                }
            });
        }
        else {
            setResolvedSrc(el.attributes.src);
        }
        return () => {
            cancelled = true;
        };
    }, [el.attributes.src, resolveAsset]);
    return ((0, jsx_runtime_1.jsxs)("span", { ...attributes, style: { display: 'inline-block' }, children: [(0, jsx_runtime_1.jsx)("span", { contentEditable: false, style: { display: 'inline-block' }, children: (0, jsx_runtime_1.jsx)("img", { src: resolvedSrc, alt: el.attributes.alt, style: {
                        maxWidth: '100%',
                        display: 'block',
                        boxShadow: selected && focused ? '0 0 0 2px #1976d2' : undefined,
                    } }) }), children] }));
}
