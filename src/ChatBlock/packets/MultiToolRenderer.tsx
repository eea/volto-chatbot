import type { Packet } from '../types/streamingModels';
import type { Message } from '../types/interfaces';
import React, { useState, useEffect, useMemo } from 'react';
import cx from 'classnames';
import { PacketType } from '../types/streamingModels';
import { RendererComponent } from './RendererComponent';
import { useToolDisplayTiming } from '../hooks/useToolDisplayTiming';
import SVGIcon from '../components/Icon';
import DoneIcon from '../../icons/done.svg';
import ChevronIcon from '../../icons/chevron.svg';

interface MultiToolRendererProps {
  toolGroups: { ind: number; packets: Packet[] }[];
  showTools?: PacketType[];
  message: Message;
  libs: any;
  onAllToolsDisplayed?: () => void;
}

export function MultiToolRenderer({
  toolGroups,
  showTools = [PacketType.SEARCH_TOOL_START],
  message,
  libs,
  onAllToolsDisplayed,
}: MultiToolRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isFinalMessageComing = false, isComplete = false } = message;

  // Filter tool groups based on allowed tool types
  const filteredToolGroups = useMemo(
    () =>
      toolGroups.filter(
        (group) =>
          group.packets?.some(
            (packet) => showTools?.includes(packet.obj.type as PacketType),
          ),
      ),
    [toolGroups, showTools],
  );

  // Manage tool display timing
  const { allToolsDisplayed, handleToolComplete } = useToolDisplayTiming(
    filteredToolGroups,
    isFinalMessageComing,
    isComplete,
  );

  // Notify parent when all tools are displayed
  useEffect(() => {
    if (allToolsDisplayed && onAllToolsDisplayed) {
      onAllToolsDisplayed();
      setIsExpanded(false);
    }
  }, [allToolsDisplayed, onAllToolsDisplayed]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  };

  if (filteredToolGroups.length === 0) return null;

  const isStreaming = !allToolsDisplayed;

  const count = filteredToolGroups.length;

  const ariaLabel = `${count} ${isStreaming ? 'processing' : 'completed'} ${
    count === 1 ? 'step' : 'steps'
  }, ${isExpanded ? 'expanded' : 'collapsed'}`;

  return (
    <div
      className={cx('multi-tool-renderer', {
        streaming: isStreaming,
        complete: !isStreaming,
      })}
    >
      {/* Header */}
      <div className={cx({ 'tools-container collapsed-view': isStreaming })}>
        <div
          className={cx({
            'tools-collapsed-header': isStreaming,
            'tools-summary-header': !isStreaming,
          })}
          onClick={toggleExpanded}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={ariaLabel}
          onKeyDown={handleKeyDown}
        >
          <div className="tools-count">
            <span className="tools-count-value">
              {filteredToolGroups.length}
            </span>
            <span className="tools-count-label">
              {filteredToolGroups.length === 1 ? 'step' : 'steps'}
            </span>
          </div>
          <span className={cx('expand-chevron', { expanded: isExpanded })}>
            <SVGIcon name={ChevronIcon} size={24} />
          </span>
        </div>

        {/* Tools List */}
        <div
          className={cx({
            'tools-collapsed-list': isStreaming,
            'tools-expanded-content': !isStreaming,
            expanded: isExpanded && isStreaming,
            visible: isExpanded && !isStreaming,
          })}
        >
          <div className={cx({ 'tools-list': isStreaming })}>
            <div>
              {filteredToolGroups.map((toolGroup, index) => {
                const isLastItem = index === filteredToolGroups.length - 1;

                return (
                  <div
                    key={toolGroup.ind}
                    className={cx({ 'tool-collaps ed-wrapper': isStreaming })}
                  >
                    <RendererComponent
                      packets={toolGroup.packets}
                      message={message}
                      libs={libs}
                      onComplete={() => {
                        if (toolGroup.ind !== undefined) {
                          handleToolComplete(toolGroup.ind);
                        }
                      }}
                      stopPacketSeen={isComplete}
                      animate={false}
                    >
                      {({ icon, content, status, expandedText }) => {
                        const finalIcon = icon ? (
                          React.createElement(icon, { size: 14 })
                        ) : (
                          <span
                            className={cx({
                              'tool-icon-dot': isStreaming,
                              'tool-icon-default': !isStreaming,
                            })}
                          />
                        );

                        // Streaming: collapsed view (status only)
                        if (isStreaming) {
                          return (
                            <div
                              className={cx('tool-item-collapsed', {
                                active: isLastItem,
                                completed: !isLastItem,
                              })}
                            >
                              <div className="tool-collapsed-icon">
                                {finalIcon}
                              </div>
                              <span className="tool-collapsed-status">
                                {status}
                              </span>
                            </div>
                          );
                        }

                        // Complete: expanded view (full content)
                        return (
                          <div className="tool-item-expanded">
                            <div className="tool-connector-line" />

                            <div className="tool-item-row">
                              <div className="tool-icon-wrapper">
                                <div className="tool-icon-circle">
                                  {finalIcon}
                                </div>
                              </div>

                              <div
                                className={cx('tool-content', {
                                  'with-padding': !isLastItem,
                                })}
                              >
                                {status && !expandedText && (
                                  <div className="tool-status-row">
                                    <div className="tool-status">{status}</div>
                                  </div>
                                )}

                                <div
                                  className={cx('tool-text', {
                                    expanded: expandedText,
                                  })}
                                >
                                  {expandedText || content}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </RendererComponent>
                  </div>
                );
              })}

              {/* Done node - only in complete state */}
              {allToolsDisplayed && (
                <div className="tool-done-node">
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
    </div>
  );
}
