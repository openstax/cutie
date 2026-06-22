"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageConfig = void 0;
exports.imageConfig = {
    type: 'image',
    xmlTagName: 'img',
    isVoid: true,
    isInline: true,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'image',
};
