import { registry } from '../../registry.js';
import { TabContainerHandler } from './tabContainerHandler.js';

// Ahead of the html-passthrough catch-all (priority 1000)
registry.register('tab-container', new TabContainerHandler(), 900);
