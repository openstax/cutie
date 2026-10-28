// Builds a QTI 3 content package (zip) of the sample items.
// Only item resources are included; no tests or sections.
// https://www.imsglobal.org/spec/qti/v3p0/impl#packaging-and-metadata
//
// Usage: node script/package-items.js [--group <id>]... [--output <file>]
/* spell-checker: ignore fflate imscp imscpv imsmanifest imsqti schemaversion xmlv */
import console from 'node:console';
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { strToU8, zipSync } from 'fflate';
import { sampleGroups } from '../dist/esm/index.js';

const { values } = parseArgs({
  options: {
    group: { type: 'string', short: 'g', multiple: true },
    output: { type: 'string', short: 'o' },
  },
});

const groupIds = values.group ?? sampleGroups.map(group => group.id);
const unknownIds = groupIds.filter(id => !sampleGroups.some(group => group.id === id));
if (unknownIds.length > 0) {
  const known = sampleGroups.map(group => group.id).join(', ');
  console.error(`Unknown sample group(s): ${unknownIds.join(', ')}. Available: ${known}`);
  process.exit(1);
}

const samples = sampleGroups
  .filter(group => groupIds.includes(group.id))
  .flatMap(group => group.samples);
const output = values.output ?? `cutie-samples-${groupIds.join('-')}.zip`;

const escapeXml = value => value.replace(/[<>&"']/g, char => `&#${char.charCodeAt(0)};`);

const itemPath = sample => `items/${sample.id}.xml`;

const resource = sample => `\
    <resource identifier="${escapeXml(sample.id)}" type="imsqti_item_xmlv3p0" href="${itemPath(sample)}">
      <file href="${itemPath(sample)}"/>
    </resource>`;

const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1
  https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd"
  identifier="cutie-samples-${escapeXml(groupIds.join('-'))}">
  <metadata>
    <schema>QTI Package</schema>
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>
${samples.map(resource).join('\n')}
  </resources>
</manifest>
`;

const files = {
  'imsmanifest.xml': strToU8(manifest),
  ...Object.fromEntries(samples.map(sample => [itemPath(sample), strToU8(sample.item)])),
};

writeFileSync(output, zipSync(files));
console.log(`Wrote ${samples.length} items to ${output}`);
