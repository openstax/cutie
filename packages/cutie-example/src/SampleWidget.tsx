import { useEffect, useRef, useState } from 'react';
import { beginAttempt, submitResponse } from '@openstax/cutie-core';
import type { AttemptResult } from '@openstax/cutie-core';
import type { Sample } from '@openstax/cutie-samples';
import { AttemptStatus } from './AttemptStatus';
import { CutieItemView } from './CutieItemView';
import type { CutieItemHandle } from './CutieItemView';
import { ContentCopyIcon } from './icons';
import { Tabs, TabList, TabPanel } from './Tabs';
import { attemptInteractionState } from './utils/attempt';
import { isEffectivelyEmptyTemplate } from './utils/qtiUtils';
import { resolveAssets } from './utils/resolveAssets';
import { usePreviewTemplate } from './utils/usePreviewTemplate';

type View = 'preview' | 'test' | 'xml';

interface ViewProps {
  itemXml: string;
  onError: (message: string) => void;
}

const errorMessage = (err: unknown, fallback: string) => err instanceof Error ? err.message : fallback;

function Loading() {
  return <div className="loading-spinner sample-widget-loading" role="status" aria-label="Loading" />;
}

function SamplePreview({ itemXml, onError }: ViewProps) {
  const template = usePreviewTemplate(itemXml, false, onError);
  if (isEffectivelyEmptyTemplate(template)) return <Loading />;
  return <CutieItemView template={template} attemptState={null} interactionState="readonly" />;
}

/** A learner attempt at the item, with cutie-core's default delivery options. */
function SampleTest({ itemXml, onError }: ViewProps) {
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemRef = useRef<CutieItemHandle>(null);
  // Counts attempt operations, so a result that arrives after a newer operation began is dropped
  const operationRef = useRef(0);

  useEffect(() => {
    const operationId = ++operationRef.current;
    beginAttempt(itemXml, { resolveAssets })
      .then((begun) => {
        if (operationId === operationRef.current) setResult(begun);
      })
      .catch((err) => {
        console.error(err);
        onError(errorMessage(err, 'Error starting attempt'));
      });
  }, [itemXml, attemptNumber, onError]);

  const attemptState = result?.state ?? null;
  const interactionState = attemptInteractionState(attemptState, isSubmitting);

  const handleSubmit = async () => {
    if (!attemptState) return;
    const responses = itemRef.current?.collectResponses();
    if (!responses) return; // validation failed, handlers decorated their UI

    const operationId = ++operationRef.current;
    setIsSubmitting(true);
    try {
      const submitted = await submitResponse(responses, attemptState, itemXml, { resolveAssets });
      if (operationId === operationRef.current) setResult(submitted);
    } catch (err) {
      console.error(err);
      onError(errorMessage(err, 'Error processing response'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!result || isEffectivelyEmptyTemplate(result.template)) return <Loading />;

  return (
    <>
      <CutieItemView
        ref={itemRef}
        template={result.template}
        attemptState={attemptState}
        interactionState={interactionState}
      />
      <AttemptStatus attemptState={attemptState} />
      {attemptState?.pendingManualScoring && (
        <p className="sample-widget-note" role="status">Submitted. This item is scored by an instructor.</p>
      )}
      <div className="item-buttons">
        <button className="process-button" onClick={handleSubmit} disabled={interactionState !== 'enabled'}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        <button className="cancel-button" onClick={() => setAttemptNumber(n => n + 1)}>
          Reset
        </button>
      </div>
    </>
  );
}

function SampleXml({ itemXml, onError }: ViewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(itemXml);
      setCopied(true);
    } catch (err) {
      onError(errorMessage(err, 'Could not copy to the clipboard'));
    }
  };

  return (
    <div className="sample-xml">
      <button className="cancel-button sample-xml-copy" onClick={handleCopy}>
        <ContentCopyIcon /> <span role="status">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <pre className="output-display xml-output">{itemXml}</pre>
    </div>
  );
}

/**
 * A sample item, viewable as an instructor preview, as a learner test, or as XML.
 */
export function SampleWidget({ sample }: { sample: Sample }) {
  const [view, setView] = useState<View>('preview');
  const [error, setError] = useState('');

  const viewProps: ViewProps = { itemXml: sample.item, onError: setError };
  const tabs = [
    { id: 'preview', label: 'Preview', content: <SamplePreview {...viewProps} /> },
    { id: 'test', label: 'Test', content: <SampleTest {...viewProps} /> },
    { id: 'xml', label: 'XML', content: <SampleXml {...viewProps} /> },
  ];

  const handleViewChange = (id: string) => {
    setError('');
    setView(id as View);
  };

  return (
    <div className="sample-widget">
      <Tabs tabs={tabs} activeTab={view} onTabChange={handleViewChange}>
        <TabList ariaLabel={`${sample.name} view`} />
        <div className="sample-widget-body">
          {error && <div className="error-message" role="alert">{error}</div>}
          <TabPanel />
        </div>
      </Tabs>
    </div>
  );
}
