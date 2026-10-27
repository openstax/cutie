// Template Processing - Marginal Revenue (Formula Entry)
// Adapted from Calculus Volume 1, Section 3.4 Exercise 161 (OpenStax, CC BY-NC-SA 4.0)
// https://openstax.org/books/calculus-volume-1/pages/3-4-derivatives-as-rates-of-change
//
// Each attempt picks one of the variants below with a random qti-index, since
// QTI 3 can't build a formula string from template values. Other approaches or
// QTI extensions should be considered for templated formula interactions.

export const name = "Template Processing - Marginal Revenue (Formula)";

interface Variant {
  /** completes "a certain model of ..." */
  product: string;
  /** price when demand is 0, in dollars */
  a: number;
  /** drop in price for each additional unit of demand, in dollars */
  b: number;
}

const variants: Variant[] = [
  { product: 'digital clock radio', a: 10, b: 0.001 },
  { product: 'digital clock radio', a: 12, b: 0.002 },
  { product: 'digital clock radio', a: 15, b: 0.003 },
  { product: 'digital clock radio', a: 20, b: 0.004 },
  { product: 'digital clock radio', a: 25, b: 0.005 },
  { product: 'wireless earbuds', a: 30, b: 0.01 },
  { product: 'wireless earbuds', a: 35, b: 0.02 },
  { product: 'wireless earbuds', a: 40, b: 0.025 },
  { product: 'wireless earbuds', a: 45, b: 0.03 },
  { product: 'wireless earbuds', a: 50, b: 0.04 },
  { product: 'phone case', a: 18, b: 0.006 },
  { product: 'phone case', a: 20, b: 0.008 },
  { product: 'phone case', a: 22, b: 0.01 },
  { product: 'phone case', a: 24, b: 0.012 },
  { product: 'phone case', a: 28, b: 0.014 },
  { product: 'backpack', a: 60, b: 0.05 },
  { product: 'backpack', a: 65, b: 0.04 },
  { product: 'backpack', a: 70, b: 0.06 },
  { product: 'backpack', a: 75, b: 0.08 },
  { product: 'backpack', a: 80, b: 0.1 },
  { product: 'water bottle', a: 16, b: 0.002 },
  { product: 'water bottle', a: 18, b: 0.003 },
  { product: 'water bottle', a: 20, b: 0.005 },
  { product: 'water bottle', a: 22, b: 0.006 },
  { product: 'water bottle', a: 24, b: 0.008 },
  { product: 'desk lamp', a: 35, b: 0.015 },
  { product: 'desk lamp', a: 40, b: 0.02 },
  { product: 'desk lamp', a: 45, b: 0.025 },
  { product: 'desk lamp', a: 50, b: 0.03 },
  { product: 'desk lamp', a: 55, b: 0.035 },
  { product: 'board game', a: 30, b: 0.006 },
  { product: 'board game', a: 32, b: 0.008 },
  { product: 'board game', a: 36, b: 0.009 },
  { product: 'board game', a: 40, b: 0.012 },
  { product: 'board game', a: 42, b: 0.015 },
  { product: 'bike helmet', a: 50, b: 0.02 },
  { product: 'bike helmet', a: 55, b: 0.025 },
  { product: 'bike helmet', a: 60, b: 0.03 },
  { product: 'bike helmet', a: 65, b: 0.035 },
  { product: 'bike helmet', a: 70, b: 0.05 },
  { product: 'Bluetooth speaker', a: 80, b: 0.04 },
  { product: 'Bluetooth speaker', a: 90, b: 0.05 },
  { product: 'Bluetooth speaker', a: 100, b: 0.06 },
  { product: 'Bluetooth speaker', a: 110, b: 0.08 },
  { product: 'Bluetooth speaker', a: 120, b: 0.1 },
  { product: 'coffee mug', a: 12, b: 0.0015 },
  { product: 'coffee mug', a: 14, b: 0.002 },
  { product: 'coffee mug', a: 15, b: 0.0025 },
  { product: 'coffee mug', a: 16, b: 0.004 },
  { product: 'coffee mug', a: 18, b: 0.0045 },
];

// The correct responses are written in the form students most likely enter,
// since other delivery systems match them exactly
const revenue = ({ a, b }: Variant) => `${a}x-${b}x^2`;
const marginalRevenue = ({ a, b }: Variant) => `${a}-${2 * b}x`;

const orderedList = (indent: string, baseType: string, values: (string | number)[]) => [
  `${indent}<qti-ordered>`,
  ...values.map(value => `${indent}    <qti-base-value base-type="${baseType}">${value}</qti-base-value>`),
  `${indent}</qti-ordered>`,
].join('\n');

