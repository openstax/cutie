// cspell:ignore hottext microgreens poinsettias fullwidth
// Variant test: NCLEX-style trend items. Each numbered pair is a tabbed record
// (one <section> per tab in a cutie-tab-container) in a layout column beside one
// of the question types a trend can use (every NCLEX type except bowtie).
// Not scored here: SCORE is externally scored, so the item has no response
// processing and gives no verdict, but still shows its correct-answer key

export const name = "Trend - Question Types";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="variant-trend-tabs" title="Trend Question Types"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="R1" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>TEMP</qti-value>
      <qti-value>SOIL</qti-value>
      <qti-value>VENT</qti-value>
      <qti-value>WILT</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R2" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>PH</qti-value>
      <qti-value>PALE</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3_PESTS" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>WHITEFLY</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3_LEAVES" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>SPECKLE</qti-value>
      <qti-value>STICKY</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R3_CONDITIONS" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>HUMID</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R4" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>AIR IMPROVING</qti-value>
      <qti-value>LEAF WORSENING</qti-value>
      <qti-value>MOIST SAME</qti-value>
      <qti-value>ROOT_ZONE IMPROVING</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R5_CAUSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>WET</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R5_ACTION" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>PAUSE</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R6_RISK" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>DROUGHT</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R6_EVIDENCE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>FLOW</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R7_HUMIDITY" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>IMPROVED</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R7_LEAVES" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>IMPROVED</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R7_ROOTS" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>NO_CHANGE</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R7_BUDS" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>DECLINED</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R8" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>AIRFLOW G1</qti-value>
      <qti-value>HUMIDITY G2</qti-value>
      <qti-value>MOLD G3</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R9" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>LEGGY G1</qti-value>
      <qti-value>LIGHT G2</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R10" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>ROT</qti-value>
      <qti-value>SMELL</qti-value>
      <qti-value>SLUMP</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="R11" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>CHAMBER_TEMP</qti-value>
      <qti-value>GERMINATION</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" external-scored="externalMachine">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>

    <p><strong>Trend Question Types</strong></p>
    <p>Each pair below shows a tabbed record that changes over time beside one of the
      question types a trend item can use.</p>

    <!-- 1. Multiple Response: Select All That Apply -->
    <p><strong>1. Select all that apply</strong></p>
    <p>A grower is monitoring a bench of tomato seedlings on a hot, sunny afternoon.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Tomato bench record">
          <section>
            <h3>Bench Profile</h3>
            <p>Tomato seedlings, three weeks old, in 4-inch pots. Irrigation runs automatically
              at 0700 and 1500. The roof vent opens automatically above 85 °F; maintenance
              reported it sticking last week.</p>
          </section>
          <section>
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
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">1200</th><th scope="col">1300</th><th scope="col">1400</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Air temperature</th><td>82 °F</td><td>89 °F</td><td>96 °F</td></tr>
                <tr><th scope="row">Humidity</th><td>65%</td><td>52%</td><td>41%</td></tr>
                <tr><th scope="row">Soil moisture</th><td>40%</td><td>31%</td><td>22%</td></tr>
                <tr><th scope="row">Water pH</th><td>6.4</td><td>6.4</td><td>6.4</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-choice-interaction response-identifier="R1" shuffle="true" min-choices="1" max-choices="0">
          <qti-prompt>Which findings at 1400 should the grower report to the greenhouse manager?
            Select all that apply.</qti-prompt>
          <qti-simple-choice identifier="TEMP"><p>Air temperature 96 °F</p></qti-simple-choice>
          <qti-simple-choice identifier="SOIL"><p>Soil moisture 22%</p></qti-simple-choice>
          <qti-simple-choice identifier="VENT"><p>Roof vent closed</p></qti-simple-choice>
          <qti-simple-choice identifier="WILT"><p>Lower leaves curling</p></qti-simple-choice>
          <qti-simple-choice identifier="FAN"><p>Circulation fan running</p></qti-simple-choice>
          <qti-simple-choice identifier="PH"><p>Water pH 6.4</p></qti-simple-choice>
        </qti-choice-interaction>
      </div>
    </div>

    <!-- 2. Multiple Response: Select N -->
    <p><strong>2. Select N</strong></p>
    <p>A grower checks a raft of hydroponic lettuce every other day.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Lettuce raft record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Day 1</h4>
            <p>Heads firm and bright green. Roots white.</p>
            <h4>Day 3</h4>
            <p>Heads firm and green. Roots white.</p>
            <h4>Day 5</h4>
            <p>New leaves pale yellow between the veins. Older leaves still green. Roots white.</p>
          </section>
          <section>
            <h3>Solution Readings</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Day 1</th><th scope="col">Day 3</th><th scope="col">Day 5</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">pH</th><td>6.0</td><td>6.6</td><td>7.3</td></tr>
                <tr><th scope="row">Conductivity</th><td>1.4 mS/cm</td><td>1.3 mS/cm</td><td>1.4 mS/cm</td></tr>
                <tr><th scope="row">Water temperature</th><td>68 °F</td><td>69 °F</td><td>68 °F</td></tr>
                <tr><th scope="row">Dissolved oxygen</th><td>8.1 mg/L</td><td>7.9 mg/L</td><td>8.0 mg/L</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-choice-interaction response-identifier="R2" shuffle="true" min-choices="1" max-choices="2">
          <qti-prompt>Select the 2 findings on day 5 that require follow-up.</qti-prompt>
          <qti-simple-choice identifier="PH"><p>pH 7.3</p></qti-simple-choice>
          <qti-simple-choice identifier="PALE"><p>New leaves pale yellow between the veins</p></qti-simple-choice>
          <qti-simple-choice identifier="EC"><p>Conductivity 1.4 mS/cm</p></qti-simple-choice>
          <qti-simple-choice identifier="WATER"><p>Water temperature 68 °F</p></qti-simple-choice>
          <qti-simple-choice identifier="OXYGEN"><p>Dissolved oxygen 8.0 mg/L</p></qti-simple-choice>
        </qti-choice-interaction>
      </div>
    </div>

    <!-- 3. Multiple Response: Grouping -->
    <p><strong>3. Grouping</strong></p>
    <p>A grower scouts a cucumber bench for pests three times a week.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Cucumber bench record">
          <section>
            <h3>Scouting Notes</h3>
            <h4>Monday</h4>
            <p>Leaves clean. A few whiteflies on the sticky cards.</p>
            <h4>Wednesday</h4>
            <p>Light yellow speckles on a few upper leaves.</p>
            <h4>Friday</h4>
            <p>Speckles across most upper leaves. Sticky residue on lower leaves. New growth at
              the tips looks healthy.</p>
          </section>
          <section>
            <h3>Sticky Card Counts</h3>
            <table>
              <thead>
                <tr><th scope="col">Pest</th><th scope="col">Monday</th><th scope="col">Wednesday</th><th scope="col">Friday</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Whiteflies</th><td>3</td><td>9</td><td>24</td></tr>
                <tr><th scope="row">Thrips</th><td>2</td><td>2</td><td>1</td></tr>
                <tr><th scope="row">Fungus gnats</th><td>5</td><td>4</td><td>5</td></tr>
              </tbody>
            </table>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Monday</th><th scope="col">Wednesday</th><th scope="col">Friday</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Humidity</th><td>55%</td><td>68%</td><td>82%</td></tr>
                <tr><th scope="row">Night temperature</th><td>64 °F</td><td>63 °F</td><td>64 °F</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <p>For each area, select the findings on Friday that are getting worse. Select at least
          one finding in each area.</p>
        <table class="qti-fullwidth">
          <caption>Findings on Friday</caption>
          <thead>
            <tr><th scope="col">Area</th><th scope="col">Findings</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Pests</th>
              <td>
                <qti-choice-interaction response-identifier="R3_PESTS" shuffle="true" min-choices="1" max-choices="0">
                  <qti-simple-choice identifier="WHITEFLY"><p>Whiteflies 24 per card</p></qti-simple-choice>
                  <qti-simple-choice identifier="THRIPS"><p>Thrips 1 per card</p></qti-simple-choice>
                  <qti-simple-choice identifier="GNATS"><p>Fungus gnats 5 per card</p></qti-simple-choice>
                </qti-choice-interaction>
              </td>
            </tr>
            <tr>
              <th scope="row">Leaves</th>
              <td>
                <qti-choice-interaction response-identifier="R3_LEAVES" shuffle="true" min-choices="1" max-choices="0">
                  <qti-simple-choice identifier="SPECKLE"><p>Speckles across upper leaves</p></qti-simple-choice>
                  <qti-simple-choice identifier="STICKY"><p>Sticky residue on lower leaves</p></qti-simple-choice>
                  <qti-simple-choice identifier="TIPS"><p>Healthy new growth at the tips</p></qti-simple-choice>
                </qti-choice-interaction>
              </td>
            </tr>
            <tr>
              <th scope="row">Conditions</th>
              <td>
                <qti-choice-interaction response-identifier="R3_CONDITIONS" shuffle="true" min-choices="1" max-choices="0">
                  <qti-simple-choice identifier="HUMID"><p>Humidity 82%</p></qti-simple-choice>
                  <qti-simple-choice identifier="NIGHT"><p>Night temperature 64 °F</p></qti-simple-choice>
                </qti-choice-interaction>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Matrix Multiple-Choice -->
    <p><strong>4. Matrix multiple-choice</strong></p>
    <p>The heater over a basil bench failed overnight and was repaired at 0700.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Basil bench record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>0600</h4>
            <p>Leaves dark and limp. Heater off.</p>
            <h4>0900</h4>
            <p>Heater running. Leaves still limp. Black patches on a few leaf edges.</p>
            <h4>1200</h4>
            <p>Leaves firmer. Black, curled edges on most leaves.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">0600</th><th scope="col">0900</th><th scope="col">1200</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Air temperature</th><td>41 °F</td><td>55 °F</td><td>68 °F</td></tr>
                <tr><th scope="row">Root zone temperature</th><td>48 °F</td><td>52 °F</td><td>60 °F</td></tr>
                <tr><th scope="row">Soil moisture</th><td>45%</td><td>45%</td><td>45%</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-match-interaction class="qti-match-tabular" data-first-column-header="Finding at 1200" response-identifier="R4" shuffle="true" min-associations="4" max-associations="4">
          <qti-prompt>For each finding, specify whether it is improving, has not changed, or is
            getting worse.</qti-prompt>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="AIR" match-max="1">Air temperature 68 °F</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="LEAF" match-max="1">Black, curled leaf edges</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="MOIST" match-max="1">Soil moisture 45%</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="ROOT_ZONE" match-max="1">Root zone temperature 60 °F</qti-simple-associable-choice>
          </qti-simple-match-set>
          <qti-simple-match-set>
            <qti-simple-associable-choice identifier="IMPROVING" match-max="0" fixed="true">Improving</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="SAME" match-max="0" fixed="true">No change</qti-simple-associable-choice>
            <qti-simple-associable-choice identifier="WORSENING" match-max="0" fixed="true">Getting worse</qti-simple-associable-choice>
          </qti-simple-match-set>
        </qti-match-interaction>
      </div>
    </div>

    <!-- 5. Drop-Down: Cloze -->
    <p><strong>5. Drop-down cloze</strong></p>
    <p>A grower checks a tray of pepper seedlings each morning.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Pepper tray record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Day 1</h4>
            <p>Seedlings upright. Mix damp on top.</p>
            <h4>Day 2</h4>
            <p>Some seedlings drooping. Mix wet to the touch. Water pooling in the tray.</p>
            <h4>Day 3</h4>
            <p>Most seedlings drooping. Mix soggy. Lower stems darkening at the soil line.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Day 1</th><th scope="col">Day 2</th><th scope="col">Day 3</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Soil moisture</th><td>70%</td><td>82%</td><td>90%</td></tr>
                <tr><th scope="row">Irrigation</th><td>2 cycles</td><td>2 cycles</td><td>2 cycles</td></tr>
                <tr><th scope="row">Air temperature</th><td>74 °F</td><td>73 °F</td><td>74 °F</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <p>Complete the sentence by choosing from the lists of options.</p>
        <p>
          On day 3 the seedlings are most likely drooping because the mix is
          <qti-inline-choice-interaction response-identifier="R5_CAUSE" shuffle="true" required="true">
            <qti-inline-choice identifier="WET">too wet</qti-inline-choice>
            <qti-inline-choice identifier="DRY">too dry</qti-inline-choice>
            <qti-inline-choice identifier="COLD">too cold</qti-inline-choice>
          </qti-inline-choice-interaction>,
          so the grower should first
          <qti-inline-choice-interaction response-identifier="R5_ACTION" shuffle="true" required="true">
            <qti-inline-choice identifier="PAUSE">pause irrigation</qti-inline-choice>
            <qti-inline-choice identifier="FEED">add fertilizer</qti-inline-choice>
            <qti-inline-choice identifier="MORE">add an irrigation cycle</qti-inline-choice>
          </qti-inline-choice-interaction>.
        </p>
      </div>
    </div>

    <!-- 6. Drop-Down: Rationale -->
    <p><strong>6. Drop-down rationale</strong></p>
    <p>A strawberry bench is watered by drip emitters, one for each row.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Strawberry bench record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Monday</h4>
            <p>All rows healthy. New runners forming.</p>
            <h4>Wednesday</h4>
            <p>All rows healthy.</p>
            <h4>Friday</h4>
            <p>Plants in row 3 drooping in the afternoon. Other rows healthy.</p>
          </section>
          <section>
            <h3>Emitter Flow</h3>
            <table>
              <thead>
                <tr><th scope="col">Emitter</th><th scope="col">Monday</th><th scope="col">Wednesday</th><th scope="col">Friday</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Row 1</th><td>2.0 L/h</td><td>2.0 L/h</td><td>1.9 L/h</td></tr>
                <tr><th scope="row">Row 2</th><td>2.0 L/h</td><td>2.1 L/h</td><td>2.0 L/h</td></tr>
                <tr><th scope="row">Row 3</th><td>2.0 L/h</td><td>1.1 L/h</td><td>0.3 L/h</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <p>Complete the sentence by choosing from the lists of options.</p>
        <p>
          Row 3 is at highest risk for
          <qti-inline-choice-interaction response-identifier="R6_RISK" shuffle="true" required="true">
            <qti-inline-choice identifier="DROUGHT">drought stress</qti-inline-choice>
            <qti-inline-choice identifier="ROT">root rot</qti-inline-choice>
            <qti-inline-choice identifier="BURN">fertilizer burn</qti-inline-choice>
          </qti-inline-choice-interaction>
          as evidenced by
          <qti-inline-choice-interaction response-identifier="R6_EVIDENCE" shuffle="true" required="true">
            <qti-inline-choice identifier="FLOW">the falling emitter flow</qti-inline-choice>
            <qti-inline-choice identifier="RUNNERS">the new runners</qti-inline-choice>
            <qti-inline-choice identifier="OTHERS">the healthy plants in other rows</qti-inline-choice>
          </qti-inline-choice-interaction>.
        </p>
      </div>
    </div>

    <!-- 7. Drop-Down: Table -->
    <p><strong>7. Drop-down table</strong></p>
    <p>A humidifier was added to an orchid bench three weeks ago.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Orchid bench record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Week 1</h4>
            <p>Leaves wrinkled. Roots silver-green. Six flower buds forming.</p>
            <h4>Week 2</h4>
            <p>Leaves smoother. Roots silver-green. Six buds.</p>
            <h4>Week 3</h4>
            <p>Leaves firm and smooth. Roots silver-green. Two buds yellowed and dropped.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Week 1</th><th scope="col">Week 2</th><th scope="col">Week 3</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Humidity</th><td>38%</td><td>52%</td><td>63%</td></tr>
                <tr><th scope="row">Day temperature</th><td>75 °F</td><td>76 °F</td><td>75 °F</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <p>For each finding, choose whether it has improved, has not changed, or has declined
          since week 1.</p>
        <table>
          <caption>Findings in week 3</caption>
          <thead>
            <tr><th scope="col">Finding</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Humidity</th>
              <td>
                <qti-inline-choice-interaction response-identifier="R7_HUMIDITY" shuffle="true" required="true">
                  <qti-inline-choice identifier="IMPROVED">Improved</qti-inline-choice>
                  <qti-inline-choice identifier="NO_CHANGE">No change</qti-inline-choice>
                  <qti-inline-choice identifier="DECLINED">Declined</qti-inline-choice>
                </qti-inline-choice-interaction>
              </td>
            </tr>
            <tr>
              <th scope="row">Leaves</th>
              <td>
                <qti-inline-choice-interaction response-identifier="R7_LEAVES" shuffle="true" required="true">
                  <qti-inline-choice identifier="IMPROVED">Improved</qti-inline-choice>
                  <qti-inline-choice identifier="NO_CHANGE">No change</qti-inline-choice>
                  <qti-inline-choice identifier="DECLINED">Declined</qti-inline-choice>
                </qti-inline-choice-interaction>
              </td>
            </tr>
            <tr>
              <th scope="row">Roots</th>
              <td>
                <qti-inline-choice-interaction response-identifier="R7_ROOTS" shuffle="true" required="true">
                  <qti-inline-choice identifier="IMPROVED">Improved</qti-inline-choice>
                  <qti-inline-choice identifier="NO_CHANGE">No change</qti-inline-choice>
                  <qti-inline-choice identifier="DECLINED">Declined</qti-inline-choice>
                </qti-inline-choice-interaction>
              </td>
            </tr>
            <tr>
              <th scope="row">Flower buds</th>
              <td>
                <qti-inline-choice-interaction response-identifier="R7_BUDS" shuffle="true" required="true">
                  <qti-inline-choice identifier="IMPROVED">Improved</qti-inline-choice>
                  <qti-inline-choice identifier="NO_CHANGE">No change</qti-inline-choice>
                  <qti-inline-choice identifier="DECLINED">Declined</qti-inline-choice>
                </qti-inline-choice-interaction>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 8. Drag-and-Drop: Cloze -->
    <p><strong>8. Drag-and-drop cloze</strong></p>
    <p>A grower checks trays of microgreens in a grow room each day.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Grow room record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Day 1</h4>
            <p>Seedlings even and upright. Fan on low.</p>
            <h4>Day 2</h4>
            <p>Fan turned off for cleaning and not restarted. White fuzz on two trays.</p>
            <h4>Day 3</h4>
            <p>White fuzz on five trays, with seedlings collapsing under it.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Day 1</th><th scope="col">Day 2</th><th scope="col">Day 3</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Humidity</th><td>60%</td><td>78%</td><td>88%</td></tr>
                <tr><th scope="row">Air temperature</th><td>70 °F</td><td>71 °F</td><td>70 °F</td></tr>
                <tr><th scope="row">Light</th><td>16 hours</td><td>16 hours</td><td>16 hours</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-gap-match-interaction response-identifier="R8" shuffle="true" min-associations="3">
          <qti-prompt>Complete the sentence by dragging an option into each blank.</qti-prompt>
          <qti-gap-text identifier="AIRFLOW" match-max="1">airflow</qti-gap-text>
          <qti-gap-text identifier="HUMIDITY" match-max="1">humidity</qti-gap-text>
          <qti-gap-text identifier="MOLD" match-max="1">mold</qti-gap-text>
          <qti-gap-text identifier="LIGHT" match-max="1">light</qti-gap-text>
          <qti-gap-text identifier="APHIDS" match-max="1">aphids</qti-gap-text>
          <qti-gap-text identifier="FERTILIZER" match-max="1">fertilizer</qti-gap-text>
          <p>
            The grower should restore <qti-gap identifier="G1"/> and lower
            <qti-gap identifier="G2"/> to stop the <qti-gap identifier="G3"/> from spreading.
          </p>
        </qti-gap-match-interaction>
      </div>
    </div>

    <!-- 9. Drag-and-Drop: Rationale -->
    <p><strong>9. Drag-and-drop rationale</strong></p>
    <p>Poinsettias were moved to a bench under a new shade cloth three weeks ago.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Poinsettia bench record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Week 1</h4>
            <p>Plants compact with short gaps between leaves.</p>
            <h4>Week 2</h4>
            <p>Stems a little longer between leaves.</p>
            <h4>Week 3</h4>
            <p>Stems long and thin, leaning toward the aisle. Leaves pale.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Week 1</th><th scope="col">Week 2</th><th scope="col">Week 3</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Daily light</th><td>12 mol/m²</td><td>8 mol/m²</td><td>5 mol/m²</td></tr>
                <tr><th scope="row">Water temperature</th><td>66 °F</td><td>66 °F</td><td>66 °F</td></tr>
                <tr><th scope="row">Humidity</th><td>55%</td><td>56%</td><td>55%</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-gap-match-interaction response-identifier="R9" shuffle="true" min-associations="2">
          <qti-prompt>Complete the sentence by dragging an option into each blank.</qti-prompt>
          <qti-gap-text identifier="LEGGY" match-max="1">long, weak stems</qti-gap-text>
          <qti-gap-text identifier="ROOT_ROT" match-max="1">root rot</qti-gap-text>
          <qti-gap-text identifier="SCORCH" match-max="1">leaf scorch</qti-gap-text>
          <qti-gap-text identifier="LIGHT" match-max="1">falling daily light</qti-gap-text>
          <qti-gap-text identifier="WATER_TEMP" match-max="1">steady water temperature</qti-gap-text>
          <qti-gap-text identifier="HUMIDITY" match-max="1">steady humidity</qti-gap-text>
          <p>
            The plants are developing <qti-gap identifier="G1"/> as evidenced by the
            <qti-gap identifier="G2"/>.
          </p>
        </qti-gap-match-interaction>
      </div>
    </div>

    <!-- 10. Text Highlight: Passage -->
    <p><strong>10. Highlight passage</strong></p>
    <p>A grower is watching a bench of potted mint after a week of heavy watering.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Mint bench record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Monday</h4>
            <p>Plants bushy and green. Roots white at the pot edges. Mix smells earthy.</p>
            <h4>Wednesday</h4>
            <p>Plants green. Some roots tan at the pot edges. Mix damp.</p>
          </section>
          <section>
            <h3>Conditions</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Monday</th><th scope="col">Wednesday</th><th scope="col">Friday</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Soil moisture</th><td>55%</td><td>72%</td><td>86%</td></tr>
                <tr><th scope="row">Air temperature</th><td>72 °F</td><td>71 °F</td><td>72 °F</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-hottext-interaction response-identifier="R10" min-choices="1" max-choices="0">
          <qti-prompt>Highlight the findings in the Friday note that show the bench getting
            worse.</qti-prompt>
          <p>
            Friday: <qti-hottext identifier="GREEN">Upper leaves green.</qti-hottext>
            <qti-hottext identifier="ROT">Roots brown and mushy at the pot edges.</qti-hottext>
            <qti-hottext identifier="SMELL">Mix smells sour.</qti-hottext>
            <qti-hottext identifier="TEMP">Air temperature 72 °F.</qti-hottext>
            <qti-hottext identifier="SLUMP">Stems slumping over the pot rims.</qti-hottext>
          </p>
        </qti-hottext-interaction>
      </div>
    </div>

    <!-- 11. Text Highlight: Table -->
    <p><strong>11. Highlight table</strong></p>
    <p>A tray of tomato seeds was sown in a germination chamber 5 days ago.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Germination chamber record">
          <section>
            <h3>Grower's Notes</h3>
            <h4>Day 1</h4>
            <p>Seeds sown and covered. Chamber set to 78 °F.</p>
            <h4>Day 3</h4>
            <p>First seedlings breaking the surface. Chamber thermostat clicking often.</p>
            <h4>Day 5</h4>
            <p>Few new seedlings since day 3.</p>
          </section>
          <section>
            <h3>Earlier Readings</h3>
            <table>
              <thead>
                <tr><th scope="col">Reading</th><th scope="col">Day 1</th><th scope="col">Day 3</th></tr>
              </thead>
              <tbody>
                <tr><th scope="row">Chamber temperature</th><td>78 °F</td><td>71 °F</td></tr>
                <tr><th scope="row">Humidity</th><td>90%</td><td>90%</td></tr>
                <tr><th scope="row">Seeds germinated</th><td>0%</td><td>35%</td></tr>
                <tr><th scope="row">Mix moisture</th><td>60%</td><td>58%</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-hottext-interaction response-identifier="R11" min-choices="1" max-choices="0">
          <qti-prompt>Highlight the day 5 readings that show a problem.</qti-prompt>
          <table>
            <caption>Day 5 readings</caption>
            <thead>
              <tr><th scope="col">Reading</th><th scope="col">Day 5</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Chamber temperature</th><td><qti-hottext identifier="CHAMBER_TEMP">63 °F</qti-hottext></td></tr>
              <tr><th scope="row">Humidity</th><td><qti-hottext identifier="HUMIDITY">90%</qti-hottext></td></tr>
              <tr><th scope="row">Seeds germinated</th><td><qti-hottext identifier="GERMINATION">38%</qti-hottext></td></tr>
              <tr><th scope="row">Mix moisture</th><td><qti-hottext identifier="MOISTURE">59%</qti-hottext></td></tr>
            </tbody>
          </table>
        </qti-hottext-interaction>
      </div>
    </div>

  </qti-item-body>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['choice', 'match', 'inline-choice', 'gap-match', 'hottext'];
