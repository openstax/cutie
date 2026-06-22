export { GapMatchInteractionElement, GapMatchChoicesElement, GapMatchContentElement, GapTextElement, GapImgElement, GapElement, } from './Element';
export { GapMatchPropertiesPanel, GapTextPropertiesPanel, GapImgPropertiesPanel, GapPropertiesPanel, } from './PropertiesPanel';
export { gapMatchInteractionConfig, gapMatchChoicesConfig, gapMatchContentConfig, gapTextConfig, gapImgConfig, gapConfig, } from './config';
export { gapMatchParsers, gapMatchSerializers } from './serialization';
export { insertGapMatchInteraction, insertGapAtSelection, generateGapId, generateChoiceId } from './insertion';
import { GapElement, GapImgElement, GapMatchChoicesElement, GapMatchContentElement, GapMatchInteractionElement, GapTextElement } from './Element';
import { GapImgPropertiesPanel, GapMatchPropertiesPanel, GapPropertiesPanel, GapTextPropertiesPanel } from './PropertiesPanel';
export declare const gapMatchRenderers: {
    'qti-gap-match-interaction': typeof GapMatchInteractionElement;
    'gap-match-choices': typeof GapMatchChoicesElement;
    'gap-match-content': typeof GapMatchContentElement;
    'qti-gap-text': typeof GapTextElement;
    'qti-gap-img': typeof GapImgElement;
    'qti-gap': typeof GapElement;
};
export declare const gapMatchPropertiesPanels: {
    'qti-gap-match-interaction': typeof GapMatchPropertiesPanel;
    'qti-gap-text': typeof GapTextPropertiesPanel;
    'qti-gap-img': typeof GapImgPropertiesPanel;
    'qti-gap': typeof GapPropertiesPanel;
};
