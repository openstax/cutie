import { useStyle } from '../../hooks/useStyle';
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
export function MappingMetadataFields({
  metadata,
  onChange,
}: MappingMetadataFieldsProps): React.JSX.Element {
  useStyle('mapping-metadata-fields', MAPPING_METADATA_STYLES);

  const handleDefaultValueChange = (value: string) => {
    const numValue = parseFloat(value);
    onChange({
      ...metadata,
      defaultValue: isNaN(numValue) ? 0 : numValue,
    });
  };

  const handleLowerBoundChange = (value: string) => {
    onChange({
      ...metadata,
      lowerBound: value === '' ? undefined : parseFloat(value),
    });
  };

  const handleUpperBoundChange = (value: string) => {
    onChange({
      ...metadata,
      upperBound: value === '' ? undefined : parseFloat(value),
    });
  };

  return (
    <div className="mapping-metadata-fields">
      <div className="mapping-metadata-field">
        <label className="mapping-metadata-label">Default Value</label>
        <input
          type="number"
          step="any"
          className="mapping-metadata-input"
          value={metadata.defaultValue}
          onChange={(e) => handleDefaultValueChange(e.target.value)}
        />
      </div>

      <div className="mapping-metadata-field">
        <label className="mapping-metadata-label">Lower Bound</label>
        <input
          type="number"
          step="any"
          className="mapping-metadata-input"
          value={metadata.lowerBound ?? ''}
          onChange={(e) => handleLowerBoundChange(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="mapping-metadata-field">
        <label className="mapping-metadata-label">Upper Bound</label>
        <input
          type="number"
          step="any"
          className="mapping-metadata-input"
          value={metadata.upperBound ?? ''}
          onChange={(e) => handleUpperBoundChange(e.target.value)}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

const MAPPING_METADATA_STYLES = `
  .mapping-metadata-fields {
    margin-bottom: 16px;
  }

  .mapping-metadata-field {
    margin-bottom: 12px;
  }

  .mapping-metadata-field:last-child {
    margin-bottom: 0;
  }

  .mapping-metadata-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #333;
    margin-bottom: 6px;
  }

  .mapping-metadata-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    box-sizing: border-box;
  }

  .mapping-metadata-input:focus {
    outline: none;
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }

  .mapping-metadata-input::placeholder {
    color: #999;
  }
`;
