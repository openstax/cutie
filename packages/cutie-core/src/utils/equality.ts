/**
 * Deep equality check for comparing values
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * Deep equality check for unordered containers (multiple cardinality)
 * Treats arrays as sets where order doesn't matter
 */
export function deepEqualUnordered(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;

    // For unordered comparison, check that every item in a has a match in b
    const bCopy = [...b];
    for (const aItem of a) {
      let found = false;
      for (let i = 0; i < bCopy.length; i++) {
        if (deepEqual(aItem, bCopy[i])) {
          bCopy.splice(i, 1); // Remove matched item
          found = true;
          break;
        }
      }
      if (!found) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}
