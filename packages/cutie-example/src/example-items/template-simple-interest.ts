/* spell-checker: ignore Areli */
// Template Processing - Simple Interest Rate
// Adapted from Elementary Algebra 2e, Example 3.21 (OpenStax, CC BY-NC-SA 4.0)
// https://openstax.org/books/elementary-algebra-2e/pages/3-2-solve-percent-applications
//
// The rate is generated first and the interest computed from it, so every
// attempt has a clean answer. Values are kept as integers until the final
// division so printed variables never show floating point noise.

export const name = "Template Processing - Simple Interest Rate";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
    identifier="template-simple-interest" title="Simple Interest Rate" adaptive="false"
    time-dependent="false" xml:lang="en">

    <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/>

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

    <qti-template-declaration identifier="NAME" cardinality="single" base-type="string"/>
    <qti-template-declaration identifier="PRINCIPAL" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="YEARS" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="HALF_PERCENTS" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="INTEREST" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="PRINCIPAL_YEARS" cardinality="single" base-type="integer"/>
    <qti-template-declaration identifier="RATE_DECIMAL" cardinality="single" base-type="float"/>
    <qti-template-declaration identifier="RATE_PERCENT" cardinality="single" base-type="float"/>

    <qti-template-processing>
        <qti-set-template-value identifier="NAME">
            <qti-random>
                <qti-multiple>
                    <qti-base-value base-type="string">Loren</qti-base-value>
                    <qti-base-value base-type="string">Areli</qti-base-value>
                    <qti-base-value base-type="string">Jim</qti-base-value>
                    <qti-base-value base-type="string">Hang</qti-base-value>
                    <qti-base-value base-type="string">Susana</qti-base-value>
                    <qti-base-value base-type="string">Eduardo</qti-base-value>
                </qti-multiple>
            </qti-random>
        </qti-set-template-value>
        <qti-set-template-value identifier="PRINCIPAL">
            <!-- Dollars, a multiple of 1000 so the interest is always whole dollars -->
            <qti-random-integer min="2000" max="12000" step="1000"/>
        </qti-set-template-value>
        <qti-set-template-value identifier="YEARS">
            <qti-random-integer min="2" max="6"/>
        </qti-set-template-value>
        <!-- The rate in half percents (11 means 5.5%), 2% to 8% -->
        <qti-set-template-value identifier="HALF_PERCENTS">
            <qti-random-integer min="4" max="16"/>
        </qti-set-template-value>
        <!-- P times t, the coefficient of r after substituting into I = Prt -->
        <qti-set-template-value identifier="PRINCIPAL_YEARS">
            <qti-product>
                <qti-variable identifier="PRINCIPAL"/>
                <qti-variable identifier="YEARS"/>
            </qti-product>
        </qti-set-template-value>
        <!-- I = Prt = P * (HALF_PERCENTS / 200) * t, exact because P is a multiple of 1000 -->
        <qti-set-template-value identifier="INTEREST">
            <qti-integer-divide>
                <qti-product>
                    <qti-variable identifier="PRINCIPAL_YEARS"/>
                    <qti-variable identifier="HALF_PERCENTS"/>
                </qti-product>
                <qti-base-value base-type="integer">200</qti-base-value>
            </qti-integer-divide>
        </qti-set-template-value>
        <qti-set-template-value identifier="RATE_DECIMAL">
            <qti-divide>
                <qti-variable identifier="HALF_PERCENTS"/>
                <qti-base-value base-type="integer">200</qti-base-value>
            </qti-divide>
        </qti-set-template-value>
        <qti-set-template-value identifier="RATE_PERCENT">
            <qti-divide>
                <qti-variable identifier="HALF_PERCENTS"/>
                <qti-base-value base-type="integer">2</qti-base-value>
            </qti-divide>
        </qti-set-template-value>
        <!-- The correct response changes with every attempt -->
        <qti-set-correct-response identifier="RESPONSE">
            <qti-variable identifier="RATE_PERCENT"/>
        </qti-set-correct-response>
    </qti-template-processing>

    <qti-item-body>
        <p><qti-printed-variable identifier="NAME"/> loaned a friend
            $<qti-printed-variable identifier="PRINCIPAL"/> to help buy a car. After
            <qti-printed-variable identifier="YEARS"/> years, the friend paid back the
            $<qti-printed-variable identifier="PRINCIPAL"/> plus
            $<qti-printed-variable identifier="INTEREST"/> in simple interest. What was the
            annual rate of interest?</p>
        <p><qti-text-entry-interaction response-identifier="RESPONSE" expected-length="10"
                pattern-mask=".+" data-patternmask-message="Response required"/> %</p>

        <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
            <p>Use the simple interest formula, I = Prt. Here the interest is
                I = $<qti-printed-variable identifier="INTEREST"/>, the principal is
                P = $<qti-printed-variable identifier="PRINCIPAL"/>, and the time is
                t = <qti-printed-variable identifier="YEARS"/> years. Substituting gives
                <qti-printed-variable identifier="INTEREST"/> =
                (<qti-printed-variable identifier="PRINCIPAL"/>)r(<qti-printed-variable identifier="YEARS"/>),
                which simplifies to <qti-printed-variable identifier="INTEREST"/> =
                <qti-printed-variable identifier="PRINCIPAL_YEARS"/>r. Dividing both sides by
                <qti-printed-variable identifier="PRINCIPAL_YEARS"/> gives
                r = <qti-printed-variable identifier="RATE_DECIMAL"/>, which is
                <qti-printed-variable identifier="RATE_PERCENT"/>% in percent form.</p>
            <p>A common mistake is to stop at the decimal
                <qti-printed-variable identifier="RATE_DECIMAL"/>. The question asks for a
                percent, so move the decimal point two places to the right. To check the
                answer, substitute it back into the formula:
                (<qti-printed-variable identifier="PRINCIPAL"/>)(<qti-printed-variable identifier="RATE_DECIMAL"/>)(<qti-printed-variable identifier="YEARS"/>)
                = <qti-printed-variable identifier="INTEREST"/>, which matches the interest paid.</p>
        </qti-feedback-block>
    </qti-item-body>

    <qti-response-processing>
        <qti-response-condition>
            <qti-response-if>
                <qti-equal tolerance-mode="absolute" tolerance="0.01">
                    <qti-variable identifier="RESPONSE"/>
                    <qti-correct identifier="RESPONSE"/>
                </qti-equal>
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

export const interactionTypes: string[] = ['text-entry'];
