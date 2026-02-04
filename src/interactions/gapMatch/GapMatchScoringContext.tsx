import { createContext, useContext } from 'react';

/**
 * Scoring information for gap-match interaction
 */
export interface GapMatchScoringInfo {
  /** Map of gap identifier to correct choice identifier(s) */
  correctPairings: Map<string, string>;
  /** Whether correct response is defined */
  hasCorrectness: boolean;
  /** Map entries for partial credit scoring */
  mappingByKey: Map<string, { mapKey: string; mappedValue: number }>;
  /** Whether mapping is defined */
  hasMapping: boolean;
  /** Default mapped value for unmatched pairs */
  defaultMappedValue: number;
}

const GapMatchScoringContext = createContext<GapMatchScoringInfo>({
  correctPairings: new Map(),
  hasCorrectness: false,
  mappingByKey: new Map(),
  hasMapping: false,
  defaultMappedValue: 0,
});

export const GapMatchScoringProvider = GapMatchScoringContext.Provider;

export function useGapMatchScoring(): GapMatchScoringInfo {
  return useContext(GapMatchScoringContext);
}
