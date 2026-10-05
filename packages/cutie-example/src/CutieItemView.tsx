import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';
import type { AttemptState } from '@openstax/cutie-core';
import { mountItem } from '@openstax/cutie-client';
import type { InteractionState, MountedItem, MountItemOptions, ResponseData } from '@openstax/cutie-client';

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
  interactionState: InteractionState;
  themeOptions?: MountItemOptions;
  ref?: Ref<CutieItemHandle>;
}

/**
 * Renders a cutie item: owns the container element and the mounted item's
 * lifecycle, so the item exists exactly as long as this component does.
 */
export function CutieItemView({ template, attemptState, interactionState, themeOptions, ref }: CutieItemViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedItemRef = useRef<MountedItem | null>(null);
  const prevThemeOptionsRef = useRef<MountItemOptions | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    collectResponses: () => mountedItemRef.current?.collectResponses(),
  }), []);

  // Every turn within an attempt (a submission, a fresh try, a score) uses
  // update(), so the item keeps what it has announced and announces only what
  // is new. A new attempt or item, which begins not_attempted, or a theme
  // change gets a fresh mountItem().
  useEffect(() => {
    if (!containerRef.current) return;

    const themeChanged = prevThemeOptionsRef.current !== themeOptions;
    prevThemeOptionsRef.current = themeOptions;

    const isSameAttempt = mountedItemRef.current
      && !themeChanged
      && attemptState !== null && attemptState.completionStatus !== 'not_attempted';

    if (isSameAttempt) {
      mountedItemRef.current!.update(template);
      return;
    }

    mountedItemRef.current?.unmount();
    mountedItemRef.current = mountItem(containerRef.current, template, themeOptions);
  }, [template, attemptState, themeOptions]);

  // Runs after the mount effect, so a freshly mounted item gets the current state too
  useEffect(() => {
    mountedItemRef.current?.setInteractionState(interactionState);
  }, [interactionState, template, attemptState, themeOptions]);

  useEffect(() => () => {
    mountedItemRef.current?.unmount();
    mountedItemRef.current = null;
  }, []);

  return <div className="item-view" ref={containerRef} />;
}
