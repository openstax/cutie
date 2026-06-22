"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateShuffleOrder = generateShuffleOrder;
/**
 * Generates a shuffle order for items while respecting fixed positions.
 * Items with fixed=true remain in their original positions,
 * while other items are shuffled into the remaining positions.
 *
 * @param items - Array of items with identifier and fixed properties
 * @returns Array of identifiers in shuffled order
 */
function generateShuffleOrder(items) {
    if (items.length <= 1) {
        return items.map((item) => item.identifier);
    }
    const fixedPositions = new Map();
    const nonFixedIdentifiers = [];
    items.forEach((item, index) => {
        if (item.fixed) {
            fixedPositions.set(index, item.identifier);
        }
        else {
            nonFixedIdentifiers.push(item.identifier);
        }
    });
    // Fisher-Yates shuffle for non-fixed items
    for (let i = nonFixedIdentifiers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nonFixedIdentifiers[i], nonFixedIdentifiers[j]] = [
            nonFixedIdentifiers[j],
            nonFixedIdentifiers[i],
        ];
    }
    // Build result array with fixed items in place and shuffled items filling gaps
    const result = new Array(items.length);
    let nonFixedIndex = 0;
    for (let i = 0; i < items.length; i++) {
        if (fixedPositions.has(i)) {
            result[i] = fixedPositions.get(i);
        }
        else {
            result[i] = nonFixedIdentifiers[nonFixedIndex++];
        }
    }
    return result;
}
