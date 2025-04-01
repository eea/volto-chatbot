import {
  buildLatestMessageChain,
  removeMessage,
  updateParentChildren,
} from './lib';
import { SYSTEM_MESSAGE_ID } from './constants';

export function upsertToCompleteMessageMap({
  chatSessionId,
  completeMessageDetail,
  completeMessageMapOverride,
  makeLatestChildMessage = false,
  messages,
  replacementsMap = null,
  setCompleteMessageDetail,
}) {
  // deep copy
  const frozenCompleteMessageMap =
    completeMessageMapOverride || completeMessageDetail.messageMap;

  // eslint is old, structuredClone is builtin
  // eslint-disable-next-line no-undef
  const newCompleteMessageMap = structuredClone(frozenCompleteMessageMap);

  if (newCompleteMessageMap.size === 0) {
    const systemMessageId = messages[0].parentMessageId || SYSTEM_MESSAGE_ID;
    const firstMessageId = messages[0].messageId;
    const dummySystemMessage = {
      messageId: systemMessageId,
      message: '',
      type: 'system',
      files: [],
      toolCalls: [],
      parentMessageId: null,
      childrenMessageIds: [firstMessageId],
      latestChildMessageId: firstMessageId,
    };
    newCompleteMessageMap.set(dummySystemMessage.messageId, dummySystemMessage);
    messages[0].parentMessageId = systemMessageId;
  }
  messages.forEach((message) => {
    const idToReplace = replacementsMap?.get(message.messageId);
    if (idToReplace) {
      removeMessage(idToReplace, newCompleteMessageMap);
    }

    // update childrenMessageIds for the parent
    if (
      !newCompleteMessageMap.has(message.messageId) &&
      message.parentMessageId !== null
    ) {
      updateParentChildren(message, newCompleteMessageMap, true);
    }
    newCompleteMessageMap.set(message.messageId, message);
  });

  // if specified, make these new message the latest of the current message chain
  if (makeLatestChildMessage) {
    const currentMessageChain = buildLatestMessageChain(
      frozenCompleteMessageMap,
    );
    const latestMessage = currentMessageChain[currentMessageChain.length - 1];
    if (latestMessage) {
      newCompleteMessageMap.get(latestMessage.messageId).latestChildMessageId =
        messages[0].messageId;
    }
  }
  const newCompleteMessageDetail = {
    sessionId: chatSessionId || completeMessageDetail.sessionId,
    messageMap: newCompleteMessageMap,
  };
  setCompleteMessageDetail(newCompleteMessageDetail);
  return newCompleteMessageDetail;
}
