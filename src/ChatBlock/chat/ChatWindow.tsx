import type { Persona } from '../types/interfaces';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Form, Segment } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable';
import { trackEvent } from '@eeacms/volto-matomo/utils';

import { ChatMessage, MemoizedChatMessage } from '.';
import AutoResizeTextarea from '../components/AutoResizeTextarea';
import QualityCheckToggle from '../components/QualityCheckToggle';
import EmptyState from '../components/EmptyState';
import { useScrollonStream } from '../old/lib';
import { useChatController } from '../hooks/useChatController';
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
    showToolCalls = true,
    feedbackReasons,
    qualityCheck = 'disabled',
    qualityCheckStages = [],
    qualityCheckContext = 'citations',
    noSupportDocumentsMessage,
    totalFailMessage,
    enableShowTotalFailMessage,
    deepResearch,
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
    messages,
    isStreaming,
    isFetchingRelatedQuestions,
    clearChat,
    setIsDeepResearchEnabled,
    isDeepResearchEnabled,
    cancelStreaming,
  } = useChatController({
    personaId: persona.id,
    qgenAsistantId,
    enableQgen,
    deepResearch,
  });

  const [showLandingPage, setShowLandingPage] = useState(true);

  const textareaRef = useRef(null);
  const conversationRef = useRef(null);
  const endDivRef = useRef(null);
  const scrollDist = useRef(0); // Keep track of scroll distance

  useEffect(() => {
    if (!textareaRef.current || isEditMode) return;

    if (isStreaming || scrollToInput) {
      textareaRef.current.focus();
    }
  }, [isStreaming, scrollToInput, isEditMode]);

  useEffect(() => {
    setShowLandingPage(messages.length === 0);
  }, [messages]);

  useScrollonStream({
    isStreaming,
    scrollableDivRef: conversationRef,
    scrollDist,
    endDivRef,
    distance: 500, // distance that should "engage" the scroll
    debounce: 100, // time for debouncing
  });

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
              ref={conversationRef}
              className={`conversation ${height ? 'include-scrollbar' : ''}`}
              style={{ maxHeight: height }}
            >
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.messageId}
                  message={message}
                  isLoading={isStreaming}
                  libs={libs}
                  onChoice={(message) => onSubmit({ message })}
                  showToolCalls={showToolCalls}
                  enableFeedback={enableFeedback}
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
                />
              ))}
              <div ref={endDivRef} /> {/* End div to mark the bottom */}
            </div>
          </>
        )}
        {isStreaming && !isFetchingRelatedQuestions && (
          <div className="loader" />
        )}
      </div>

      <div className="chat-form">
        <Form>
          <div className="textarea-wrapper">
            <AutoResizeTextarea
              maxRows={8}
              minRows={1}
              ref={textareaRef}
              placeholder={
                messages.length > 0 ? 'Ask follow-up...' : placeholderPrompt
              }
              isStreaming={isStreaming}
              cancelStreaming={cancelStreaming}
              enableMatomoTracking={enableMatomoTracking}
              persona={persona}
              onSubmit={onSubmit}
              deepResearch={deepResearch}
              setIsDeepResearchEnabled={setIsDeepResearchEnabled}
              isDeepResearchEnabled={isDeepResearchEnabled}
            />
          </div>
        </Form>

        {qualityCheck === 'ondemand_toggle' && (
          <QualityCheckToggle
            isEditMode={isEditMode}
            enabled={qualityCheckEnabled}
            setEnabled={setQualityCheckEnabled}
          />
        )}
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
