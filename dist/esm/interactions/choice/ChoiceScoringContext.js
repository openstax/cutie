import { createContext, useContext } from 'react';
const ChoiceScoringContext = createContext(null);
export const ChoiceScoringProvider = ChoiceScoringContext.Provider;
/**
 * Hook to access choice scoring info from within a SimpleChoice element
 */
export function useChoiceScoring() {
    return useContext(ChoiceScoringContext);
}
