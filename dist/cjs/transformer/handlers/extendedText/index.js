"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Extended text interaction handlers
 * Import all variants to trigger side-effect registration with the registry
 */
require("./formula"); // priority 40
require("./richText"); // priority 45
require("./plainText"); // priority 50
