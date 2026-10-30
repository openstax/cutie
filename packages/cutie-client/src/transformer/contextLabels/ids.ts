/** Module-level counter for default ID generation */
let idCounter = 0;

/** Default ID generator for production use */
export function defaultGenerateId(): string {
  return `cutie-ctx-${++idCounter}`;
}
