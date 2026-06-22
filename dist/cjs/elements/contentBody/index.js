"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentBodyRenderers = exports.contentBodySerializers = exports.contentBodyParsers = exports.contentBodyConfig = exports.ContentBodyElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "ContentBodyElement", { enumerable: true, get: function () { return Element_1.ContentBodyElement; } });
var config_1 = require("./config");
Object.defineProperty(exports, "contentBodyConfig", { enumerable: true, get: function () { return config_1.contentBodyConfig; } });
var serialization_1 = require("./serialization");
Object.defineProperty(exports, "contentBodyParsers", { enumerable: true, get: function () { return serialization_1.contentBodyParsers; } });
Object.defineProperty(exports, "contentBodySerializers", { enumerable: true, get: function () { return serialization_1.contentBodySerializers; } });
const Element_2 = require("./Element");
exports.contentBodyRenderers = {
    'qti-content-body': Element_2.ContentBodyElement,
};
