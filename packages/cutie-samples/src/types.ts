export interface Sample {
  /** Stable identifier, unique across all samples */
  id: string;
  /** Short human-readable name */
  name: string;
  /** Markdown authoring guidance describing the conventions this sample demonstrates */
  description: string;
  /** QTI interaction types used by the item, e.g. 'choice', 'text-entry' */
  interactionTypes: string[];
  /** The complete QTI v3 assessment item XML */
  item: string;
}

export interface SampleGroup {
  /** Stable identifier for the group */
  id: string;
  /** Short human-readable label */
  label: string;
  /** Markdown guidance that applies to every sample in the group */
  description: string;
  samples: Sample[];
}
