"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagePropertiesPanels = exports.imageRenderers = exports.insertImage = exports.imageConfig = exports.ImagePropertiesPanel = exports.ImageElement = void 0;
var Element_1 = require("./Element");
Object.defineProperty(exports, "ImageElement", { enumerable: true, get: function () { return Element_1.ImageElement; } });
var PropertiesPanel_1 = require("./PropertiesPanel");
Object.defineProperty(exports, "ImagePropertiesPanel", { enumerable: true, get: function () { return PropertiesPanel_1.ImagePropertiesPanel; } });
var config_1 = require("./config");
Object.defineProperty(exports, "imageConfig", { enumerable: true, get: function () { return config_1.imageConfig; } });
var insertion_1 = require("./insertion");
Object.defineProperty(exports, "insertImage", { enumerable: true, get: function () { return insertion_1.insertImage; } });
const Element_2 = require("./Element");
const PropertiesPanel_2 = require("./PropertiesPanel");
exports.imageRenderers = {
    image: Element_2.ImageElement,
};
exports.imagePropertiesPanels = {
    image: PropertiesPanel_2.ImagePropertiesPanel,
};
