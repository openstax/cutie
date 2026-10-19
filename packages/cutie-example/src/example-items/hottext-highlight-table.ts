// Source: Project Cutie
/* spell-checker: ignore Hottext hottext */

export const name = "Hottext Interaction - Highlighting Table";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"
                     identifier="hottext-highlight-table" title="Highlighting Table - Pre-Trip Vehicle Check" adaptive="false" time-dependent="false">
	<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
		<qti-correct-response>
			<qti-value>A</qti-value>
			<qti-value>B</qti-value>
			<qti-value>C</qti-value>
			<qti-value>E</qti-value>
		</qti-correct-response>
		<qti-mapping lower-bound="0" upper-bound="4" default-value="-1">
			<qti-map-entry map-key="A" mapped-value="1"/>
			<qti-map-entry map-key="B" mapped-value="1"/>
			<qti-map-entry map-key="C" mapped-value="1"/>
			<qti-map-entry map-key="E" mapped-value="1"/>
		</qti-mapping>
	</qti-response-declaration>
	<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
	<qti-item-body>
		<qti-rubric-block view="candidate" use="instructions">
			<qti-content-body>
				<p>Before a long drive, you check the dashboard.</p>
				<p>Click to indicate the readings that need attention before you go.</p>
			</qti-content-body>
		</qti-rubric-block>
		<qti-hottext-interaction response-identifier="RESPONSE" max-choices="0">
			<table>
				<caption>Dashboard Readings</caption>
				<thead>
					<tr>
						<th scope="col">Gauge</th>
						<th scope="col">Reading</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row">Fuel</th>
						<td><qti-hottext identifier="A">Nearly empty</qti-hottext></td>
					</tr>
					<tr>
						<th scope="row">Tire pressure</th>
						<td><qti-hottext identifier="B">18 PSI</qti-hottext></td>
					</tr>
					<tr>
						<th scope="row">Engine temperature</th>
						<td><qti-hottext identifier="C">Overheating</qti-hottext></td>
					</tr>
					<tr>
						<th scope="row">Oil level</th>
						<td><qti-hottext identifier="D">Full</qti-hottext></td>
					</tr>
					<tr>
						<th scope="row">Brake warning light</th>
						<td><qti-hottext identifier="E">Illuminated</qti-hottext></td>
					</tr>
				</tbody>
			</table>
		</qti-hottext-interaction>
	</qti-item-body>
	<qti-response-processing>
		<!-- Base score from the mapping: +1 per correct, -1 per incorrect, floored at 0 -->
		<qti-set-outcome-value identifier="SCORE">
			<qti-map-response identifier="RESPONSE"/>
		</qti-set-outcome-value>
		<!-- Select-all penalty: selecting every option (all 5: A-E) subtracts 2 from the
		     mapped score. Keep this count in sync with the number of qti-hottext choices. -->
		<qti-response-condition>
			<qti-response-if>
				<qti-equal tolerance-mode="exact">
					<qti-container-size>
						<qti-variable identifier="RESPONSE"/>
					</qti-container-size>
					<qti-base-value base-type="integer">5</qti-base-value>
				</qti-equal>
				<qti-set-outcome-value identifier="SCORE">
					<qti-subtract>
						<qti-variable identifier="SCORE"/>
						<qti-base-value base-type="float">2</qti-base-value>
					</qti-subtract>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>
		<!-- Floor the score at 0 (minimum score = zero) -->
		<qti-response-condition>
			<qti-response-if>
				<qti-lt>
					<qti-variable identifier="SCORE"/>
					<qti-base-value base-type="float">0</qti-base-value>
				</qti-lt>
				<qti-set-outcome-value identifier="SCORE">
					<qti-base-value base-type="float">0</qti-base-value>
				</qti-set-outcome-value>
			</qti-response-if>
		</qti-response-condition>
	</qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['hottext'];
