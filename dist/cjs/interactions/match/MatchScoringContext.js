"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchScoringProvider = void 0;
exports.useMatchScoring = useMatchScoring;
const react_1 = require("react");
const MatchScoringContext = (0, react_1.createContext)({
    correctPairings: new Set(),
    hasCorrectness: false,
    mappingByKey: new Map(),
    hasMapping: false,
    defaultMappedValue: 0,
});
exports.MatchScoringProvider = MatchScoringContext.Provider;
function useMatchScoring() {
    return (0, react_1.useContext)(MatchScoringContext);
}
