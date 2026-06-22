"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAssetHandlers = exports.AssetContext = void 0;
const react_1 = require("react");
/**
 * Context for passing asset handlers (resolve/upload) to element renderers.
 * Slate's renderElement callback has a fixed signature, so we use React Context
 * to make asset handlers available to components like ImageElement.
 */
exports.AssetContext = (0, react_1.createContext)({});
/**
 * Hook to access asset handlers from element components.
 */
const useAssetHandlers = () => (0, react_1.useContext)(exports.AssetContext);
exports.useAssetHandlers = useAssetHandlers;
