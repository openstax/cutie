// Source: Project Cutie
/* spell-checker: ignore Hottext hottext */

export const name = "Hottext Interaction - Highlight Critical Findings";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
                     identifier="hottext-highlight-findings" title="Highlight Critical Findings" adaptive="false" time-dependent="false">
	<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
		<qti-correct-response>
			<qti-value>B</qti-value>
			<qti-value>D</qti-value>
			<qti-value>F</qti-value>
			<qti-value>G</qti-value>
		</qti-correct-response>
		<qti-mapping lower-bound="0" upper-bound="4" default-value="-1">
			<qti-map-entry map-key="B" mapped-value="1"/>
			<qti-map-entry map-key="D" mapped-value="1"/>
			<qti-map-entry map-key="F" mapped-value="1"/>
			<qti-map-entry map-key="G" mapped-value="1"/>
		</qti-mapping>
	</qti-response-declaration>
	<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
	<qti-item-body>
		<qti-rubric-block view="candidate" use="instructions">
			<qti-content-body>
				<p>A nurse is reviewing a client's wellness-visit notes. Highlight the statements
					that indicate the client needs follow-up teaching about healthy sleep habits.</p>
			</qti-content-body>
		</qti-rubric-block>
		<qti-hottext-interaction response-identifier="RESPONSE" max-choices="0">
                    <p>
                        <qti-hottext identifier="A">The client keeps a consistent bedtime on weeknights.</qti-hottext>
                        <qti-hottext identifier="B">The client drinks coffee in the late afternoon.</qti-hottext>
                        <qti-hottext identifier="C">The client dims the lights about an hour before bed.</qti-hottext>
		        <qti-hottext identifier="D">The client keeps the bedroom television on while falling asleep.</qti-hottext>
		        <qti-hottext identifier="E">The client keeps the bedroom cool and quiet.</qti-hottext>
		        <qti-hottext identifier="F">The client checks work email in bed each night.</qti-hottext>
		        <qti-hottext identifier="G">The client takes long naps in the early evening.</qti-hottext>
                        <qti-hottext identifier="H">The client goes for a short walk after dinner.</qti-hottext>
                    </p>
		</qti-hottext-interaction>
	</qti-item-body>
	<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['hottext'];
