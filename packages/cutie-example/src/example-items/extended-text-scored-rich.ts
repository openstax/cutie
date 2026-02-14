/* spell-checker: ignore mitochondria NADH FADH */
export const name = "Extended Text Rich - AI Scored";

export const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
                     identifier="extendedTextScoredRich"
                     title="Cell Respiration Essay"
                     adaptive="false"
                     time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"
                           external-scored="human" normal-maximum="5.0"/>
  <qti-item-body>
    <p>Describe the process of cellular respiration, including glycolysis, the citric acid
       cycle, and the electron transport chain. Explain where each stage occurs within the
       cell and what molecules are produced at each step.</p>
    <qti-rubric-block view="scorer">
      <p><strong>Scoring Rubric (5 points):</strong></p>
      <ul>
        <li><strong>5 points:</strong> Thorough explanation of all three stages with correct
            locations (cytoplasm for glycolysis, mitochondria matrix for citric acid cycle,
            inner mitochondrial membrane for ETC). Accurately identifies inputs and outputs
            at each stage (ATP, NADH, FADH2, CO2, H2O). Demonstrates understanding of the
            overall energy yield.</li>
        <li><strong>4 points:</strong> Covers all three stages accurately with most key details.
            May omit one minor product or location detail.</li>
        <li><strong>3 points:</strong> Demonstrates basic understanding of cellular respiration.
            Identifies the main stages and some products but may confuse locations or miss
            intermediate molecules.</li>
        <li><strong>2 points:</strong> Partial understanding shown. Mentions some correct elements
            but has significant gaps or mixes up details between stages.</li>
        <li><strong>1 point:</strong> Minimal understanding. Only one or two correct facts mentioned,
            with major gaps or errors.</li>
        <li><strong>0 points:</strong> No relevant information provided or entirely incorrect.</li>
      </ul>
    </qti-rubric-block>
    <qti-extended-text-interaction response-identifier="RESPONSE" format="xhtml"
                                   data-min-characters="50" data-max-characters="2000"
                                   class="qti-counter-up qti-height-lines-15">
      <qti-prompt>Write your response below using the rich text editor. Use formatting such
                  as <strong>bold</strong> and <em>lists</em> to organize your answer.</qti-prompt>
    </qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

export const interactionTypes: string[] = ['extended-text'];
