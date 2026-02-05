// Match Interaction with Block Feedback

export const name = "Match Interaction - With Feedback";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0
https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0p1_v1p0.xsd"
identifier="match-feedback" title="Match Interaction - With Feedback"
adaptive="false" time-dependent="false" xml:lang="en">

  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair">
    <qti-correct-response>
      <qti-value>itemA targetX</qti-value>
      <qti-value>itemB targetY</qti-value>
      <qti-value>itemC targetZ</qti-value>
    </qti-correct-response>
  </qti-response-declaration>

  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>3.0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="multiple" base-type="identifier"/>

  <qti-item-body>
    <qti-match-interaction response-identifier="RESPONSE" shuffle="true" max-associations="3">
      <qti-prompt>Match each item on the left to its corresponding target on the right.</qti-prompt>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="itemA" match-max="1">Item A text</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="itemB" match-max="1">Item B text</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="itemC" match-max="1">Item C text</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="targetX" match-max="1">Target X text</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="targetY" match-max="1">Target Y text</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="targetZ" match-max="1">Target Z text</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_correct" show-hide="show">
      <p><strong>Correct!</strong> All matches are correct.</p>
      <ul>
        <li>Item A matches Target X because [explanation]</li>
        <li>Item B matches Target Y because [explanation]</li>
        <li>Item C matches Target Z because [explanation]</li>
      </ul>
    </qti-feedback-block>

    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RESPONSE_incorrect" show-hide="show">
      <p><strong>Incorrect.</strong> Some matches are wrong. The correct pairings are:</p>
      <ul>
        <li>Item A → Target X</li>
        <li>Item B → Target Y</li>
        <li>Item C → Target Z</li>
      </ul>
    </qti-feedback-block>
  </qti-item-body>

  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">1</qti-base-value>
        </qti-set-outcome-value>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_correct</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK">
          <qti-multiple>
            <qti-variable identifier="FEEDBACK"/>
            <qti-base-value base-type="identifier">RESPONSE_incorrect</qti-base-value>
          </qti-multiple>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>

  <qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="RESPONSE_correct">
    <qti-content-body>
      <p><strong>All correct!</strong> You successfully matched all items.</p>
    </qti-content-body>
  </qti-modal-feedback>

  <qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="RESPONSE_incorrect">
    <qti-content-body>
      <p><strong>Some incorrect.</strong> Review the correct pairings shown below the interaction.</p>
    </qti-content-body>
  </qti-modal-feedback>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['match'];
