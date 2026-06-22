"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapMatchScoringProvider = void 0;
exports.useGapMatchScoring = useGapMatchScoring;
const react_1 = require("react");
const GapMatchScoringContext = (0, react_1.createContext)({
    correctPairings: new Map(),
    hasCorrectness: false,
    mappingByKey: new Map(),
    hasMapping: false,
    defaultMappedValue: 0,
});
exports.GapMatchScoringProvider = GapMatchScoringContext.Provider;
function useGapMatchScoring() {
    return (0, react_1.useContext)(GapMatchScoringContext);
}
