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
			<p>The passage opens with background context, introduced through
				<qti-hottext identifier="A">Item A</qti-hottext><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_A" show-hide="show" data-feedback-type="incorrect"><strong>Item A</strong> is background context, not a member of the target set.</qti-feedback-inline>.</p>
			<p>The target set's first member is
				<qti-hottext identifier="B">Item B</qti-hottext><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_B" show-hide="show" data-feedback-type="correct"><strong>Item B</strong> belongs to the target set — correct.</qti-feedback-inline>.</p>
			<p>The target set continues with
				<qti-hottext identifier="C">Item C</qti-hottext><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_C" show-hide="show" data-feedback-type="correct"><strong>Item C</strong> also belongs to the target set — correct.</qti-feedback-inline>,
				and the passage closes with a concluding remark,
				<qti-hottext identifier="D">Item D</qti-hottext><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_D" show-hide="show" data-feedback-type="incorrect"><strong>Item D</strong> is a concluding remark outside the target set.</qti-feedback-inline>.</p>
		</qti-hottext-interaction>
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

		<!-- Per-choice feedback: append each selected token's feedback identifier -->
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
					<qti-base-value base-type="identifier">B</qti-base-value>
					<qti-variable identifier="RESPONSE"/>
				</qti-member>
				<qti-set-outcome-value identifier="FEEDBACK">
					<qti-multiple>
						<qti-variable identifier="FEEDBACK"/>
						<qti-base-value base-type="identifier">RESPONSE_choice_B</qti-base-value>
					</qti-multiple>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>

		<qti-response-condition>
			<qti-response-if>
				<qti-member>
					<qti-base-value base-type="identifier">C</qti-base-value>
					<qti-variable identifier="RESPONSE"/>
				</qti-member>
				<qti-set-outcome-value identifier="FEEDBACK">
					<qti-multiple>
						<qti-variable identifier="FEEDBACK"/>
						<qti-base-value base-type="identifier">RESPONSE_choice_C</qti-base-value>
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
