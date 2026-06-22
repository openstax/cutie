import { createContext, useContext } from 'react';
const MatchScoringContext = createContext({
    correctPairings: new Set(),
    hasCorrectness: false,
    mappingByKey: new Map(),
    hasMapping: false,
    defaultMappedValue: 0,
});
export const MatchScoringProvider = MatchScoringContext.Provider;
export function useMatchScoring() {
    return useContext(MatchScoringContext);
}
