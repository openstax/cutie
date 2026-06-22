"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountItem = mountItem;
const xmlParser_1 = require("./parser/xmlParser");
const domRenderer_1 = require("./renderer/domRenderer");
const itemState_1 = require("./state/itemState");
const styles_1 = require("./styles");
const elementTransformer_1 = require("./transformer/elementTransformer");
const styleManager_1 = require("./transformer/styleManager");
const liveRegion_1 = require("./utils/liveRegion");
/**
 * Mount a QTI item into a DOM container
 *
 * @param container - The HTML element to render into
 * @param itemTemplateXml - The sanitized QTI XML string from cutie-core
 * @returns Controller object for managing the mounted item
 */
function mountItem(container, itemTemplateXml, options) {
    // Persistent state bag — survives across update() calls, cleared on unmount()
    const state = new Map();
    // Cleanup callbacks — accumulated across renders, all called on unmount()
    const cleanupCallbacks = [];
    // Mutable reference to current render's itemState and context
    let currentItemState = null;
    let currentContext = null;
    // Current render's teardown — called on update() and unmount()
    let teardownCurrentRender = null;
    const CSS_VAR_MAP = [
        ['textColor', '--cutie-text'],
        ['textMutedColor', '--cutie-text-muted'],
        ['bgColor', '--cutie-bg'],
        ['bgAltColor', '--cutie-bg-alt'],
        ['borderColor', '--cutie-border'],
        ['primaryColor', '--cutie-primary'],
        ['primaryFgColor', '--cutie-primary-fg'],
        ['primaryHoverColor', '--cutie-primary-hover'],
        ['feedbackCorrectColor', '--cutie-feedback-correct'],
        ['feedbackIncorrectColor', '--cutie-feedback-incorrect'],
        ['feedbackInfoColor', '--cutie-feedback-info'],
    ];
    function applyThemeVars() {
        for (const [key, prop] of CSS_VAR_MAP) {
            const value = options === null || options === void 0 ? void 0 : options[key];
            if (value) {
                container.style.setProperty(prop, value);
            }
        }
    }
    function removeThemeVars() {
        for (const [, prop] of CSS_VAR_MAP) {
            container.style.removeProperty(prop);
        }
    }
    function doRender(xml) {
        const itemState = new itemState_1.ItemStateImpl(currentItemState !== null && currentItemState !== void 0 ? currentItemState : undefined);
        currentItemState = itemState;
        const styleManager = new styleManager_1.DefaultStyleManager();
        (0, styles_1.registerBaseStyles)(styleManager);
        applyThemeVars();
        const mountCallbacks = [];
        const parsed = (0, xmlParser_1.parseQtiXml)(xml);
        const context = (0, elementTransformer_1.createTransformContext)({
            itemState,
            styleManager,
            onMount: (cb) => mountCallbacks.push(cb),
            onCleanup: (cb) => cleanupCallbacks.push(cb),
            containerElement: container,
            state,
        });
        currentContext = context;
        const fragment = (0, elementTransformer_1.transformChildren)(parsed.itemBody, context);
        for (const modalFeedback of parsed.modalFeedbacks) {
            fragment.appendChild((0, elementTransformer_1.transformNode)(modalFeedback, context));
        }
        const unmountDom = (0, domRenderer_1.renderToContainer)(container, fragment);
        for (const cb of mountCallbacks)
            cb();
        teardownCurrentRender = () => {
            itemState.clear();
            styleManager.cleanup();
            unmountDom();
        };
    }
    // Initial render
    doRender(itemTemplateXml);
    state.set('isUpdate', true);
    return {
        unmount: () => {
            teardownCurrentRender === null || teardownCurrentRender === void 0 ? void 0 : teardownCurrentRender();
            teardownCurrentRender = null;
            currentItemState = null;
            currentContext = null;
            for (const cb of cleanupCallbacks)
                cb();
            cleanupCallbacks.length = 0;
            state.clear();
            removeThemeVars();
        },
        update: (xml) => {
            teardownCurrentRender === null || teardownCurrentRender === void 0 ? void 0 : teardownCurrentRender();
            teardownCurrentRender = null;
            doRender(xml);
        },
        collectResponses: () => {
            const result = currentItemState === null || currentItemState === void 0 ? void 0 : currentItemState.collectAll();
            if (!result)
                return undefined;
            if (!result.valid && currentContext) {
                const plural = result.invalidCount === 1 ? 'problem' : 'problems';
                (0, liveRegion_1.announce)(currentContext, `${result.invalidCount} ${plural} with submission. Please review the highlighted fields.`, 'assertive');
                return undefined;
            }
            return result.valid ? result.responses : undefined;
        },
        setInteractionsEnabled: (enabled) => {
            currentItemState === null || currentItemState === void 0 ? void 0 : currentItemState.setInteractionsEnabled(enabled);
        },
        getResponseIdentifiers: () => { var _a; return (_a = currentItemState === null || currentItemState === void 0 ? void 0 : currentItemState.getResponseIdentifiers()) !== null && _a !== void 0 ? _a : []; },
    };
}
