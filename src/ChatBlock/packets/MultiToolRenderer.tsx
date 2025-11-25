import type { Packet } from '../types/streamingModels';
import type { Message } from '../types/interfaces';
import React, { useState, useEffect } from 'react';
import { RendererComponent } from './RendererComponent';
import { useToolDisplayTiming } from '../hooks/useToolDisplayTiming';
import SVGIcon from '../components/Icon';
import DoneIcon from '../../icons/done.svg';

// Shared component for expanded tool rendering
function ExpandedToolItem({
  icon,
  content,
  status,
  isLastItem,
  showClickableToggle = false,
  onToggleClick,
  expandedText,
}: {
  icon: React.ComponentType<{ size: number }> | null;
  content: JSX.Element | string;
  status: string | null;
  isLastItem: boolean;
  showClickableToggle?: boolean;
  onToggleClick?: () => void;
  expandedText?: JSX.Element | string;
}) {
  const finalIcon = icon ? (
    React.createElement(icon, { size: 14 })
  ) : (
    <span className="tool-icon-default" />
  );

  return (
    <div className="tool-item-expanded">
      {/* Connector line */}
      {!isLastItem && <div className="tool-connector-line" />}

      {/* Main row with icon and content */}
      <div className="tool-item-row">
        {/* Icon column */}
        <div className="tool-icon-wrapper">
          <div className="tool-icon-circle">{finalIcon}</div>
        </div>

        {/* Content with padding */}
        <div className={`tool-content ${!isLastItem ? 'with-padding' : ''}`}>
          {status && !expandedText && (
            <div className="tool-status-row">
              <div
                className={`tool-status ${
                  showClickableToggle ? 'clickable' : ''
                }`}
                onClick={showClickableToggle ? onToggleClick : undefined}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    showClickableToggle && onToggleClick?.();
                  }
                }}
                aria-label={status}
              >
                {status}
              </div>
            </div>
          )}

          <div className={expandedText ? 'tool-text expanded' : 'tool-text'}>
            {expandedText || content}
          </div>
        </div>
      </div>
    </div>
  );
}

