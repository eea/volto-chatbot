import type { Persona } from '../types/interfaces';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Form, Segment, Checkbox } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { trackEvent } from '@eeacms/volto-matomo/utils';

import { ChatMessage } from '.';
import { PacketType } from '../types/streamingModels';
import AutoResizeTextarea from '../components/AutoResizeTextarea';
import QualityCheckToggle from '../components/QualityCheckToggle';
import EmptyState from '../components/EmptyState';
import { useChatController } from '../hooks';
import SVGIcon from '../components/Icon';
import PenIcon from '../../icons/square-pen.svg';

import '../style.less';

interface ChatWindowProps {
  persona: Persona;
  rehypePrism?: any;
  remarkGfm?: any;
  placeholderPrompt?: string;
  isEditMode?: boolean;
  height?: string;
  qgenAsistantId?: number;
  enableQgen?: boolean;
  enableFeedback?: boolean;
  scrollToInput?: boolean;
  feedbackReasons?: string[];
  qualityCheck?: string;
  qualityCheckStages?: string[];
  qualityCheckContext?: string;
  noSupportDocumentsMessage?: string;
  totalFailMessage?: string;
  enableShowTotalFailMessage?: boolean;
  deepResearch?: string;
  showTools?: PacketType[];
  showAssistantTitle?: boolean;
  showAssistantDescription?: boolean;
  starterPromptsPosition?: 'top' | 'bottom';
  enableMatomoTracking?: boolean;
  onDemandInputToggle?: boolean;
  maxContextSegments?: number;
  [key: string]: any;
}

