/* spell-checker: ignore enoxaparin colectomy hypovolemic hematocrit */
import {
  correctResponse,
  outcomes,
  responseProcessingOrder,
  shuffle,
  workedSolution,
} from '../standard/conventions.js';
import type { Sample } from '../types.js';
import { clientRecord, clinicalScenario, maxScore, sumMapResponses, zeroOneMappedScoring } from './conventions.js';

const description = `\
NCLEX bowtie: the condition the client is most likely experiencing in the center, \
two actions to take on one side, and two parameters to monitor on the other, each \
column filled from its own list of options. Use a \`qti-match-interaction\` with a \
\`qti-prompt\` and two \`qti-simple-match-set\` elements: the options first, then \
the three columns in the order Actions, Condition, Parameters. The response is a \
\`multiple\` cardinality \`directedPair\` of "option column" identifiers. Include 4 \
condition options, 5 action options, and 5 parameter options.

- ${clinicalScenario}
- ${clientRecord} Don't place the record beside the bowtie in a layout \
column; the bowtie needs the full width.
- Use the prompt "Complete the diagram by dragging from the choices below to \
specify what condition the client is most likely experiencing, 2 actions the nurse \
should take to address that condition, and 2 parameters the nurse should monitor \
to assess the client's progress."
- Give every option \`match-max="1"\` and a \`match-group\` naming the one column it \
belongs to, so each column gets its own list of options and an option can only be \
placed in its column.
- Mark each column \`fixed="true"\`, with \`match-min\` and \`match-max\` both set to \
the number of options it takes (2, 1, 2), so every slot must be filled before \
submitting and the columns keep their order when shuffled.
- Set \`max-associations\` to the total number of slots (5).
- ${shuffle}
- Don't add per-option feedback.
- ${workedSolution}
- ${zeroOneMappedScoring} Map each correct "option column" pair.
- ${sumMapResponses}
- ${responseProcessingOrder}
- ${correctResponse}
- ${outcomes}
- ${maxScore}`;

