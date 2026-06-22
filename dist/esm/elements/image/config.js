export const imageConfig = {
    type: 'image',
    xmlTagName: 'img',
    isVoid: true,
    isInline: true,
    needsSpacers: false,
    categories: [],
    forbidDescendants: [],
    matches: (element) => 'type' in element && element.type === 'image',
};
