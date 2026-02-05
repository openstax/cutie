import { useState } from 'react';
import { beginAttempt, submitResponse } from '@openstax/cutie-core';
import type { AttemptState, ProcessingOptions } from '@openstax/cutie-core';
import type { ResponseData } from '@openstax/cutie-client';
import { examples, exampleGroups } from './example-items';
import { EditorTab } from './EditorTab';
import { PreviewTab } from './PreviewTab';
import { GenerateDialog } from './GenerateDialog';
import { beginQuiz, continueQuiz, generateQtiItem } from './utils/ai';
import type { QuizResponse, InteractionType } from './utils/ai';
import './App.css';

/**
 * Asset resolver for the example app.
 * In development, Vite serves files from public/ at the root.
 * This resolver prepends '/' to relative paths to resolve them correctly.
 */
const resolveAssets: ProcessingOptions['resolveAssets'] = async (urls) => {
  return urls.map((url) => {
    // If already an absolute URL, data URL, or starts with /, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:')) {
      return url;
    }
    // Prepend / to make it resolve from public/
    return `/${url}`;
  });
};

type Tab = 'xml' | 'editor' | 'preview';

interface QuizQuestion {
  description: string;
  interactions: InteractionType[];
  xml?: string;
  result?: 'correct' | 'incorrect' | 'partial-credit';
}

interface QuizState {
  userTopic: string;
  currentQuiz: {
    topic: string;
    questions: QuizQuestion[];
  } | null;
  currentQuestionIndex: number;
  history: {
    topic: string;
    questions: { description: string; result: 'correct' | 'incorrect' | 'partial-credit' }[];
  }[];
  isActive: boolean;
}

const initialQuizState: QuizState = {
  userTopic: '',
  currentQuiz: null,
  currentQuestionIndex: 0,
  history: [],
  isActive: false,
};

