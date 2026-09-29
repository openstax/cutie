/**
 * Whether the item is adaptive (`adaptive="true"`). An adaptive item decides
 * for itself, through completionStatus, when it is complete, over as many
 * submissions as it takes; any other item is complete after every submission.
 */
export function isAdaptive(itemDoc: Document): boolean {
  return itemDoc.documentElement.getAttribute('adaptive') === 'true';
}
