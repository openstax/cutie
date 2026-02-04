import type { FeedbackIdentifierOption } from './types';

interface IdentifierTipProps {
  identifier: string;
  options: FeedbackIdentifierOption[];
}

/**
 * Tip showing what the selected identifier is based on
 */
export function IdentifierTip({
  identifier,
  options,
}: IdentifierTipProps): React.JSX.Element {
  const matchingOption = options.find((o) => o.id === identifier);

  return (
    <div className="property-tip">
      <strong>Based on:</strong> {matchingOption?.interactionType || 'Unknown'}
      <br />
      <small>{matchingOption?.description || ''}</small>
    </div>
  );
}