const determineResult = (state: AttemptState): 'correct' | 'incorrect' | 'partial-credit' => {
  if (state.score === null || state.maxScore === null) return 'incorrect';
  if (state.score === state.maxScore) return 'correct';
  if (state.score === 0) return 'incorrect';
  return 'partial-credit';
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('xml');
  const [itemXml, setItemXml] = useState('');
  const [attemptState, setAttemptState] = useState<AttemptState | null>(null);
  const [sanitizedTemplate, setSanitizedTemplate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState<ResponseData | null>(null);
  const [selectedExample, setSelectedExample] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>(initialQuizState);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);

  const handleExampleSelect = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = event.target.value;

    if (!selectedName) {
      return;
    }

    // Confirm if there's existing content
    if (itemXml.trim() && !confirm('Loading an example will overwrite the current item. Continue?')) {
      // Reset select to placeholder
      setSelectedExample('');
      return;
    }

    const example = examples.find(ex => ex.name === selectedName);
    if (example) {
      setItemXml(example.item);

      // Auto-process the item
      setError('');
      setProcessing(true);
      try {
        const result = await beginAttempt(example.item, { resolveAssets });
        setAttemptState(result.state);
        setSanitizedTemplate(result.template);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setProcessing(false);
      }
    }

    // Reset select back to placeholder
    setSelectedExample('');
  };

  const handleAIGenerate = async (xml: string) => {
    setItemXml(xml);
    setGenerateDialogOpen(false);

    // Auto-process the generated item
    setError('');
    setProcessing(true);
    try {
      const result = await beginAttempt(xml, { resolveAssets });
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async () => {
    setError('');
    setProcessing(true);

    try {
      const result = await beginAttempt(itemXml, { resolveAssets });
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
      setResponses(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitResponses = async (newResponses: ResponseData) => {
    if (!attemptState || !itemXml) return;

    setResponses(newResponses);
    try {
      const result = await submitResponse(newResponses, attemptState, itemXml, { resolveAssets });
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error processing response');
    }
  };

  const handleResetAttempt = async () => {
    if (!itemXml) return;
    setError('');
    try {
      const result = await beginAttempt(itemXml, { resolveAssets });
      setAttemptState(result.state);
      setSanitizedTemplate(result.template);
      setResponses(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resetting attempt');
    }
  };

  const loadQuizQuestion = async (quiz: QuizResponse, questionIndex: number) => {
    const question = quiz.questions[questionIndex];
    if (!question) return;

    // Generate XML if not already generated
    let xml = (question as QuizQuestion).xml;
    if (!xml) {
      const prompt = `${quiz.topic}: ${question.description}`;
      xml = await generateQtiItem(prompt, question.interactions);
    }

    // Process the item
    const result = await beginAttempt(xml, { resolveAssets });
    setItemXml(xml);
    setAttemptState(result.state);
    setSanitizedTemplate(result.template);
    setResponses(null);

    return xml;
  };

  const handleStartQuiz = async (topic: string) => {
    setGenerateDialogOpen(false);
    setError('');
    setProcessing(true);

    try {
      const quizResponse = await beginQuiz(topic);
      console.log('Quiz structure:', quizResponse);

      const newQuizState: QuizState = {
        userTopic: topic,
        currentQuiz: {
          topic: quizResponse.topic,
          questions: quizResponse.questions.map(q => ({
            description: q.description,
            interactions: q.interactions,
          })),
        },
        currentQuestionIndex: 0,
        history: quizState.history,
        isActive: true,
      };

      setQuizState(newQuizState);

      // Generate and load first question
      const xml = await loadQuizQuestion(quizResponse, 0);
      if (xml && newQuizState.currentQuiz) {
        newQuizState.currentQuiz.questions[0].xml = xml;
        setQuizState({ ...newQuizState });
      }

      setActiveTab('preview');
    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setProcessing(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!quizState.currentQuiz || !attemptState) return;

    setIsLoadingNextQuestion(true);
    setError('');

    try {
      // Record result of current question
      const result = determineResult(attemptState);
      const currentQuestion = quizState.currentQuiz.questions[quizState.currentQuestionIndex];
      currentQuestion.result = result;

      const nextIndex = quizState.currentQuestionIndex + 1;

      if (nextIndex < quizState.currentQuiz.questions.length) {
        // Load next question from current quiz
        const xml = await loadQuizQuestion(
          { topic: quizState.currentQuiz.topic, questions: quizState.currentQuiz.questions },
          nextIndex
        );
        if (xml) {
          quizState.currentQuiz.questions[nextIndex].xml = xml;
        }
        setQuizState({
          ...quizState,
          currentQuestionIndex: nextIndex,
        });
      } else {
        // Quiz complete, add to history and continue with new questions
        const completedQuiz = {
          topic: quizState.currentQuiz.topic,
          questions: quizState.currentQuiz.questions.map(q => ({
            description: q.description,
            result: q.result || 'incorrect',
          })),
        };

        const newHistory = [...quizState.history, completedQuiz];

        // Get more questions
        const quizResponse = await continueQuiz(quizState.userTopic, newHistory);
        console.log('Continue quiz response:', quizResponse);

        const newQuizState: QuizState = {
          ...quizState,
          currentQuiz: {
            topic: quizResponse.topic,
            questions: quizResponse.questions.map(q => ({
              description: q.description,
              interactions: q.interactions,
            })),
          },
          currentQuestionIndex: 0,
          history: newHistory,
        };

        setQuizState(newQuizState);

        // Load first question of new quiz
        const xml = await loadQuizQuestion(quizResponse, 0);
        if (xml && newQuizState.currentQuiz) {
          newQuizState.currentQuiz.questions[0].xml = xml;
          setQuizState({ ...newQuizState });
        }
      }
    } catch (err) {
      console.error('Next question error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load next question');
    } finally {
      setIsLoadingNextQuestion(false);
    }
  };

  const handleEndQuiz = () => {
    // Record final result if there's a current attempt
    if (quizState.currentQuiz && attemptState) {
      const result = determineResult(attemptState);
      const currentQuestion = quizState.currentQuiz.questions[quizState.currentQuestionIndex];
      currentQuestion.result = result;

      // Add partial quiz to history
      const partialQuiz = {
        topic: quizState.currentQuiz.topic,
        questions: quizState.currentQuiz.questions
          .filter(q => q.result !== undefined)
          .map(q => ({
            description: q.description,
            result: q.result!,
          })),
      };

      if (partialQuiz.questions.length > 0) {
        setQuizState({
          ...initialQuizState,
          history: [...quizState.history, partialQuiz],
        });
      } else {
        setQuizState(initialQuizState);
      }
    } else {
      setQuizState(initialQuizState);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'xml':
        return (
          <div className="tab-content-full">
            <div className="panel xml-panel">
              <textarea
                className="xml-input xml-input-large"
                value={itemXml}
                onChange={(e) => setItemXml(e.target.value)}
                placeholder="Paste QTI v3 XML here..."
              />
              <button
                className="process-button"
                onClick={handleProcess}
                disabled={!itemXml.trim() || processing}
              >
                {processing ? 'Processing...' : 'Process Item'}
              </button>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
            </div>
          </div>
        );

      case 'editor':
        return (
          <EditorTab
            itemXml={itemXml}
            setItemXml={setItemXml}
            setSanitizedTemplate={setSanitizedTemplate}
            setAttemptState={setAttemptState}
          />
        );

      case 'preview':
        return (
          <PreviewTab
            attemptState={attemptState}
            sanitizedTemplate={sanitizedTemplate}
            responses={responses}
            onSubmitResponses={handleSubmitResponses}
            onResetAttempt={handleResetAttempt}
            quizMode={quizState.isActive ? {
              onNext: handleNextQuestion,
              onEnd: handleEndQuiz,
              isLoadingNext: isLoadingNextQuestion,
            } : undefined}
          />
        );
    }
  };

  return (
    <>
      <div className="tabs">
        <div className="tabs-left">
          <button
            className={`tab ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('xml')}
          >
            XML
          </button>
          <button
            className={`tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Editor
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
        <div className="tabs-right">
          <button
            className="generate-button"
            onClick={() => setGenerateDialogOpen(true)}
            disabled={processing}
            title="Generate with AI"
          >✨</button>
          <select
            className="example-select-nav"
            onChange={handleExampleSelect}
            value={selectedExample}
            disabled={processing}
          >
            <option value="">Load example item...</option>
            {exampleGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      {renderTabContent()}
      <GenerateDialog
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleAIGenerate}
        onStartQuiz={handleStartQuiz}
      />
    </>
  );
}

export default App;
