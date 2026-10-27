/**
 * Whether the item is adaptive (`adaptive="true"`, or `"1"`: QTI booleans are
 * XML Schema booleans). An adaptive item decides
 * for itself, through completionStatus, when it is complete, over as many
 * submissions as it takes; any other item is complete after every submission.
 */
export function isAdaptive(itemDoc: Document): boolean {
  const adaptive = itemDoc.documentElement.getAttribute('adaptive');
  return adaptive === 'true' || adaptive === '1';
}
