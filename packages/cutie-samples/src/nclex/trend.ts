/* spell-checker: ignore ketoacidosis hypokalemia */
import type { Sample } from '../types.js';
import { clientRecord, clinicalScenario } from './conventions.js';

const description = `\
NCLEX trend: a style of stimulus, not an interaction of its own. The client \
record shows the client's condition at several time points, and the question \
can only be answered by comparing them, such as deciding which findings show \
improvement, which show decline, or what the nurse should do next.

A trend question can use any of these NCLEX types. Follow that type's sample \
for the interaction, feedback, and scoring, and add the trend stimulus described \
below:

- Multiple Response: Select All That Apply (\`nclex-select-all\`)
- Multiple Response: Select N (\`nclex-select-n\`)
- Multiple Response: Grouping (\`nclex-grouping\`)
- Matrix Multiple-Choice (\`nclex-matrix-multiple-choice\`)
- Drop-Down: Cloze (\`nclex-drop-down-cloze\`)
- Drop-Down: Rationale (\`nclex-drop-down-rationale\`, \
\`nclex-drop-down-rationale-triad\`)
- Drop-Down: Table (\`nclex-drop-down-table\`)
- Drag-and-Drop: Cloze (\`nclex-drag-and-drop-cloze\`)
- Drag-and-Drop: Rationale (\`nclex-drag-and-drop-rationale\`)
- Text Highlight: Passage (\`nclex-highlight-passage\`)
- Text Highlight: Table (\`nclex-highlight-table\`)

Don't use bowtie for a trend question.

Trend stimulus:

- ${clinicalScenario} Say when the client's care started and when the nurse \
reviews the record.
- ${clientRecord}
- Place the record and the question side by side in a \`div\` with class \
\`qti-layout-row\`: the record in a \`div\` with class \`qti-layout-col7\` on the \
left, and the interaction in a \`div\` with class \`qti-layout-col5\` on the right. \
The worked solution goes after the layout row.
- Use at least 3 time points, and the same ones in every tab that changes over \
time. In nurses' notes, give each entry an \`h4\` with its time on the 24-hour \
clock, such as "0900".
- Include findings that change in different directions: some that improve, at \
least one that gets worse, and at least one that stays the same. A finding can \
improve without reaching the normal range.
- Ask about the latest time point, and word options as the finding at that time \
without saying how it changed, such as "Blood glucose 212 mg/dL" rather than \
"Blood glucose has fallen", so the learner has to compare it with earlier values.
- The worked solution walks through each finding's change across the time points.

This sample uses Multiple Response: Select All That Apply (\`nclex-select-all\`).`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-trend" title="Treating Diabetic Ketoacidosis"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response>
      <qti-value>choiceA</qti-value>
      <qti-value>choiceB</qti-value>
      <qti-value>choiceC</qti-value>
      <qti-value>choiceD</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" upper-bound="4" default-value="-1">
      <qti-map-entry map-key="choiceA" mapped-value="1"/>
      <qti-map-entry map-key="choiceB" mapped-value="1"/>
      <qti-map-entry map-key="choiceC" mapped-value="1"/>
      <qti-map-entry map-key="choiceD" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>4.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client with type 1 diabetes was admitted at 0600 with diabetic ketoacidosis. The client has been receiving an IV insulin infusion and IV 0.9% sodium chloride since admission. At 1200 the nurse reviews the client's record.</p>
    <div class="qti-layout-row">
      <div class="qti-layout-col7">
        <div class="cutie-tab-container" aria-label="Client record">
          <section>
            <h3>Nurses' Notes</h3>
            <h4>0600</h4>
            <p>The client is drowsy but answers questions when spoken to. Breathing is deep and rapid, and the breath has a fruity odor. Mucous membranes are dry. The client reports nausea and has vomited twice since arriving.</p>
            <h4>0900</h4>
            <p>The client is awake and answering questions but reports feeling tired. Breathing is still deep but slower. Nausea is easing, with no further vomiting. The client has voided 400 mL.</p>
            <h4>1200</h4>
            <p>The client is alert and oriented and is asking for something to drink. Breathing is even and unlabored. Mucous membranes are moist. The client reports that their leg muscles feel weak and heavy.</p>
          </section>
          <section>
            <h3>Vital Signs</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Vital sign</th>
                  <th scope="col">0600</th>
                  <th scope="col">0900</th>
                  <th scope="col">1200</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Heart rate</th>
                  <td>122 beats/minute</td>
                  <td>108 beats/minute</td>
                  <td>92 beats/minute</td>
                </tr>
                <tr>
                  <th scope="row">Blood pressure</th>
                  <td>94/58 mm Hg</td>
                  <td>104/64 mm Hg</td>
                  <td>116/72 mm Hg</td>
                </tr>
                <tr>
                  <th scope="row">Respiratory rate</th>
                  <td>30 breaths/minute</td>
                  <td>24 breaths/minute</td>
                  <td>18 breaths/minute</td>
                </tr>
                <tr>
                  <th scope="row">Temperature</th>
                  <td>98.8°F (37.1°C)</td>
                  <td>98.4°F (36.9°C)</td>
                  <td>98.6°F (37.0°C)</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h3>Laboratory Results</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">Test</th>
                  <th scope="col">0600</th>
                  <th scope="col">0900</th>
                  <th scope="col">1200</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Blood glucose</th>
                  <td>524 mg/dL</td>
                  <td>338 mg/dL</td>
                  <td>212 mg/dL</td>
                </tr>
                <tr>
                  <th scope="row">Arterial pH</th>
                  <td>7.12</td>
                  <td>7.21</td>
                  <td>7.32</td>
                </tr>
                <tr>
                  <th scope="row">Bicarbonate</th>
                  <td>9 mEq/L</td>
                  <td>13 mEq/L</td>
                  <td>18 mEq/L</td>
                </tr>
                <tr>
                  <th scope="row">Anion gap</th>
                  <td>26 mEq/L</td>
                  <td>19 mEq/L</td>
                  <td>13 mEq/L</td>
                </tr>
                <tr>
                  <th scope="row">Potassium</th>
                  <td>5.6 mEq/L</td>
                  <td>4.1 mEq/L</td>
                  <td>3.2 mEq/L</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
      <div class="qti-layout-col5">
        <qti-choice-interaction response-identifier="RESPONSE" shuffle="true" min-choices="1" max-choices="0">
          <qti-prompt>Which findings at 1200 indicate that the client's condition is improving? Select all that apply.</qti-prompt>
          <qti-simple-choice identifier="choiceA">
            <p>Respiratory rate 18 breaths/minute, even and unlabored</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceA" show-hide="show">
              <qti-content-body>
                <p>The deep, rapid breathing at 0600 was the body blowing off carbon dioxide to make up for the acidosis. As the acidosis resolves, the client no longer needs to breathe that way, so the rate has fallen from 30 to 18 breaths/minute and the breathing is now even. This shows improvement.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceB">
            <p>Blood glucose 212 mg/dL</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceB" show-hide="show">
              <qti-content-body>
                <p>Blood glucose has fallen steadily from 524 to 338 to 212 mg/dL. It is still above the normal range, but a gradual drop is the goal of insulin therapy, so this shows improvement.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceC">
            <p>Arterial pH 7.32</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceC" show-hide="show">
              <qti-content-body>
                <p>The pH has risen from 7.12 to 7.21 to 7.32 as the bicarbonate rose and the anion gap narrowed. It is still slightly below the normal range of 7.35 to 7.45, but the acidosis is resolving, so this shows improvement.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceD">
            <p>Alert and oriented</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceD" show-hide="show">
              <qti-content-body>
                <p>The client was drowsy at 0600 and is now alert and oriented. Better mental status follows the correction of acidosis and dehydration, so this shows improvement.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceE">
            <p>Serum potassium 3.2 mEq/L</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceE" show-hide="show">
              <qti-content-body>
                <p>Insulin moves potassium from the blood into the cells, so potassium has fallen from 5.6 to 4.1 to 3.2 mEq/L. A level below 3.5 mEq/L is hypokalemia, which can cause dangerous heart rhythms. This finding is getting worse and needs to be reported.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceF">
            <p>Reports weak, heavy leg muscles</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceF" show-hide="show">
              <qti-content-body>
                <p>This complaint is new at 1200. Muscle weakness is a sign of hypokalemia, so it goes along with the falling potassium and shows the client's condition getting worse, not better.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
          <qti-simple-choice identifier="choiceG">
            <p>Temperature 98.6°F (37.0°C)</p>
            <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_choice_choiceG" show-hide="show">
              <qti-content-body>
                <p>The temperature has been within normal limits at every time point. A value that was never abnormal hasn't improved, so it doesn't show the client's condition getting better.</p>
              </qti-content-body>
            </qti-feedback-block>
          </qti-simple-choice>
        </qti-choice-interaction>
      </div>
    </div>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Compare each finding at 1200 with the same finding at 0600 and 0900. Treatment for diabetic ketoacidosis replaces fluid and gives insulin to lower the blood glucose and stop the body from making ketones. Breathing has slowed from 30 to 18 breaths/minute and is no longer deep, because the client no longer needs to make up for the acidosis. Blood glucose has fallen from 524 to 212 mg/dL, and the pH has risen from 7.12 to 7.32. Neither is normal yet, but both are moving steadily toward normal, which is the goal. The client has gone from drowsy to alert and oriented. Insulin also moves potassium into the cells, and potassium has fallen from 5.6 to 3.2 mEq/L, below the normal range. Together with the new leg weakness, this shows hypokalemia developing, which is a decline that needs to be reported. The temperature was normal at every time point, so it hasn't changed. The findings that show improvement are the respiratory rate, the blood glucose, the pH, and the mental status.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
      </qti-sum>
    </qti-set-outcome-value>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceA</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceA</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceB</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceB</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceC</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceC</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceD</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceD</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceE</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceE</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceF</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceF</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>

    <qti-response-condition>
      <qti-response-if>
        <qti-member>
          <qti-base-value base-type="identifier">choiceG</qti-base-value>
          <qti-variable identifier="RESPONSE"/>
        </qti-member>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_choice_choiceG</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const trend: Sample = {
  id: 'nclex-trend',
  name: 'Trend',
  summary: 'NCLEX trend: a client record over several time points, asked with another NCLEX type (here select all that apply) and scored by that type\'s rule.',
  description,
  interactionTypes: ['choice'],
  item,
};
