import { createContext, useContext } from 'react';
import type { EditorAssetHandlers } from '../types';

/**
 * Context for passing asset handlers (resolve/upload) to element renderers.
 * Slate's renderElement callback has a fixed signature, so we use React Context
 * to make asset handlers available to components like ImageElement.
 */
export const AssetContext = createContext<EditorAssetHandlers>({});

/**
 * Hook to access asset handlers from element components.
 */
export const useAssetHandlers = (): EditorAssetHandlers => useContext(AssetContext);