const setFromList = (identifier: string, baseType: string, values: (string | number)[]) => `
        <qti-set-template-value identifier="${identifier}">
            <qti-index n="VARIANT">
${orderedList('                ', baseType, values)}
            </qti-index>
        </qti-set-template-value>`;

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
    identifier="template-marginal-revenue" title="Marginal Revenue" adaptive="false"
    time-dependent="false" xml:lang="en">

    <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"
        data-response-type="formula" data-comparison-mode="algebraic"/>
    <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"
        data-response-type="formula" data-comparison-mode="algebraic"/>

    <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
        <qti-default-value>
            <qti-value>0</qti-value>
        </qti-default-value>
    </qti-outcome-declaration>
    <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
        <qti-default-value>
            <qti-value>1.0</qti-value>
        </qti-default-value>
    </qti-outcome-declaration>
    <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

    <qti-template-declaration identifier="VARIANT" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="PRODUCT" cardinality="single" base-type="string"/>
    <qti-template-declaration identifier="A" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="B" cardinality="single" base-type="float"/>
    <qti-template-declaration identifier="TWO_B" cardinality="single" base-type="float"/>
    <qti-template-declaration identifier="REVENUE" cardinality="single" base-type="string"/>
    <qti-template-declaration identifier="MARGINAL_REVENUE" cardinality="single" base-type="string"/>

    <qti-template-processing>
        <!-- Each list below holds one value per variant, in the same order -->
        <qti-set-template-value identifier="VARIANT">
            <qti-random-integer min="1" max="${variants.length}"/>
        </qti-set-template-value>
${[
  setFromList('PRODUCT', 'string', variants.map(variant => variant.product)),
  setFromList('A', 'integer', variants.map(variant => variant.a)),
  setFromList('B', 'float', variants.map(variant => variant.b)),
  setFromList('TWO_B', 'float', variants.map(variant => 2 * variant.b)),
  setFromList('REVENUE', 'string', variants.map(revenue)),
  setFromList('MARGINAL_REVENUE', 'string', variants.map(marginalRevenue)),
].join('\n')}
        <qti-set-correct-response identifier="RESPONSE">
            <qti-variable identifier="REVENUE"/>
        </qti-set-correct-response>
        <qti-set-correct-response identifier="RESPONSE_2">
            <qti-variable identifier="MARGINAL_REVENUE"/>
        </qti-set-correct-response>
    </qti-template-processing>

    <qti-item-body>
        <p>The price <em>p</em> (in dollars) and the demand <em>x</em> for a certain model of
            <qti-printed-variable identifier="PRODUCT"/> are related by the price–demand function
            <em>p</em> = <qti-printed-variable identifier="A"/> − <qti-printed-variable identifier="B"/><em>x</em>.</p>

        <qti-extended-text-interaction response-identifier="RESPONSE" min-strings="1">
            <qti-prompt>a. Find the revenue function <em>R</em>(<em>x</em>).</qti-prompt>
        </qti-extended-text-interaction>

        <qti-extended-text-interaction response-identifier="RESPONSE_2" min-strings="1">
            <qti-prompt>b. Find the marginal revenue function <em>MR</em>(<em>x</em>).</qti-prompt>
        </qti-extended-text-interaction>

        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
            <p>Revenue is the number of items sold times the price of each item, so
                <em>R</em>(<em>x</em>) = <em>x</em> · <em>p</em> =
                <em>x</em>(<qti-printed-variable identifier="A"/> − <qti-printed-variable identifier="B"/><em>x</em>).
                Distributing the <em>x</em> gives
                <em>R</em>(<em>x</em>) = <qti-printed-variable identifier="A"/><em>x</em> −
                <qti-printed-variable identifier="B"/><em>x</em>². A common mistake is to give the price
                function itself as the revenue, leaving out the factor of <em>x</em>.</p>
            <p>The marginal revenue is the derivative of the revenue function. By the power rule, the
                derivative of <qti-printed-variable identifier="A"/><em>x</em> is
                <qti-printed-variable identifier="A"/>, and the derivative of
                <qti-printed-variable identifier="B"/><em>x</em>² is
                2(<qti-printed-variable identifier="B"/>)<em>x</em> =
                <qti-printed-variable identifier="TWO_B"/><em>x</em>, so
                <em>MR</em>(<em>x</em>) = <qti-printed-variable identifier="A"/> −
                <qti-printed-variable identifier="TWO_B"/><em>x</em>. A common mistake is to forget to
                multiply by the exponent, which gives <qti-printed-variable identifier="A"/> −
                <qti-printed-variable identifier="B"/><em>x</em>.</p>
        </qti-feedback-block>
    </qti-item-body>

    <qti-response-processing>
        <qti-response-condition>
            <qti-response-if>
                <qti-and>
                    <qti-match>
                        <qti-variable identifier="RESPONSE"/>
                        <qti-correct identifier="RESPONSE"/>
                    </qti-match>
                    <qti-match>
                        <qti-variable identifier="RESPONSE_2"/>
                        <qti-correct identifier="RESPONSE_2"/>
                    </qti-match>
                </qti-and>
                <qti-set-outcome-value identifier="SCORE">
                    <qti-base-value base-type="float">1</qti-base-value>
                </qti-set-outcome-value>
            </qti-response-if>
            <qti-response-else>
                <qti-set-outcome-value identifier="SCORE">
                    <qti-base-value base-type="float">0</qti-base-value>
                </qti-set-outcome-value>
            </qti-response-else>
        </qti-response-condition>
        <qti-set-outcome-value identifier="FEEDBACK">
            <qti-multiple>
                <qti-variable identifier="FEEDBACK"/>
                <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
            </qti-multiple>
        </qti-set-outcome-value>
    </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['extended-text', 'formula'];
