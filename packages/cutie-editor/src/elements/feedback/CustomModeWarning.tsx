/**
 * Warning banner displayed when feedback is in custom response processing mode
 */
export function CustomModeWarning(): React.JSX.Element {
  return (
    <div className="feedback-custom-warning">
      <strong>Custom Response Processing</strong>
      <p>
        This item uses response processing patterns that cannot be managed by the editor.
        Feedback attributes are read-only, but you can still edit the feedback content.
      </p>
    </div>
  );
}