function ChatWindow({
  persona,
  rehypePrism,
  remarkGfm,
  placeholderPrompt = 'Ask a question',
  isEditMode,
  ...data
}: ChatWindowProps) {
  const {
    height,
    qgenAsistantId,
    enableQgen,
    enableFeedback = true,
    scrollToInput,
    feedbackReasons,
    qualityCheck = 'disabled',
    qualityCheckStages = [],
    qualityCheckContext = 'citations',
    noSupportDocumentsMessage,
    totalFailMessage,
    enableShowTotalFailMessage,
    deepResearch,
    showTools,
    showAssistantTitle,
    showAssistantDescription,
    starterPromptsPosition = 'top',
    enableMatomoTracking = true,
    onDemandInputToggle = true,
    maxContextSegments = 0,
  } = data;
  const [qualityCheckEnabled, setQualityCheckEnabled] = useState(
    onDemandInputToggle ?? true,
  );

  const showDeepResearchToggle =
    deepResearch === 'user_on' || deepResearch === 'user_off';

  useEffect(() => {
    if (isEditMode && qualityCheck === 'ondemand_toggle') {
      setQualityCheckEnabled(onDemandInputToggle ?? true);
    }
  }, [onDemandInputToggle, qualityCheck, isEditMode]);

  // Memoize libs object to prevent recreation on every render
  const libs = useMemo(
    () => ({ rehypePrism, remarkGfm }),
    [rehypePrism, remarkGfm],
  );

  const {
    onSubmit,
    onFetchRelatedQuestions,
    messages,
    isStreaming,
    isFetchingRelatedQuestions,
    clearChat,
    setIsDeepResearchEnabled,
    isDeepResearchEnabled,
  } = useChatController({
    personaId: persona.id,
    qgenAsistantId,
    enableQgen,
    deepResearch,
    factCheckAllowed: qualityCheck !== 'disabled',
  });

  const [showLandingPage, setShowLandingPage] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatWindowRef = useRef(null);
  const chatWindowEndRef = useRef(null);

  useEffect(() => {
    setShowLandingPage(messages.length === 0);
  }, [messages]);

  const handleStarterPromptChoice = useCallback(
    (message: string) => {
      if (enableMatomoTracking) {
        trackEvent({
          category: persona?.name ? `Chatbot - ${persona.name}` : 'Chatbot',
          action: 'Chatbot: Starter prompt click',
          name: 'Message submitted',
        });
      }
      onSubmit({ message });
      setShowLandingPage(false);
    },
    [persona, enableMatomoTracking, onSubmit],
  );

  return (
    <div className="chat-window">
      <div className="messages">
        {showLandingPage ? (
          <>
            {showAssistantTitle && <h2>{persona.name}</h2>}
            {showAssistantDescription && <p>{persona.description}</p>}

            {starterPromptsPosition === 'top' && (
              <EmptyState
                {...data}
                persona={persona}
                onChoice={handleStarterPromptChoice}
              />
            )}
          </>
        ) : (
          <>
            {/* @ts-ignore */}
            <Segment clearing basic>
              <Button
                disabled={isStreaming}
                onClick={clearChat}
                className="right floated clear-chat"
                aria-label="Clear chat"
              >
                <SVGIcon name={PenIcon} /> New chat
              </Button>
            </Segment>
            <div
              ref={chatWindowRef}
              className={`conversation ${height ? 'include-scrollbar' : ''}`}
              style={{ maxHeight: height }}
            >
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.messageId}
                  message={message}
                  isLoading={isStreaming}
                  isDeepResearchEnabled={isDeepResearchEnabled}
                  libs={libs}
                  onChoice={(message) => onSubmit({ message })}
                  onFetchRelatedQuestions={onFetchRelatedQuestions}
                  enableFeedback={enableFeedback}
                  scrollToInput={scrollToInput}
                  feedbackReasons={feedbackReasons}
                  qualityCheck={qualityCheck}
                  qualityCheckStages={qualityCheckStages}
                  qualityCheckContext={qualityCheckContext}
                  qualityCheckEnabled={qualityCheckEnabled}
                  noSupportDocumentsMessage={noSupportDocumentsMessage}
                  totalFailMessage={totalFailMessage}
                  isFetchingRelatedQuestions={isFetchingRelatedQuestions}
                  enableShowTotalFailMessage={enableShowTotalFailMessage}
                  enableMatomoTracking={enableMatomoTracking}
                  persona={persona.id}
                  maxContextSegments={maxContextSegments}
                  isLastMessage={index === messages.length - 1}
                  className={index === messages.length - 1 ? 'most-recent' : ''}
                  chatWindowRef={chatWindowRef}
                  chatWindowEndRef={chatWindowEndRef}
                  showTools={showTools}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="chat-form">
        {/* @ts-ignore */}
        <Form>
          <div className="textarea-wrapper">
            <AutoResizeTextarea
              // @ts-ignore TODO: convert AutoResizeTextarea to TypeScript
              maxRows={8}
              minRows={1}
              ref={textareaRef}
              placeholder={
                messages.length > 0 ? 'Ask follow-up...' : placeholderPrompt
              }
              isStreaming={isStreaming}
              enableMatomoTracking={enableMatomoTracking}
              persona={persona}
              onSubmit={onSubmit}
            />
          </div>
        </Form>
        <div className="chat-controls">
          {qualityCheck === 'ondemand_toggle' && (
            <QualityCheckToggle
              isEditMode={isEditMode}
              enabled={qualityCheckEnabled}
              setEnabled={setQualityCheckEnabled}
            />
          )}

          {showDeepResearchToggle && (
            <div className="deep-research-toggle">
              <Checkbox
                id="deep-research-toggle"
                toggle
                checked={isDeepResearchEnabled}
                label="Deep research"
                onChange={(_, { checked }) =>
                  setIsDeepResearchEnabled(checked ?? false)
                }
              />
            </div>
          )}

          {deepResearch === 'always_on' && <small>Deep research on</small>}
        </div>
        <div ref={chatWindowEndRef} /> {/* End div to mark the bottom */}
      </div>

      {showLandingPage && starterPromptsPosition === 'bottom' && (
        <EmptyState
          {...data}
          persona={persona}
          onChoice={handleStarterPromptChoice}
        />
      )}
    </div>
  );
}

export default injectLazyLibs(['rehypePrism', 'remarkGfm'])(ChatWindow);
