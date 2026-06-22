"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textEntryInteractionConfig = void 0;
const feedbackIdentifiers_1 = require("../../utils/feedbackIdentifiers");
const mappingDeclaration_1 = require("../../utils/mappingDeclaration");
const responseDeclaration_1 = require("../../utils/responseDeclaration");
const responseProcessingGenerator_1 = require("../../utils/responseProcessingGenerator");
const QTI_NAMESPACE = 'http://www.imsglobal.org/xsd/imsqtiasi_v3p0';
exports.textEntryInteractionConfig = {
    type: 'qti-text-entry-interaction',
    xmlTagName: 'qti-text-entry-interaction',
    isVoid: true,
    isInline: true,
    needsSpacers: false, // Inline elements don't need spacers
    categories: ['interaction'],
    forbidDescendants: [], // Void element, can't have descendants
    matches: (element) => 'type' in element && element.type === 'qti-text-entry-interaction',
    getFeedbackIdentifiers: (element) => {
        const el = element;
        const responseId = el.attributes['response-identifier'] || 'RESPONSE';
        const identifiers = [];
        // Only add correct/incorrect if the interaction has a correct response configured
        if (el.responseDeclaration && (0, responseDeclaration_1.hasCorrectResponse)(el.responseDeclaration)) {
            identifiers.push({
                id: `${responseId}_correct`,
                label: `${responseId} is correct`,
                description: 'Shown when response matches correct value',
            });
            identifiers.push({
                id: `${responseId}_incorrect`,
                label: `${responseId} is incorrect`,
                description: 'Shown when response doesn\'t match correct value',
            });
            // Add partial credit feedback when mapping is present
            if ((0, mappingDeclaration_1.hasMapping)(el.responseDeclaration)) {
                identifiers.push({
                    id: `${responseId}_partial`,
                    label: `${responseId} is partially correct`,
                    description: 'Shown when response has some but not full credit',
                });
            }
        }
        return {
            responseIdentifier: responseId,
            interactionType: 'Text Entry Interaction',
            identifiers,
        };
    },
    generateCorrectnessCheck: (responseId, responseDecl, doc) => {
        if ((0, mappingDeclaration_1.hasMapping)(responseDecl)) {
            const maxValue = (0, mappingDeclaration_1.getMaxMappedValue)(responseDecl);
            if (maxValue !== null) {
                return (0, responseProcessingGenerator_1.createMapResponseEqualElement)(responseId, maxValue, doc);
            }
        }
        return (0, responseProcessingGenerator_1.createMatchElement)(responseId, doc);
    },
    generateFeedbackConditions: (responseId, responseDecl, feedbackIds, doc) => {
        const conditions = [];
        const correctId = `${responseId}_correct`;
        const incorrectId = `${responseId}_incorrect`;
        const partialId = `${responseId}_partial`;
        const hasCorrect = feedbackIds.has(correctId);
        const hasIncorrect = feedbackIds.has(incorrectId);
        const hasPartial = feedbackIds.has(partialId);
        const isMapped = (0, mappingDeclaration_1.hasMapping)(responseDecl);
        if (hasCorrect || hasIncorrect || hasPartial) {
            const condition = doc.createElementNS(QTI_NAMESPACE, 'qti-response-condition');
            if (isMapped) {
                const maxValue = (0, mappingDeclaration_1.getMaxMappedValue)(responseDecl);
                // qti-response-if: correct (equal to max)
                const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
                if (maxValue !== null) {
                    responseIf.appendChild((0, responseProcessingGenerator_1.createMapResponseEqualElement)(responseId, maxValue, doc));
                }
                else {
                    responseIf.appendChild((0, responseProcessingGenerator_1.createMatchElement)(responseId, doc));
                }
                if (hasCorrect) {
                    responseIf.appendChild((0, responseProcessingGenerator_1.createSetFeedbackElement)(correctId, doc));
                }
                condition.appendChild(responseIf);
                // qti-response-else-if: partial (gt 0) — only if _partial feedback is used
                if (hasPartial) {
                    const responseElseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else-if');
                    responseElseIf.appendChild((0, responseProcessingGenerator_1.createMapResponseGtZeroElement)(responseId, doc));
                    responseElseIf.appendChild((0, responseProcessingGenerator_1.createSetFeedbackElement)(partialId, doc));
                    condition.appendChild(responseElseIf);
                }
                // qti-response-else: incorrect
                if (hasIncorrect) {
                    const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
                    responseElse.appendChild((0, responseProcessingGenerator_1.createSetFeedbackElement)(incorrectId, doc));
                    condition.appendChild(responseElse);
                }
            }
            else {
                // Unmapped: standard two-way via qti-match
                const responseIf = doc.createElementNS(QTI_NAMESPACE, 'qti-response-if');
                responseIf.appendChild((0, responseProcessingGenerator_1.createMatchElement)(responseId, doc));
                if (hasCorrect) {
                    responseIf.appendChild((0, responseProcessingGenerator_1.createSetFeedbackElement)(correctId, doc));
                }
                condition.appendChild(responseIf);
                if (hasIncorrect) {
                    const responseElse = doc.createElementNS(QTI_NAMESPACE, 'qti-response-else');
                    responseElse.appendChild((0, responseProcessingGenerator_1.createSetFeedbackElement)(incorrectId, doc));
                    condition.appendChild(responseElse);
                }
            }
            conditions.push(condition);
        }
        // Handle any non-standard feedback identifiers (shouldn't happen for text entry)
        for (const feedbackId of feedbackIds) {
            const parsed = (0, feedbackIdentifiers_1.parseFeedbackIdentifier)(feedbackId);
            if (parsed && parsed.type !== 'correct' && parsed.type !== 'incorrect' && parsed.type !== 'partial') {
                // Unexpected feedback type for text entry — skip
            }
        }
        return conditions;
    },
};
