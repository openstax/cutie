import './TopicScores.css';

interface TopicScoresProps {
  history: {
    topic: string;
    questions: { result: 'correct' | 'incorrect' | 'partial-credit' }[];
  }[];
  currentQuiz: {
    topic: string;
    questions: { result?: 'correct' | 'incorrect' | 'partial-credit' }[];
  } | null;
}

interface TopicRow {
  topic: string;
  correct: number;
  incorrect: number;
  partial: number;
  total: number;
}

function buildRows(
  history: TopicScoresProps['history'],
  currentQuiz: TopicScoresProps['currentQuiz'],
): TopicRow[] {
  const rows: TopicRow[] = [];

  for (const quiz of history) {
    const row: TopicRow = { topic: quiz.topic, correct: 0, incorrect: 0, partial: 0, total: quiz.questions.length };
    for (const q of quiz.questions) {
      if (q.result === 'correct') row.correct++;
      else if (q.result === 'partial-credit') row.partial++;
      else row.incorrect++;
    }
    rows.push(row);
  }

  if (currentQuiz) {
    const row: TopicRow = { topic: currentQuiz.topic, correct: 0, incorrect: 0, partial: 0, total: currentQuiz.questions.length };
    for (const q of currentQuiz.questions) {
      if (q.result === 'correct') row.correct++;
      else if (q.result === 'partial-credit') row.partial++;
      else if (q.result === 'incorrect') row.incorrect++;
      // undefined result = unanswered, counted in total but not in any bucket
    }
    rows.push(row);
  }

  // Filter out rows with no answered questions, then reverse so newest is first
  return rows.filter(r => r.correct + r.incorrect + r.partial > 0).reverse();
}

export function TopicScores({ history, currentQuiz }: TopicScoresProps) {
  const rows = buildRows(history, currentQuiz);

  if (rows.length === 0) return null;

  return (
    <div className="topic-scores">
      <h3 className="topic-scores-heading">Topic Scores</h3>
      {rows.map((row, i) => {
        const score = row.correct + row.partial * 0.5;
        const pct = Math.round((score / row.total) * 100);
        const correctPct = (row.correct / row.total) * 100;
        const incorrectPct = (row.incorrect / row.total) * 100;
        const partialPct = (row.partial / row.total) * 100;

        return (
          <div className="topic-row" key={`${row.topic}-${i}`}>
            <span className="topic-name" title={row.topic}>{row.topic}</span>
            <span className="topic-fraction">{score % 1 === 0 ? score : score.toFixed(1)}/{row.total}</span>
            <div
              className="topic-bar"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${row.topic}: ${pct}%`}
            >
              <div className="topic-bar-correct" style={{ width: `${correctPct}%` }} />
              <div className="topic-bar-partial" style={{ width: `${partialPct}%` }} />
              <div className="topic-bar-incorrect" style={{ width: `${incorrectPct}%` }} />
            </div>
            <span className="topic-pct">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
