interface ReadonlyAttributeInfoProps {
  outcomeIdentifier: string;
  identifier: string;
  showHide: string;
}

/**
 * Info box showing read-only feedback attributes in custom mode
 */
export function ReadonlyAttributeInfo({
  outcomeIdentifier,
  identifier,
  showHide,
}: ReadonlyAttributeInfoProps): React.JSX.Element {
  return (
    <div className="feedback-readonly-info">
      <p>
        <strong>outcome-identifier:</strong> {outcomeIdentifier}
      </p>
      <p>
        <strong>identifier:</strong> {identifier}
      </p>
      <p>
        <strong>show-hide:</strong> {showHide}
      </p>
    </div>
  );
}
