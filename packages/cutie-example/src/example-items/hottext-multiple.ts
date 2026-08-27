// Source: Project Cutie
/* spell-checker: ignore Hottext hottext */

export const name = "Hottext Interaction - Selecting Multiple";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
                     identifier="hottext-multiple" title="Selecting Multiple Items" adaptive="false" time-dependent="false">
	<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
		<qti-correct-response>
			<qti-value>B</qti-value>
			<qti-value>C</qti-value>
		</qti-correct-response>
	</qti-response-declaration>
	<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
		<qti-default-value>
			<qti-value>0</qti-value>
		</qti-default-value>
	</qti-outcome-declaration>
	<qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
		<qti-default-value>
			<qti-value>1</qti-value>
		</qti-default-value>
	</qti-outcome-declaration>
	<qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>
	<qti-item-body>
		<qti-rubric-block view="candidate" use="instructions">
			<qti-content-body>
				<p>Two of the four marked items below belong to the target set.
					Select <strong>Item B</strong> and <strong>Item C</strong>.</p>
			</qti-content-body>
		</qti-rubric-block>
		<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2" min-choices="2">
			<p>The first paragraph introduces <qti-hottext identifier="A">Item A</qti-hottext>
				as background context that sets up the discussion.</p>
			<p>The second paragraph presents <qti-hottext identifier="B">Item B</qti-hottext>,
				which belongs to the target set and should be selected.</p>
			<p>The third paragraph continues with <qti-hottext identifier="C">Item C</qti-hottext>,
				which also belongs to the target set and should be selected. It closes with
				<qti-hottext identifier="D">Item D</qti-hottext> as a concluding remark outside the target set.</p>
		</qti-hottext-interaction>

		<!-- Correct answer feedback - shown when both target items are selected -->
		<qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show" data-feedback-type="correct">
			<p>Correct! You selected both members of the target set.</p>
		</qti-feedback-block>

		<!-- Per-choice feedback for the items outside the target set -->
		<qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_A" show-hide="show" data-feedback-type="incorrect">
			<p><strong>Item A</strong> is background context, not a member of the target set.</p>
		</qti-feedback-block>
		<qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_D" show-hide="show" data-feedback-type="incorrect">
			<p><strong>Item D</strong> is a concluding remark outside the target set.</p>
		</qti-feedback-block>
	</qti-item-body>
	<qti-response-processing>
		<!-- Scoring: exact-set match (both B and C, nothing else) -->
		<qti-response-condition>
			<qti-response-if>
				<qti-match>
					<qti-variable identifier="RESPONSE"/>
					<qti-correct identifier="RESPONSE"/>
				</qti-match>
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

		<!-- Correct feedback when the score is 1 -->
		<qti-response-condition>
			<qti-response-if>
				<qti-match>
					<qti-variable identifier="SCORE"/>
					<qti-base-value base-type="float">1</qti-base-value>
				</qti-match>
				<qti-set-outcome-value identifier="FEEDBACK">
					<qti-multiple>
						<qti-variable identifier="FEEDBACK"/>
						<qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
					</qti-multiple>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>

		<!-- Per-choice feedback when an out-of-set item is selected -->
		<qti-response-condition>
			<qti-response-if>
				<qti-member>
					<qti-base-value base-type="identifier">A</qti-base-value>
					<qti-variable identifier="RESPONSE"/>
				</qti-member>
				<qti-set-outcome-value identifier="FEEDBACK">
					<qti-multiple>
						<qti-variable identifier="FEEDBACK"/>
						<qti-base-value base-type="identifier">RESPONSE_choice_A</qti-base-value>
					</qti-multiple>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>

		<qti-response-condition>
			<qti-response-if>
				<qti-member>
					<qti-base-value base-type="identifier">D</qti-base-value>
					<qti-variable identifier="RESPONSE"/>
				</qti-member>
				<qti-set-outcome-value identifier="FEEDBACK">
					<qti-multiple>
						<qti-variable identifier="FEEDBACK"/>
						<qti-base-value base-type="identifier">RESPONSE_choice_D</qti-base-value>
					</qti-multiple>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>
	</qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['hottext'];
