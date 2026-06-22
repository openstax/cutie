/**
 * Scoring information for match interaction
 * Stores correct pairings in directedPair format: "sourceId targetId"
 */
export interface MatchScoringInfo {
    /** Set of correct pairings in "sourceId targetId" format */
    correctPairings: Set<string>;
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
export declare const MatchScoringProvider: import("react").Provider<MatchScoringInfo>;
export declare function useMatchScoring(): MatchScoringInfo;
