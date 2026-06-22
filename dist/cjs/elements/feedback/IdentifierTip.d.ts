import type { FeedbackIdentifierOption } from './types';
interface IdentifierTipProps {
    identifier: string;
    options: FeedbackIdentifierOption[];
}
/**
 * Tip showing what the selected identifier is based on
 */
export declare function IdentifierTip({ identifier, options, }: IdentifierTipProps): React.JSX.Element;
export {};
