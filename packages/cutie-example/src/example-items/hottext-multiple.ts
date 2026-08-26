// Source: Project Cutie
/* spell-checker: ignore Hottext hottext */

export const name = "Hottext Interaction - Selecting Multiple";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
                     identifier="hottext-single" title="Selecting multiple items" adaptive="false" time-dependent="false">
	<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
		<qti-correct-response>
			<qti-value>B</qti-value>
                        <qti-value>C</qti-value>
		</qti-correct-response>
	</qti-response-declaration>
	<qti-outcome-declaration identifier="SCORE" cardinality="multiple" base-type="float">
		<qti-default-value>
			<qti-value>0</qti-value>
		</qti-default-value>
	</qti-outcome-declaration>
	<qti-item-body>
		<qti-rubric-block view="candidate" use="instructions">
			<qti-content-body>
				<p>Exactly one of the four marked items below belongs to the target set.
					Select <strong>Item C</strong>.</p>
			</qti-content-body>
		</qti-rubric-block>
		<qti-hottext-interaction response-identifier="RESPONSE" max-choices="2" min-choices="2">
			<p>The first paragraph introduces <qti-hottext identifier="A">Item A</qti-hottext>
		           as background context that sets up the discussion.</p>
			<p>The second paragraph presents <qti-hottext identifier="B">Item B</qti-hottext>
                           as a plausible but incorrect option.</p>
			<p>The third paragraph continues with <qti-hottext identifier="C">Item C</qti-hottext>,
                           which is in the target set and should be selected. It also contains
                           <qti-hottext identifier="D">Item D</qti-hottext> as a concluding remark outside the target set.</p>
		</qti-hottext-interaction>
	</qti-item-body>
	<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['hottext'];
