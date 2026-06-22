export { MatchInteractionElement, MatchSourceSetElement, MatchTargetSetElement, SimpleAssociableChoiceElement, } from './Element';
export { MatchPropertiesPanel, SimpleAssociableChoicePropertiesPanel, } from './PropertiesPanel';
export { matchInteractionConfig, matchSourceSetConfig, matchTargetSetConfig, simpleAssociableChoiceConfig, } from './config';
export { matchParsers, matchSerializers } from './serialization';
export { insertMatchInteraction, generateSourceId, generateTargetId } from './insertion';
import { MatchInteractionElement, MatchSourceSetElement, MatchTargetSetElement, SimpleAssociableChoiceElement } from './Element';
import { MatchPropertiesPanel, SimpleAssociableChoicePropertiesPanel } from './PropertiesPanel';
export declare const matchRenderers: {
    'qti-match-interaction': typeof MatchInteractionElement;
    'match-source-set': typeof MatchSourceSetElement;
    'match-target-set': typeof MatchTargetSetElement;
    'qti-simple-associable-choice': typeof SimpleAssociableChoiceElement;
};
export declare const matchPropertiesPanels: {
    'qti-match-interaction': typeof MatchPropertiesPanel;
    'qti-simple-associable-choice': typeof SimpleAssociableChoicePropertiesPanel;
};
