import { useRef, useState } from 'react';
import type { Path } from 'slate';
import { PropertyField } from '../../components/properties/PropertyField';
import type { ImageElement, ElementAttributes } from '../../types';
import { useAssetHandlers } from '../../contexts/AssetContext';

interface ImagePropertiesPanelProps {
  element: ImageElement;
  path: Path;
  onUpdate: (path: Path, attributes: ElementAttributes) => void;
}

/**
 * Properties panel for editing image attributes
 */
export function ImagePropertiesPanel({
  element,
  path,
  onUpdate,
}: ImagePropertiesPanelProps): React.JSX.Element {
  const attrs = element.attributes;
  const { uploadAsset } = useAssetHandlers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAttributeChange = (key: string, value: string) => {
    const newAttrs = { ...attrs };
    if (value === '') {
      if (key !== 'src') {
        delete newAttrs[key];
      }
    } else {
      newAttrs[key] = value;
    }
    onUpdate(path, newAttrs);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadAsset) return;

    setIsUploading(true);
    try {
      const newSrc = await uploadAsset(file);
      onUpdate(path, { ...attrs, src: newSrc });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="property-editor">
      <h3>Image</h3>

      {uploadAsset && (
        <div className="property-field">
          <label className="property-label">Replace Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="property-input"
            style={{ padding: '6px' }}
          />
          {isUploading && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Uploading...
            </div>
          )}
        </div>
      )}

      <PropertyField
        label="Alt Text"
        value={attrs.alt || ''}
        onChange={(val) => handleAttributeChange('alt', val)}
        placeholder="Description for accessibility"
      />

      <PropertyField
        label="Width"
        value={attrs.width || ''}
        onChange={(val) => handleAttributeChange('width', val)}
        placeholder="e.g., 200 or 50%"
      />

      <PropertyField
        label="Height"
        value={attrs.height || ''}
        onChange={(val) => handleAttributeChange('height', val)}
        placeholder="e.g., 150 or auto"
      />
    </div>
  );
}
