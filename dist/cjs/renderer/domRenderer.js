"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderToContainer = renderToContainer;
/**
 * Render transformed content into a DOM container
 */
function renderToContainer(container, content) {
    // Clear existing content
    container.innerHTML = '';
    // Add base CSS class
    container.classList.add('cutie-item-container');
    // Append transformed content
    container.appendChild(content);
    // Return cleanup function
    return () => {
        container.innerHTML = '';
        container.classList.remove('cutie-item-container');
    };
}
