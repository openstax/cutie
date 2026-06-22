/**
 * Context value for available feedback identifiers
 */
export interface FeedbackIdentifiersContextValue {
    /** Set of available feedback identifier IDs */
    availableIdentifiers: Set<string>;
    /** Map from identifier id to display label for use in feedback element UI */
    identifierLabels: Map<string, string>;
    /** Whether custom scoring mode is enabled (skips identifier validation) */
    isCustomMode: boolean;
}
/**
 * Context for passing available feedback identifiers to feedback element renderers.
 * Used to show visual warnings when a feedback element references an invalid identifier.
 */
export declare const FeedbackIdentifiersContext: import("react").Context<FeedbackIdentifiersContextValue>;
/**
 * Hook to access available feedback identifiers from element components.
 */
export declare const useFeedbackIdentifiers: () => FeedbackIdentifiersContextValue;
