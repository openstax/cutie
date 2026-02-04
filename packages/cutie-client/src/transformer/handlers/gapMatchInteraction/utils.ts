/**
 * Shuffles choices while respecting fixed positions.
 * Choices with fixed=true remain in their original positions,
 * while other choices are shuffled into the remaining positions.
 */
export function shuffleWithFixed<T extends { fixed: boolean }>(choices: T[]): T[] {
  if (choices.length <= 1) return [...choices];

  const fixedPositions = new Map<number, T>();
  const nonFixedChoices: T[] = [];

  choices.forEach((choice, index) => {
    if (choice.fixed) {
      fixedPositions.set(index, choice);
    } else {
      nonFixedChoices.push(choice);
    }
  });

  // Fisher-Yates shuffle
  for (let i = nonFixedChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonFixedChoices[i], nonFixedChoices[j]] = [nonFixedChoices[j], nonFixedChoices[i]];
  }

  const result: T[] = new Array(choices.length);
  let nonFixedIndex = 0;

  for (let i = 0; i < choices.length; i++) {
    if (fixedPositions.has(i)) {
      result[i] = fixedPositions.get(i)!;
    } else {
      result[i] = nonFixedChoices[nonFixedIndex++];
    }
  }

  return result;
}
