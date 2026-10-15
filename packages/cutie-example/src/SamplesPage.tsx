import { useMemo, useState } from 'react';
import { marked } from 'marked';
import { sampleGroups } from '@openstax/cutie-samples';
import type { Sample, SampleGroup } from '@openstax/cutie-samples';
import { ArrowBackIcon } from './icons';
import { SampleWidget } from './SampleWidget';
import { Tabs, TabList, TabPanel } from './Tabs';
import './App.css';
import './SamplesPage.css';

// The guidance is our own trusted Markdown, so its HTML is safe to render
const useMarkdown = (markdown: string) => useMemo(() => marked.parse(markdown, { async: false }), [markdown]);

/** The set named by the `set` query param, else the set holding the linked sample, else the first set. */
function initialGroupId(): string {
  const setParam = new URLSearchParams(window.location.search).get('set');
  const sampleId = window.location.hash.slice(1);
  const group = sampleGroups.find(g => g.id === setParam)
    ?? sampleGroups.find(g => g.samples.some(sample => sample.id === sampleId))
    ?? sampleGroups[0];
  return group.id;
}

function SampleSection({ sample }: { sample: Sample }) {
  const descriptionHtml = useMarkdown(sample.description);
  const headingId = `${sample.id}-heading`;

  return (
    <section id={sample.id} className="sample-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{sample.name}</h2>
      <p className="sample-summary">{sample.summary}</p>
      <div className="sample-columns">
        <div className="sample-description" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        <SampleWidget sample={sample} />
      </div>
    </section>
  );
}

function SampleGroupPanel({ group }: { group: SampleGroup }) {
  const descriptionHtml = useMarkdown(group.description);

  return (
    <>
      <div className="samples-group-description" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />

      {group.samples.length === 0 ? (
        <p className="samples-empty">There are no samples in this set yet.</p>
      ) : (
        <>
          <nav aria-labelledby={`${group.id}-index-heading`}>
            <h2 id={`${group.id}-index-heading`}>Item formats</h2>
            <ul className="samples-index">
              {group.samples.map(sample => (
                <li key={sample.id}>
                  <a href={`#${sample.id}`}>{sample.name}</a>
                  <span className="samples-index-summary">{sample.summary}</span>
                </li>
              ))}
            </ul>
          </nav>

          {group.samples.map(sample => <SampleSection key={sample.id} sample={sample} />)}
        </>
      )}
    </>
  );
}

/**
 * OpenStax's item templates, one tab per sample set: an index of the set's item
 * formats, then each format's authoring guidance beside a live example item.
 */
export function SamplesPage() {
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);
  const tabs = sampleGroups.map(group => ({
    id: group.id,
    label: group.label,
    content: <SampleGroupPanel group={group} />,
  }));

  const handleGroupChange = (id: string) => {
    setActiveGroupId(id);
    // Keep the selected set in the URL so it survives reloads and can be shared
    const url = new URL(window.location.href);
    url.searchParams.set('set', id);
    url.hash = '';
    window.history.replaceState(null, '', url);
  };

  return (
    <div className="samples-page">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="samples-header">
        <a href="./" className="samples-back-link">
          <ArrowBackIcon /> Back to Cutie
        </a>
      </header>
      <main id="main-content" className="samples-content">
        <h1>OpenStax Item Templates</h1>
        <p className="samples-intro">
          These are OpenStax's opinionated default templates for assessment items, one for
          each item format. Each shows how we write the question, feedback, and scoring for
          that format.
        </p>

        <Tabs tabs={tabs} activeTab={activeGroupId} onTabChange={handleGroupChange}>
          <div className="samples-tabs">
            <TabList ariaLabel="Sample sets" />
          </div>
          <TabPanel />
        </Tabs>
      </main>
    </div>
  );
}
