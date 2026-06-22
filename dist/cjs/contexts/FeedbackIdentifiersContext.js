"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFeedbackIdentifiers = exports.FeedbackIdentifiersContext = void 0;
const react_1 = require("react");
/**
 * Context for passing available feedback identifiers to feedback element renderers.
 * Used to show visual warnings when a feedback element references an invalid identifier.
 */
exports.FeedbackIdentifiersContext = (0, react_1.createContext)({
    availableIdentifiers: new Set(),
    identifierLabels: new Map(),
    isCustomMode: false,
});
/**
 * Hook to access available feedback identifiers from element components.
 */
const useFeedbackIdentifiers = () => (0, react_1.useContext)(exports.FeedbackIdentifiersContext);
exports.useFeedbackIdentifiers = useFeedbackIdentifiers;
