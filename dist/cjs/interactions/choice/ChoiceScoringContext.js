"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChoiceScoringProvider = void 0;
exports.useChoiceScoring = useChoiceScoring;
const react_1 = require("react");
const ChoiceScoringContext = (0, react_1.createContext)(null);
exports.ChoiceScoringProvider = ChoiceScoringContext.Provider;
/**
 * Hook to access choice scoring info from within a SimpleChoice element
 */
function useChoiceScoring() {
    return (0, react_1.useContext)(ChoiceScoringContext);
}
