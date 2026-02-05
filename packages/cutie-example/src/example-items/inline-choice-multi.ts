// Multiple Inline Choice Interactions in Flowing Text

export const name = "Inline Choice - Multiple in Paragraph";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="inline-choice-multi" title="Inline Choice - Multiple in Paragraph"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE1" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>photosynthesis</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>sunlight</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-response-declaration identifier="RESPONSE3" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>oxygen</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>

  <qti-item-body>
    <p>Select the correct words to complete the paragraph about plant biology.</p>
    <p>
      Plants produce their own food through a process called
      <qti-inline-choice-interaction response-identifier="RESPONSE1" shuffle="true">
        <qti-inline-choice identifier="photosynthesis">photosynthesis</qti-inline-choice>
        <qti-inline-choice identifier="respiration">respiration</qti-inline-choice>
        <qti-inline-choice identifier="fermentation">fermentation</qti-inline-choice>
      </qti-inline-choice-interaction>.
      This process converts carbon dioxide and water into glucose using energy from
      <qti-inline-choice-interaction response-identifier="RESPONSE2" shuffle="true">
        <qti-inline-choice identifier="sunlight">sunlight</qti-inline-choice>
        <qti-inline-choice identifier="soil">soil</qti-inline-choice>
        <qti-inline-choice identifier="wind">wind</qti-inline-choice>
      </qti-inline-choice-interaction>.
      As a byproduct, plants release
      <qti-inline-choice-interaction response-identifier="RESPONSE3" shuffle="true">
        <qti-inline-choice identifier="oxygen">oxygen</qti-inline-choice>
        <qti-inline-choice identifier="nitrogen">nitrogen</qti-inline-choice>
        <qti-inline-choice identifier="methane">methane</qti-inline-choice>
      </qti-inline-choice-interaction>
      into the atmosphere, which is essential for animal life.
    </p>
  </qti-item-body>

  <qti-response-processing>
    <qti-set-outcome-value identifier="SCORE">
      <qti-sum>
        <qti-match>
          <qti-variable identifier="RESPONSE1"/>
          <qti-correct identifier="RESPONSE1"/>
        </qti-match>
        <qti-match>
          <qti-variable identifier="RESPONSE2"/>
          <qti-correct identifier="RESPONSE2"/>
        </qti-match>
        <qti-match>
          <qti-variable identifier="RESPONSE3"/>
          <qti-correct identifier="RESPONSE3"/>
        </qti-match>
      </qti-sum>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['inline-choice'];