// Multi-tool renderer component for grouped tools
export function MultiToolRenderer({
  toolGroups,
  message,
  libs,
  onAllToolsDisplayed,
  showToolCalls,
}: {
  toolGroups: { ind: number; packets: Packet[] }[];
  message: Message;
  libs: any;
  onAllToolsDisplayed?: () => void;
  showToolCalls?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStreamingExpanded, setIsStreamingExpanded] = useState(false);
  const { isFinalMessageComing = false, isComplete = false, error } = message;

  // Use the custom hook to manage tool display timing
  const { visibleTools, allToolsDisplayed, handleToolComplete } =
    useToolDisplayTiming(toolGroups, isFinalMessageComing, isComplete);

  // Notify parent when all tools are displayed
  useEffect(() => {
    if (allToolsDisplayed && onAllToolsDisplayed) {
      onAllToolsDisplayed();
    }
  }, [allToolsDisplayed, onAllToolsDisplayed]);

  // Preserve expanded state when transitioning from streaming to complete
  useEffect(() => {
    if (isComplete && isStreamingExpanded) {
      setIsExpanded(true);
    }
  }, [isComplete, isStreamingExpanded]);

  // If still processing, show tools progressively with timing
  if (!allToolsDisplayed && !isStreamingExpanded && !error) {
    // Get the tools to display based on visibleTools
    const toolsToDisplay = toolGroups.filter((group) =>
      visibleTools.has(group.ind),
    );

    if (toolsToDisplay.length === 0) {
      return null;
    }

    // Show only the latest tool visually when collapsed, but render all for completion tracking
    const shouldShowOnlyLatest =
      !isStreamingExpanded && toolsToDisplay.length > 1;
    const latestToolIndex = toolsToDisplay.length - 1;

    return (
      <div
        className="multi-tool-renderer streaming"
        style={{ display: showToolCalls ? 'block' : 'none' }}
      >
        <div className="tools-container">
          <div>
            {toolsToDisplay.map((toolGroup, index) => {
              if (!toolGroup) return null;

              // Hide all but the latest tool when shouldShowOnlyLatest is true
              const isVisible =
                !shouldShowOnlyLatest || index === latestToolIndex;
              const isLastItem = index === toolsToDisplay.length - 1;

              return (
                <div
                  key={toolGroup.ind}
                  style={{ display: isVisible ? 'block' : 'none' }}
                >
                  <RendererComponent
                    packets={toolGroup.packets}
                    message={message}
                    libs={libs}
                    onComplete={() => {
                      // When a tool completes rendering, track it in the hook
                      const toolInd = toolGroup.ind;
                      if (toolInd !== undefined) {
                        handleToolComplete(toolInd);
                      }
                    }}
                    stopPacketSeen={isComplete}
                    animate
                  >
                    {({ icon, content, status, expandedText }) => {
                      // When expanded, show full renderer style similar to complete state
                      if (isStreamingExpanded) {
                        return (
                          <ExpandedToolItem
                            icon={icon}
                            content={content}
                            status={status}
                            isLastItem={isLastItem}
                            showClickableToggle={
                              toolsToDisplay.length > 1 && index === 0
                            }
                            onToggleClick={() =>
                              setIsStreamingExpanded(!isStreamingExpanded)
                            }
                            expandedText={expandedText}
                          />
                        );
                      }

                      function onClick(e: any) {
                        e.preventDefault();
                        toolsToDisplay.length > 1 &&
                          isLastItem &&
                          setIsStreamingExpanded(!isStreamingExpanded);
                      }

                      // Short renderer style (original streaming view)
                      return (
                        <div className="tool-item-short">
                          {/* Connector line for non-last items */}
                          {!isLastItem && isVisible && (
                            <div className="tool-connector-short" />
                          )}

                          <div
                            className={`tool-status-short ${
                              toolsToDisplay.length > 1 && isLastItem
                                ? 'clickable'
                                : ''
                            }`}
                            onClick={onClick}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onClick(e);
                              }
                            }}
                          >
                            {icon
                              ? React.createElement(icon, { size: 14 })
                              : null}
                            {status}
                          </div>

                          <div
                            className={`tool-content-short ${
                              !isLastItem ? 'with-margin' : ''
                            }`}
                          >
                            {content}
                          </div>
                        </div>
                      );
                    }}
                  </RendererComponent>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!showToolCalls) {
    return null;
  }

  // If complete, show summary with toggle
  return (
    <div
      className={`multi-tool-renderer complete ${
        !toolGroups.length ? 'empty' : ''
      }`.trim()}
    >
      {/* Summary header - clickable */}
      <div
        className="tools-summary-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className="tools-count">{toolGroups.length} steps</span>
        <span className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {/* Expanded content */}
      <div className={`tools-expanded-content ${isExpanded ? 'visible' : ''}`}>
        <div className="tools-list">
          <div>
            {toolGroups.map((toolGroup) => {
              // Don't mark as last item if we're going to show the Done node
              const isLastItem = false; // Always draw connector line since Done node follows

              return (
                <RendererComponent
                  key={toolGroup.ind}
                  packets={toolGroup.packets}
                  onComplete={() => {
                    // When a tool completes rendering, track it in the hook
                    const toolInd = toolGroup.ind;
                    if (toolInd !== undefined) {
                      handleToolComplete(toolInd);
                    }
                  }}
                  stopPacketSeen={isComplete}
                  message={message}
                  libs={libs}
                  animate
                >
                  {({ icon, content, status, expandedText }) => (
                    <ExpandedToolItem
                      icon={icon}
                      content={content}
                      status={status}
                      isLastItem={isLastItem}
                      expandedText={expandedText}
                    />
                  )}
                </RendererComponent>
              );
            })}

            {/* Done node at the bottom - only show after all tools are displayed */}
            {allToolsDisplayed && (
              <div className="tool-done-node">
                <div className="tool-done-connector" />
                <div className="tool-done-row">
                  <div className="tool-icon-wrapper">
                    <div className="tool-icon-circle">
                      <span className="check-icon">
                        <SVGIcon name={DoneIcon} size={14} />
                      </span>
                    </div>
                  </div>
                  <div className="tool-done-content">
                    <div className="tool-done-text">Done</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
