"use strict";
/**
 * @openstax/cutie-editor
 * React-based WYSIWYG editor for QTI v3 assessment items using Slate.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertExtendedTextInteraction = exports.insertTextEntryInteraction = exports.insertChoiceInteraction = exports.useAssetHandlers = exports.withUnknownElements = exports.withXhtml = exports.withQtiInteractions = exports.findChildren = exports.findChild = exports.xmlNodeToDom = exports.domToXmlNode = exports.serializeSlateToQti = exports.serializeSlateToXml = exports.parseXmlToSlate = exports.SlateEditor = void 0;
// Export main React component
var SlateEditor_1 = require("./editor/SlateEditor");
Object.defineProperty(exports, "SlateEditor", { enumerable: true, get: function () { return SlateEditor_1.SlateEditor; } });
// Export serialization utilities
var xmlToSlate_1 = require("./serialization/xmlToSlate");
Object.defineProperty(exports, "parseXmlToSlate", { enumerable: true, get: function () { return xmlToSlate_1.parseXmlToSlate; } });
var slateToXml_1 = require("./serialization/slateToXml");
Object.defineProperty(exports, "serializeSlateToXml", { enumerable: true, get: function () { return slateToXml_1.serializeSlateToXml; } });
Object.defineProperty(exports, "serializeSlateToQti", { enumerable: true, get: function () { return slateToXml_1.serializeSlateToQti; } });
var xmlNode_1 = require("./serialization/xmlNode");
Object.defineProperty(exports, "domToXmlNode", { enumerable: true, get: function () { return xmlNode_1.domToXmlNode; } });
Object.defineProperty(exports, "xmlNodeToDom", { enumerable: true, get: function () { return xmlNode_1.xmlNodeToDom; } });
Object.defineProperty(exports, "findChild", { enumerable: true, get: function () { return xmlNode_1.findChild; } });
Object.defineProperty(exports, "findChildren", { enumerable: true, get: function () { return xmlNode_1.findChildren; } });
// Export plugins
var plugins_1 = require("./plugins");
Object.defineProperty(exports, "withQtiInteractions", { enumerable: true, get: function () { return plugins_1.withQtiInteractions; } });
Object.defineProperty(exports, "withXhtml", { enumerable: true, get: function () { return plugins_1.withXhtml; } });
Object.defineProperty(exports, "withUnknownElements", { enumerable: true, get: function () { return plugins_1.withUnknownElements; } });
// Export asset context hook
var AssetContext_1 = require("./contexts/AssetContext");
Object.defineProperty(exports, "useAssetHandlers", { enumerable: true, get: function () { return AssetContext_1.useAssetHandlers; } });
// Export interaction insertion functions
var choice_1 = require("./interactions/choice");
Object.defineProperty(exports, "insertChoiceInteraction", { enumerable: true, get: function () { return choice_1.insertChoiceInteraction; } });
var textEntry_1 = require("./interactions/textEntry");
Object.defineProperty(exports, "insertTextEntryInteraction", { enumerable: true, get: function () { return textEntry_1.insertTextEntryInteraction; } });
var extendedText_1 = require("./interactions/extendedText");
Object.defineProperty(exports, "insertExtendedTextInteraction", { enumerable: true, get: function () { return extendedText_1.insertExtendedTextInteraction; } });
