import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { MountedItem, MountItemOptions, ResponseData } from '@openstax/cutie-client';

/**
 * What a parent can do with the mounted item.
 */
export interface CutieItemHandle {
  /** Collects the learner's responses, or undefined when they are not valid to submit */
  collectResponses: () => ResponseData | undefined;
}

interface CutieItemViewProps {
  /** Sanitized template from cutie-core */
  template: string;
  /** The attempt the template belongs to; a new attempt remounts the item */
  attemptState: AttemptState | null;
  interactionsEnabled: boolean;
  themeOptions?: MountItemOptions;
  ref?: Ref<CutieItemHandle>;
}

/**
 * Renders a cutie item: owns the container element and the mounted item's
 * lifecycle, so the item exists exactly as long as this component does.
 */
export function CutieItemView({ template, attemptState, interactionsEnabled, themeOptions, ref }: CutieItemViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);
  const prevCompletionStatusRef = useRef<string | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    collectResponses: () => mountedItemRef.current?.collectResponses(),
  }), []);

  // Uses update() on submit transitions to preserve announcement state,
  // and a fresh mountItem() for a new attempt or item
  useEffect(() => {
    if (!containerRef.current) return;

    const prevStatus = prevCompletionStatusRef.current;
    prevCompletionStatusRef.current = attemptState?.completionStatus;

    // Use update() when transitioning to 'completed' (submit with feedback)
    const isSubmitTransition = mountedItemRef.current
      && attemptState?.completionStatus === 'completed'
      && prevStatus !== 'completed';

    if (isSubmitTransition) {
      mountedItemRef.current!.update(template);
      return;
    }

    mountedItemRef.current?.unmount();
    mountedItemRef.current = mountItem(containerRef.current, template, themeOptions);
  }, [template, attemptState, themeOptions]);

  // Runs after the mount effect, so a freshly mounted item gets the current state too
  useEffect(() => {
    mountedItemRef.current?.setInteractionsEnabled(interactionsEnabled);
  }, [interactionsEnabled, template, attemptState, themeOptions]);

  useEffect(() => () => {
    mountedItemRef.current?.unmount();
    mountedItemRef.current = null;
  }, []);

  return <div className="preview-item" ref={containerRef} />;
}