const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="sample-nclex-bowtie" title="Postoperative Hemorrhage"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>notifySurgeon actions</qti-value>
      <qti-value>fluidBolus actions</qti-value>
      <qti-value>hemorrhage condition</qti-value>
      <qti-value>bloodPressure parameters</qti-value>
      <qti-value>urineOutput parameters</qti-value>
    </qti-correct-response>
    <qti-mapping lower-bound="0" default-value="0">
      <qti-map-entry map-key="notifySurgeon actions" mapped-value="1"/>
      <qti-map-entry map-key="fluidBolus actions" mapped-value="1"/>
      <qti-map-entry map-key="hemorrhage condition" mapped-value="1"/>
      <qti-map-entry map-key="bloodPressure parameters" mapped-value="1"/>
      <qti-map-entry map-key="urineOutput parameters" mapped-value="1"/>
    </qti-mapping>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>5.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <p>A client is 8 hours postoperative after an open colectomy. The nurse reviews the client's record.</p>
    <div class="cutie-tab-container" aria-label="Client record">
      <section>
        <h3>Nurses' Notes</h3>
        <p>The client reports feeling dizzy and anxious. The abdominal dressing is saturated with bright red blood. The skin is cool and clammy. Urine output has been 15 mL/hour for the past 2 hours.</p>
      </section>
      <section>
        <h3>Vital Signs</h3>
        <table>
          <thead>
            <tr>
              <th scope="col">Vital sign</th>
              <th scope="col">Before surgery</th>
              <th scope="col">Now</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Heart rate</th>
              <td>78 beats/minute</td>
              <td>124 beats/minute</td>
            </tr>
            <tr>
              <th scope="row">Blood pressure</th>
              <td>128/76 mm Hg</td>
              <td>84/50 mm Hg</td>
            </tr>
            <tr>
              <th scope="row">Respiratory rate</th>
              <td>16 breaths/minute</td>
              <td>24 breaths/minute</td>
            </tr>
            <tr>
              <th scope="row">Temperature</th>
              <td>98.4°F (36.9°C)</td>
              <td>97.8°F (36.6°C)</td>
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
              <th scope="col">Before surgery</th>
              <th scope="col">Now</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Hemoglobin</th>
              <td>12.9 g/dL</td>
              <td>8.1 g/dL</td>
            </tr>
            <tr>
              <th scope="row">Hematocrit</th>
              <td>39%</td>
              <td>25%</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
    <qti-match-interaction response-identifier="RESPONSE" shuffle="true" max-associations="5">
      <qti-prompt>Complete the diagram by dragging from the choices below to specify what condition the client is most likely experiencing, 2 actions the nurse should take to address that condition, and 2 parameters the nurse should monitor to assess the client's progress.</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="notifySurgeon" match-max="1" match-group="actions">Notify the surgeon</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="fluidBolus" match-max="1" match-group="actions">Infuse the prescribed IV fluid bolus</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="ambulate" match-max="1" match-group="actions">Ambulate the client in the hallway</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="enoxaparin" match-max="1" match-group="actions">Administer the prescribed enoxaparin</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="highFowlers" match-max="1" match-group="actions">Place the client in high Fowler's position</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="hemorrhage" match-max="1" match-group="condition">Hemorrhage</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="sepsis" match-max="1" match-group="condition">Sepsis</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="pulmonaryEmbolism" match-max="1" match-group="condition">Pulmonary embolism</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="ileus" match-max="1" match-group="condition">Paralytic ileus</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="bloodPressure" match-max="1" match-group="parameters">Blood pressure</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="urineOutput" match-max="1" match-group="parameters">Hourly urine output</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="bowelSounds" match-max="1" match-group="parameters">Bowel sounds</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="temperature" match-max="1" match-group="parameters">Temperature</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="bloodGlucose" match-max="1" match-group="parameters">Blood glucose</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="actions" match-min="2" match-max="2" fixed="true">Actions to Take</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="condition" match-min="1" match-max="1" fixed="true">Condition</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="parameters" match-min="2" match-max="2" fixed="true">Parameters to Monitor</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>
    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="ITEM_completed" show-hide="show">
      <qti-content-body>
        <p>Start with the condition, since the actions and parameters depend on it. A saturated dressing with bright red blood, a hemoglobin that fell from 12.9 to 8.1 g/dL, and a falling blood pressure with a rising heart rate all point to hemorrhage, and the cool, clammy skin and low urine output show the client is going into hypovolemic shock. Sepsis would usually bring fever and warm, flushed skin, and is unlikely only 8 hours after surgery. Pulmonary embolism would cause sudden shortness of breath and chest pain but wouldn't explain the bleeding. Paralytic ileus causes abdominal distension and absent bowel sounds, not blood loss.</p>
        <p>The client is losing blood volume, so the nurse should notify the surgeon, who may need to return the client to surgery, and infuse the prescribed IV fluid bolus to restore circulating volume. Ambulating the client would worsen dizziness and raise the risk of a fall. Enoxaparin is an anticoagulant and would make the bleeding worse. High Fowler's position lowers blood flow to the brain in a client with low blood pressure.</p>
        <p>To tell whether the treatment is working, monitor blood pressure, which shows whether circulating volume is being restored, and hourly urine output, which shows whether the kidneys are getting enough blood flow. Bowel sounds, temperature, and blood glucose don't reflect blood loss or the response to fluid replacement.</p>
      </qti-content-body>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-map-response identifier="RESPONSE"/>
      </qti-sum>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="FEEDBACK">
      <qti-multiple>
        <qti-variable identifier="FEEDBACK"/>
        <qti-base-value base-type="identifier">ITEM_completed</qti-base-value>
      </qti-multiple>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const bowtie: Sample = {
  id: 'nclex-bowtie',
  name: 'Bowtie',
  summary: 'NCLEX bowtie: drag the most likely condition, 2 actions to take, and 2 parameters to monitor into a diagram, 1 point for each correct placement.',
  description,
  interactionTypes: ['match'],
  item,
};
