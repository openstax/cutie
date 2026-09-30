import { useState, useRef, useCallback, useEffect } from 'react';
import { beginAttempt, submitResponse, setScore } from '@openstax/cutie-core';
import type { AttemptResult, AttemptState, ProcessingOptions } from '@openstax/cutie-core';
import type { ResponseData } from '@openstax/cutie-client';
import { examples, exampleGroups } from './example-items';
import { ExampleDropdown } from './ExampleDropdown';
import { EditorTab } from './EditorTab';
import { PreviewTab } from './PreviewTab';
import type { LatestResult } from './PreviewTab';
import { GenerateDialog } from './GenerateDialog';
import { Tabs, TabList, TabPanel } from './Tabs';
import { Toast } from './Toast';
import { beginQuiz, continueQuiz, DEFAULT_FAST_MODEL_ID, generateQtiItem, scoreExternalResponse } from './utils/ai';
import type { QuizResponse, InteractionType } from './utils/ai';
import { shouldRenewToken } from './utils/auth';
import { loadDeliveryOptions, saveDeliveryOptions } from './utils/deliveryOptions';
import type { ResolvedDeliveryOptions } from './utils/deliveryOptions';
import { OpenInNewIcon } from './icons';
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
    // Resolve from public/, under the app's base path (e.g. /cutie/)
    return `${import.meta.env.BASE_URL}${url}`;
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
  const [latestResult, setLatestResult] = useState<LatestResult>({ hasNewFeedback: false, tryConsumed: false });
  const [deliveryOptions, setDeliveryOptions] = useState<ResolvedDeliveryOptions>(loadDeliveryOptions);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [responses, setResponses] = useState<ResponseData | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>(initialQuizState);
  const [isLoadingNextQuestion, setIsLoadingNextQuestion] = useState(false);
  const [prefetched, setPrefetched] = useState<PrefetchedContent>({});
  const prefetchingRef = useRef<{
    nextQuestion: Promise<string> | null;
    nextQuiz: Promise<{ quiz: QuizResponse; firstQuestionXml: string }> | null;
  }>({ nextQuestion: null, nextQuiz: null });

  useEffect(() => {
    saveDeliveryOptions(deliveryOptions);
  }, [deliveryOptions]);

  // Counts attempt operations, so a result that arrives after a newer operation began is dropped
  const attemptOperationRef = useRef(0);

  const applyResult = (result: AttemptResult) => {
    setAttemptState(result.state);
    setSanitizedTemplate(result.template);
    setLatestResult({ hasNewFeedback: result.hasNewFeedback, tryConsumed: result.tryConsumed });
  };

  /** Shows a result that is already current, superseding any operation still in flight. */
  const showResult = (result: AttemptResult) => {
    attemptOperationRef.current++;
    applyResult(result);
  };

  /**
   * Runs an attempt operation and applies its result, unless a newer operation has begun
   * since. Everything that depends on the result belongs in `apply`, so it is dropped too.
   */
  const runAttemptOperation = async (
    operation: () => Promise<AttemptResult>,
    apply: (result: AttemptResult) => void = applyResult
  ) => {
    const operationId = ++attemptOperationRef.current;
    const result = await operation();
    if (operationId === attemptOperationRef.current) {
      apply(result);
    }
  };

  /**
   * Begins a learner attempt on the given item with the current (or given) delivery
   * options, and shows it: the item, its state and template, and no responses yet.
   */
  const startAttempt = (xml: string, options: ResolvedDeliveryOptions = deliveryOptions) =>
    runAttemptOperation(() => beginAttempt(xml, { resolveAssets }, options), (result) => {
      applyResult(result);
      setItemXml(xml);
      setResponses(null);
    });

  const loadExample = async (exampleName: string) => {
    const example = examples.find(ex => ex.name === exampleName);
    if (!example) return;

    const url = new URL(window.location.href);
    url.searchParams.set('item', exampleName);
    window.history.replaceState(null, '', url);

    setItemXml(example.item);
    setResponses(null);
    setError('');
    setProcessing(true);
    try {
      await startAttempt(example.item);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('item');
    if (param) {
      loadExample(param);
    }
    // Runs once on mount to load the item from the URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAIGenerate = async (xml: string) => {
    setItemXml(xml);
    setGenerateDialogOpen(false);

    // Auto-process the generated item
    setError('');
    setProcessing(true);
    try {
      await startAttempt(xml);
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
      await startAttempt(itemXml);
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
      await runAttemptOperation(async () => {
        let result = await submitResponse(newResponses, attemptState, itemXml, { resolveAssets });

        if (result.state.pendingManualScoring) {
          if (shouldRenewToken()) {
            setError('AI scoring unavailable — please log in');
          } else {
            const scoringModelId = quizState.isActive ? quizState.fastModelId : DEFAULT_FAST_MODEL_ID;
            const aiResult = await scoreExternalResponse(
              scoringModelId,
              itemXml,
              result.state.pendingManualScoring.maxScore,
              newResponses,
            );
            result = await setScore(aiResult.score, aiResult.comments, result.state, itemXml, { resolveAssets });
          }
        } else {
          // Brief delay to show submitting state when scoring is instant
          await new Promise(r => setTimeout(r, 1000));
        }

        return result;
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error processing response');
    }
  };

  const resetAttempt = async (options: ResolvedDeliveryOptions) => {
    if (!itemXml) return;
    setError('');
    try {
      await startAttempt(itemXml, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error resetting attempt');
    }
  };

  const handleResetAttempt = () => resetAttempt(deliveryOptions);

  // Delivery options are fixed per attempt, so a change starts a new one
  const handleDeliveryOptionsChange = (options: ResolvedDeliveryOptions) => {
    setDeliveryOptions(options);
    resetAttempt(options);
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
    await startAttempt(xml);

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
      // Always include current quiz — unanswered questions marked 'pending'
      const projectedHistory = [
        ...history,
        {
          topic: quiz.topic,
          questions: quiz.questions.map(q => ({
            description: q.description,
            result: ('result' in q ? q.result : 'pending') as 'correct' | 'incorrect' | 'partial-credit' | 'pending',
          })),
        }
      ];

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
          await startAttempt(xml);

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

          await startAttempt(firstQuestionXml);

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

  const tabDefinitions = [
    {
      id: 'xml',
      label: 'XML',
      content: (
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
      ),
    },
    {
      id: 'editor',
      label: 'Editor',
      content: (
        <EditorTab
          itemXml={itemXml}
          setItemXml={setItemXml}
          deliveryOptions={deliveryOptions}
          onAttemptBegun={showResult}
        />
      ),
    },
    {
      id: 'preview',
      label: 'Preview',
      content: (
        <PreviewTab
          attemptState={attemptState}
          sanitizedTemplate={sanitizedTemplate}
          latestResult={latestResult}
          responses={responses}
          deliveryOptions={deliveryOptions}
          onDeliveryOptionsChange={handleDeliveryOptionsChange}
          onSubmitResponses={handleSubmitResponses}
          onResetAttempt={handleResetAttempt}
          isLoading={processing}
          onOpenGenerateDialog={() => setGenerateDialogOpen(true)}
          quizMode={quizState.isActive ? {
            onNext: handleNextQuestion,
            onEnd: handleEndQuiz,
            isLoadingNext: isLoadingNextQuestion,
            history: quizState.history,
            currentQuiz: quizState.currentQuiz,
          } : undefined}
        />
      ),
    },
  ];

  return (
    <Tabs tabs={tabDefinitions} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as Tab)}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header>
        <nav className="tabs" aria-label="Main navigation">
          <TabList />
          <div className="tabs-right">
            <button
              className="generate-button"
              onClick={() => setGenerateDialogOpen(true)}
              disabled={processing}
              aria-label="Generate with AI"
              title="Generate with AI"
            >✨</button>
            <ExampleDropdown
              groups={exampleGroups}
              onSelect={loadExample}
              disabled={processing}
            />
          </div>
        </nav>
      </header>
      <main id="main-content">
        <TabPanel />
      </main>
      <GenerateDialog
        isOpen={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleAIGenerate}
        onStartQuiz={handleStartQuiz}
      />
      {error && <Toast message={error} onClose={() => setError('')} />}
      <footer className="app-footer">
        <a href="https://github.com/openstax/cutie" target="_blank" rel="noopener noreferrer">
          Project Cutie<span className="visually-hidden"> (opens in new tab)</span> <OpenInNewIcon />
        </a>
        {' '}is an experiment from{' '}
        <a href="https://openstax.org" target="_blank" rel="noopener noreferrer">
          OpenStax<span className="visually-hidden"> (opens in new tab)</span> <OpenInNewIcon />
        </a>
      </footer>
    </Tabs>
  );
}

export default App;
