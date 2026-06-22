/**
 * Scoring information for gap-match interaction
 */
export interface GapMatchScoringInfo {
    /** Map of gap identifier to correct choice identifier(s) */
    correctPairings: Map<string, string>;
    /** Whether correct response is defined */
    hasCorrectness: boolean;
    /** Map entries for partial credit scoring */
    mappingByKey: Map<string, {
        mapKey: string;
        mappedValue: number;
    }>;
    /** Whether mapping is defined */
    hasMapping: boolean;
    /** Default mapped value for unmatched pairs */
    defaultMappedValue: number;
}
export declare const GapMatchScoringProvider: import("react").Provider<GapMatchScoringInfo>;
export declare function useGapMatchScoring(): GapMatchScoringInfo;
