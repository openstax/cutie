import type { MapEntry } from '../../utils/mappingDeclaration';
interface MapEntryListProps {
    entries: MapEntry[];
    onEntriesChange: (entries: MapEntry[]) => void;
    /** Render prop for custom response display/input */
    responseDisplay: (response: string, onChange: (value: string) => void, index: number) => React.JSX.Element;
    /** Called when user wants to add a new entry */
    onAddEntry: () => void;
    /** Optional custom add button content */
    addButtonLabel?: string;
}
/**
 * Extensible component for editing map entries.
 * Uses a slot pattern (responseDisplay render prop) to allow customization
 * of how response keys are displayed/edited for different interaction types.
 */
export declare function MapEntryList({ entries, onEntriesChange, responseDisplay, onAddEntry, addButtonLabel, }: MapEntryListProps): React.JSX.Element;
export {};
