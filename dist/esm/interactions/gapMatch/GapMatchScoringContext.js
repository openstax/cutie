import { createContext, useContext } from 'react';
const GapMatchScoringContext = createContext({
    correctPairings: new Map(),
    hasCorrectness: false,
    mappingByKey: new Map(),
    hasMapping: false,
    defaultMappedValue: 0,
});
export const GapMatchScoringProvider = GapMatchScoringContext.Provider;
export function useGapMatchScoring() {
    return useContext(GapMatchScoringContext);
}
