import type { MapEntry } from '../../utils/mappingDeclaration';
/**
 * Scoring information for a choice interaction, provided to child SimpleChoice elements
 */
export interface ChoiceScoringInfo {
    /** Array of correct choice identifiers (empty if correctness not defined) */
    correctValues: string[];
    /** Whether correctness is explicitly defined */
    hasCorrectness: boolean;
    /** Mapping entries keyed by choice identifier (empty if mapping not defined) */
    mappingByKey: Map<string, MapEntry>;
    /** Whether mapping is explicitly defined */
    hasMapping: boolean;
    /** Default value for unmapped choices */
    defaultMappedValue: number;
}
export declare const ChoiceScoringProvider: import("react").Provider<ChoiceScoringInfo | null>;
/**
 * Hook to access choice scoring info from within a SimpleChoice element
 */
export declare function useChoiceScoring(): ChoiceScoringInfo | null;
