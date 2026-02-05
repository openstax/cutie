import { useState, useRef, useCallback } from 'react';
import { beginAttempt, submitResponse } from '@openstax/cutie-core';
import type { AttemptState, ProcessingOptions } from '@openstax/cutie-core';
import type { ResponseData } from '@openstax/cutie-client';
import { examples, exampleGroups } from './example-items';
import { EditorTab } from './EditorTab';
import { PreviewTab } from './PreviewTab';
import { GenerateDialog } from './GenerateDialog';
import { Toast } from './Toast';
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
  modelId: number;
  fastModelId: number;
}

const initialQuizState: QuizState = {
  userTopic: '',
  currentQuiz: null,
  currentQuestionIndex: 0,
  history: [],
  isActive: false,
  modelId: 0,
  fastModelId: 0,
};

interface PrefetchedContent {
  nextQuestionXml?: string;
  nextQuiz?: {
    quiz: QuizResponse;
    firstQuestionXml: string;
  };
}

const determineResult = (state: AttemptState): 'correct' | 'incorrect' | 'partial-credit' => {
  if (state.score === null) return 'incorrect';
  if (state.score.raw === state.score.max) return 'correct';
  if (state.score.raw === 0) return 'incorrect';
  return 'partial-credit';
};

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
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
  const [prefetched, setPrefetched] = useState<PrefetchedContent>({});
  const prefetchingRef = useRef<{
    nextQuestion: Promise<string> | null;
    nextQuiz: Promise<{ quiz: QuizResponse; firstQuestionXml: string }> | null;
  }>({ nextQuestion: null, nextQuiz: null });

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

  const loadQuizQuestion = async (quiz: QuizResponse, questionIndex: number, modelId?: number) => {
    const question = quiz.questions[questionIndex];
    if (!question) return;

    // Generate XML if not already generated
    let xml = (question as QuizQuestion).xml;
    if (!xml) {
      const prompt = `${quiz.topic}: ${question.description}`;
      xml = await generateQtiItem(prompt, question.interactions, modelId);
    }

    // Process the item
    const result = await beginAttempt(xml, { resolveAssets });
    setItemXml(xml);
    setAttemptState(result.state);
    setSanitizedTemplate(result.template);
    setResponses(null);

    return xml;
  };

  const triggerEagerGeneration = useCallback((
    quiz: QuizResponse,
    currentIndex: number,
    userTopic: string,
    history: QuizState['history'],
    modelId: number,
    fastModelId: number
  ) => {
    const isLastQuestion = currentIndex === quiz.questions.length - 1;
    const hasNextQuestion = currentIndex + 1 < quiz.questions.length;

    // Eagerly generate next question if not last
    if (hasNextQuestion && !prefetchingRef.current.nextQuestion) {
      const nextQuestion = quiz.questions[currentIndex + 1];
      const prompt = `${quiz.topic}: ${nextQuestion.description}`;

      const promise = generateQtiItem(prompt, nextQuestion.interactions, modelId)
        .then(xml => {
          setPrefetched(prev => ({ ...prev, nextQuestionXml: xml }));
          console.log('Prefetched next question XML');
          return xml;
        })
        .catch(err => {
          console.error('Failed to prefetch next question:', err);
          throw err;
        })
        .finally(() => { prefetchingRef.current.nextQuestion = null; });

      prefetchingRef.current.nextQuestion = promise;
    }

    // Eagerly generate next quiz + first question when on last or second-to-last question
    if ((isLastQuestion || currentIndex === quiz.questions.length - 2) && !prefetchingRef.current.nextQuiz) {
      // Build the history that will exist when we move to next quiz
      const projectedHistory = isLastQuestion ? [
        ...history,
        {
          topic: quiz.topic,
          questions: quiz.questions.map(q => ({
            description: q.description,
            result: ('result' in q ? q.result : 'incorrect') as 'correct' | 'incorrect' | 'partial-credit',
          })),
        }
      ] : history;

      const promise = continueQuiz(userTopic, projectedHistory, fastModelId)
        .then(async (nextQuizResponse) => {
          const firstQuestion = nextQuizResponse.questions[0];
          const prompt = `${nextQuizResponse.topic}: ${firstQuestion.description}`;
          const firstQuestionXml = await generateQtiItem(prompt, firstQuestion.interactions, modelId);

          const result = { quiz: nextQuizResponse, firstQuestionXml };
          setPrefetched(prev => ({
            ...prev,
            nextQuiz: result
          }));
          console.log('Prefetched next quiz and first question');
          return result;
        })
        .catch(err => {
          console.error('Failed to prefetch next quiz:', err);
          throw err;
        })
        .finally(() => { prefetchingRef.current.nextQuiz = null; });

      prefetchingRef.current.nextQuiz = promise;
    }
  }, []);

  const handleStartQuiz = async (topic: string, modelId: number, fastModelId: number) => {
    setGenerateDialogOpen(false);
    setActiveTab('preview');
    setError('');
    setProcessing(true);
    // Clear previous content and prefetched data while loading
    setSanitizedTemplate('');
    setAttemptState(null);
    setPrefetched({});
    prefetchingRef.current = { nextQuestion: null, nextQuiz: null };

    try {
      // Use fast model for initial quiz structure
      const quizResponse = await beginQuiz(topic, fastModelId);
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
        modelId,
        fastModelId,
      };

      setQuizState(newQuizState);

      // Generate and load first question with fast model for initial speed
      const xml = await loadQuizQuestion(quizResponse, 0, fastModelId);
      if (xml && newQuizState.currentQuiz) {
        newQuizState.currentQuiz.questions[0].xml = xml;
        setQuizState({ ...newQuizState });
      }

      setActiveTab('preview');

      // Trigger eager generation of next question (uses main model for quality)
      triggerEagerGeneration(quizResponse, 0, topic, newQuizState.history, modelId, fastModelId);
    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setProcessing(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!quizState.currentQuiz || !attemptState) return;

    setError('');

    // Record result of current question
    const result = determineResult(attemptState);
    const currentQuestion = quizState.currentQuiz.questions[quizState.currentQuestionIndex];
    currentQuestion.result = result;

    const nextIndex = quizState.currentQuestionIndex + 1;

    try {
      if (nextIndex < quizState.currentQuiz.questions.length) {
        // Moving to next question in current quiz
        let xml = prefetched.nextQuestionXml;

        if (!xml && prefetchingRef.current.nextQuestion) {
          // Prefetch is in progress, wait for it
          console.log('Waiting for in-progress prefetch...');
          setIsLoadingNextQuestion(true);
          try {
            xml = await prefetchingRef.current.nextQuestion;
          } catch {
            // Prefetch failed, will fall through to generate on-demand
            xml = undefined;
          }
        }

        if (xml) {
          // Use prefetched content - instant transition (or after awaiting in-progress)
          console.log('Using prefetched next question');
          const xmlResult = await beginAttempt(xml, { resolveAssets });
          setItemXml(xml);
          setAttemptState(xmlResult.state);
          setSanitizedTemplate(xmlResult.template);
          setResponses(null);

          quizState.currentQuiz.questions[nextIndex].xml = xml;
          const updatedQuizState = {
            ...quizState,
            currentQuestionIndex: nextIndex,
          };
          setQuizState(updatedQuizState);

          // Clear used prefetch and trigger next eager generation
          setPrefetched(prev => ({ ...prev, nextQuestionXml: undefined }));
          triggerEagerGeneration(
            { topic: quizState.currentQuiz.topic, questions: quizState.currentQuiz.questions },
            nextIndex,
            quizState.userTopic,
            quizState.history,
            quizState.modelId,
            quizState.fastModelId
          );
        } else {
          // No prefetch available or it failed, generate on-demand with loading state
          setIsLoadingNextQuestion(true);
          const generatedXml = await loadQuizQuestion(
            { topic: quizState.currentQuiz.topic, questions: quizState.currentQuiz.questions },
            nextIndex,
            quizState.modelId
          );
          if (generatedXml) {
            quizState.currentQuiz.questions[nextIndex].xml = generatedXml;
          }
          const updatedQuizState = {
            ...quizState,
            currentQuestionIndex: nextIndex,
          };
          setQuizState(updatedQuizState);

          // Trigger eager generation for subsequent questions
          triggerEagerGeneration(
            { topic: quizState.currentQuiz.topic, questions: quizState.currentQuiz.questions },
            nextIndex,
            quizState.userTopic,
            quizState.history,
            quizState.modelId,
            quizState.fastModelId
          );
        }
      } else {
        // Quiz complete, moving to next quiz
        const completedQuiz = {
          topic: quizState.currentQuiz.topic,
          questions: quizState.currentQuiz.questions.map(q => ({
            description: q.description,
            result: q.result || 'incorrect',
          })),
        };
        const newHistory = [...quizState.history, completedQuiz];

        let nextQuizData = prefetched.nextQuiz;

        if (!nextQuizData && prefetchingRef.current.nextQuiz) {
          // Prefetch is in progress, wait for it
          console.log('Waiting for in-progress next quiz prefetch...');
          setIsLoadingNextQuestion(true);
          try {
            nextQuizData = await prefetchingRef.current.nextQuiz;
          } catch {
            // Prefetch failed, will fall through to generate on-demand
            nextQuizData = undefined;
          }
        }

        if (nextQuizData) {
          // Use prefetched next quiz - instant transition (or after awaiting in-progress)
          console.log('Using prefetched next quiz');
          const { quiz: nextQuizResponse, firstQuestionXml } = nextQuizData;

          const xmlResult = await beginAttempt(firstQuestionXml, { resolveAssets });
          setItemXml(firstQuestionXml);
          setAttemptState(xmlResult.state);
          setSanitizedTemplate(xmlResult.template);
          setResponses(null);

          const newQuizState: QuizState = {
            ...quizState,
            currentQuiz: {
              topic: nextQuizResponse.topic,
              questions: nextQuizResponse.questions.map((q, i) => ({
                description: q.description,
                interactions: q.interactions,
                xml: i === 0 ? firstQuestionXml : undefined,
              })),
            },
            currentQuestionIndex: 0,
            history: newHistory,
          };
          setQuizState(newQuizState);

          // Clear used prefetch and trigger eager generation for new quiz
          setPrefetched({});
          prefetchingRef.current = { nextQuestion: null, nextQuiz: null };
          triggerEagerGeneration(nextQuizResponse, 0, quizState.userTopic, newHistory, quizState.modelId, quizState.fastModelId);
        } else {
          // No prefetch available or it failed, generate on-demand
          setIsLoadingNextQuestion(true);
          const quizResponse = await continueQuiz(quizState.userTopic, newHistory, quizState.fastModelId);
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
          const xml = await loadQuizQuestion(quizResponse, 0, quizState.modelId);
          if (xml && newQuizState.currentQuiz) {
            newQuizState.currentQuiz.questions[0].xml = xml;
            setQuizState({ ...newQuizState });
          }

          // Clear prefetch state and trigger eager generation
          setPrefetched({});
          prefetchingRef.current = { nextQuestion: null, nextQuiz: null };
          triggerEagerGeneration(quizResponse, 0, quizState.userTopic, newHistory, quizState.modelId, quizState.fastModelId);
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
    // Clear prefetched content
    setPrefetched({});
    prefetchingRef.current = { nextQuestion: null, nextQuiz: null };

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
            isLoading={processing}
            onOpenGenerateDialog={() => setGenerateDialogOpen(true)}
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
      {error && <Toast message={error} onClose={() => setError('')} />}
      <footer className="app-footer">
        <a href="https://github.com/openstax/cutie" target="_blank" rel="noopener noreferrer">Project Cutie</a>
        {' '}is an experiment from{' '}
        <a href="https://openstax.org" target="_blank" rel="noopener noreferrer">OpenStax</a>
      </footer>
    </>
  );
}

export default App;
