import { createContext, useContext } from 'react';
/**
 * Context for passing available feedback identifiers to feedback element renderers.
 * Used to show visual warnings when a feedback element references an invalid identifier.
 */
export const FeedbackIdentifiersContext = createContext({
    availableIdentifiers: new Set(),
    identifierLabels: new Map(),
    isCustomMode: false,
});
/**
 * Hook to access available feedback identifiers from element components.
 */
export const useFeedbackIdentifiers = () => useContext(FeedbackIdentifiersContext);
