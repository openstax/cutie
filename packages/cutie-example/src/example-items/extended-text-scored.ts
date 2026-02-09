export const name = "Extended Text - AI Scored";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="extendedTextScored"
                     title="Photosynthesis Essay"
                     adaptive="false"
                     time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                           external-scored="human" normal-maximum="5.0"/>
  <qti-item-body>
    <p>Explain the process of photosynthesis, including the roles of sunlight, water,
       and carbon dioxide. Describe where in the plant this process occurs and what
       products are generated.</p>
    <qti-rubric-block view="scorer">
      <p><strong>Scoring Rubric (5 points):</strong></p>
      <ul>
        <li><strong>5 points:</strong> Comprehensive explanation covering light-dependent and
            light-independent reactions, mentions chloroplasts/thylakoids/stroma, correctly
            identifies all reactants (CO₂, H₂O, light) and products (glucose, O₂), and
            demonstrates clear understanding of energy transformation.</li>
        <li><strong>4 points:</strong> Accurate explanation of the overall process with most key
            details. May be missing one minor component or lack depth in one area.</li>
        <li><strong>3 points:</strong> Demonstrates basic understanding of photosynthesis. Identifies
            the main reactants and products but may have incomplete or slightly inaccurate details
            about where or how the process occurs.</li>
        <li><strong>2 points:</strong> Partial understanding shown. Mentions some correct elements
            but has significant gaps or misconceptions.</li>
        <li><strong>1 point:</strong> Minimal understanding. Only one or two correct facts mentioned,
            with major gaps or errors.</li>
        <li><strong>0 points:</strong> No relevant information provided or entirely incorrect.</li>
      </ul>
    </qti-rubric-block>
    <qti-extended-text-interaction response-identifier="RESPONSE" expected-length="300">
      <qti-prompt>Write your response below (aim for 3-5 sentences).</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['extended-text'];
