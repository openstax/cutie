import { useMemo } from 'react';
import { marked } from 'marked';
import { standard } from '@openstax/cutie-samples';
import type { Sample } from '@openstax/cutie-samples';
import { ArrowBackIcon } from './icons';
import { SampleWidget } from './SampleWidget';
import './App.css';
import './SamplesPage.css';

function SampleSection({ sample }: { sample: Sample }) {
  // The guidance is our own trusted Markdown, so its HTML is safe to render
  const descriptionHtml = useMemo(() => marked.parse(sample.description, { async: false }), [sample.description]);
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

/**
 * OpenStax's standard item templates: an index of the item formats, then each
 * format's authoring guidance beside a live example item.
 */
export function SamplesPage() {
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

        <nav aria-labelledby="samples-index-heading">
          <h2 id="samples-index-heading">Item formats</h2>
          <ul className="samples-index">
            {standard.samples.map(sample => (
              <li key={sample.id}>
                <a href={`#${sample.id}`}>{sample.name}</a>
                <span className="samples-index-summary">{sample.summary}</span>
              </li>
            ))}
          </ul>
        </nav>

        {standard.samples.map(sample => <SampleSection key={sample.id} sample={sample} />)}
      </main>
    </div>
  );
}
