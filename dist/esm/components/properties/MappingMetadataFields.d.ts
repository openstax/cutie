import type { MappingMetadata } from '../../utils/mappingDeclaration';
interface MappingMetadataFieldsProps {
    metadata: MappingMetadata;
    onChange: (metadata: MappingMetadata) => void;
}
/**
 * Reusable component for editing mapping metadata:
 * - Default Value (required)
 * - Lower Bound (optional)
 * - Upper Bound (optional)
 */
export declare function MappingMetadataFields({ metadata, onChange, }: MappingMetadataFieldsProps): React.JSX.Element;
export {};
