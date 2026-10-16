// cspell:ignore hottext
// Variant test: NCLEX-style trend item. A tabbed record (flat
// heading-delimited HTML in a cutie-tab-container) sits in a layout column
// beside a hottext interaction. Other QTI systems render the record as stacked
// headings and paragraphs.

export const name = "Trend - Tabbed Record";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-trend-tabs" title="Trend - Tabbed Record"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>TEMP</qti-value>
      <qti-value>SOIL</qti-value>
      <qti-value>VENT</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="3" default-value="-1">
      <qti-map-entry map-key="TEMP" mapped-value="1"/>
      <qti-map-entry map-key="SOIL" mapped-value="1"/>
      <qti-map-entry map-key="VENT" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>A grower is monitoring a greenhouse bench of tomato seedlings on a hot, sunny
      afternoon.</p>

    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Bench record">
          <h3>Bench Profile</h3>
          <p>Tomato seedlings, three weeks old, in 4-inch pots. Irrigation runs automatically
            at 0700 and 1500. The roof vent opens automatically above 85 °F; maintenance
            reported it sticking last week.</p>

          <h3>Grower's Notes</h3>
          <h4>1200</h4>
          <p>Seedlings upright with deep green leaves. Roof vent closed. Circulation fan
            running. Trays draining normally after the morning irrigation.</p>
          <h4>1300</h4>
          <p>A few seedlings drooping at the tips. Roof vent still closed. Circulation fan
            running.</p>
          <h4>1400</h4>
          <p>Most seedlings wilting, with lower leaves curling. Roof vent still closed.
            Potting mix pulling away from the edges of the pots. Circulation fan running.</p>

          <h3>Conditions</h3>
          <table>
            <thead>
              <tr><th>Time</th><th>Air temp</th><th>Humidity</th><th>Soil moisture</th><th>Fan</th></tr>
            </thead>
            <tbody>
              <tr><td>1200</td><td>82 °F</td><td>65%</td><td>40%</td><td>On</td></tr>
              <tr><td>1300</td><td>89 °F</td><td>52%</td><td>31%</td><td>On</td></tr>
              <tr><td>1400</td><td>96 °F</td><td>41%</td><td>22%</td><td>On</td></tr>
            </tbody>
          </table>

          <h3>Water Test</h3>
          <table>
            <thead>
              <tr><th>Test</th><th>0700</th><th>Target range</th></tr>
            </thead>
            <tbody>
              <tr><td>pH</td><td>6.4</td><td>5.8–6.8</td></tr>
              <tr><td>Conductivity</td><td>1.6 mS/cm</td><td>1.2–2.0 mS/cm</td></tr>
              <tr><td>Water temperature</td><td>68 °F</td><td>65–72 °F</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="qti-layout-col5">
        <qti-hottext-interaction response-identifier="RESPONSE" max-choices="3">
          <qti-prompt>The grower is preparing to call the greenhouse manager.
            Highlight the three highest-priority findings to report.</qti-prompt>
          <ul>
            <li><qti-hottext identifier="COLOR">Leaf color</qti-hottext></li>
            <li><qti-hottext identifier="TEMP">Air temperature</qti-hottext></li>
            <li><qti-hottext identifier="FAN">Circulation fan</qti-hottext></li>
            <li><qti-hottext identifier="SOIL">Soil moisture</qti-hottext></li>
            <li><qti-hottext identifier="PH">Water pH</qti-hottext></li>
            <li><qti-hottext identifier="VENT">Roof vent position</qti-hottext></li>
            <li><qti-hottext identifier="DRAIN">Tray drainage</qti-hottext></li>
          </ul>
        </qti-hottext-interaction>
      </div>
    </div>
  </qti-item-body>

  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response.xml"/>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['hottext'];
