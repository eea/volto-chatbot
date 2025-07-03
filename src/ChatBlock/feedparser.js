import {
  ChatFileType,
  RetrievalType,
  SYSTEM_MESSAGE_ID,
  TEMP_ASSISTANT_MESSAGE_ID,
  TEMP_USER_MESSAGE_ID,
} from './constants';

export class FeedParser {
  constructor() {
    this.answer = '';
    this.query = null;
    this.retrievalType = RetrievalType.None;
    this.documents = []; // selectedDocuments;
    this.aiMessageImages = null;
    this.error = null;
    this.finalMessage = null;
    this.toolCalls = [];
    this.signals = ['agentic_message_ids'];
  }

  handle_agentic_message_ids(packet) {
    this.isAgentic = packet.is_agentic;
  }

  read(packet) {
    this.signals.forEach((name) => {
      if (Object.hasOwn(packet, name)) {
        const handler = this[`handle_${name}`];
        handler(packet);
      }
    });
  }
}
// // console.log('inside packagt', packet, {
//           //   has_message_id: Object.hasOwn(packet, 'message_id'),
//           //   has_answer_piece: Object.hasOwn(packet, 'answer_piece'),
//           //   has_top_docs: Object.hasOwn(packet, 'top_documents'),
//           //   has_tool_name: Object.hasOwn(packet, 'tool_name'),
//           //   has_file_ids: Object.hasOwn(packet, 'file_ids'),
//           //   has_error: Object.hasOwn(packet, 'error'),
//           // });
//
//           if (Object.hasOwn(packet, 'agentic_message_ids')) {
//             const agenticMessageIds = packet.agentic_message_ids;
//             const level1MessageId = agenticMessageIds.find(
//               (item) => item.level === 1,
//             )?.message_id;
//             if (level1MessageId) {
//               this.secondLevelMessageId = level1MessageId;
//               this.includeAgentic = true;
//             }
//           }
//
//           if (Object.hasOwn(packet, 'level')) {
//             if (packet.level === 1) {
//               this.second_level_generating = true;
//             }
//           }
//           if (Object.hasOwn(packet, 'is_agentic')) {
//             this.isAgentic = packet.is_agentic;
//           }
//
//           if (Object.hasOwn(packet, 'refined_answer_improvement')) {
//             this.isImprovement = packet.refined_answer_improvement;
//           }
//
//           if (Object.hasOwn(packet, 'stream_type')) {
//             if (packet.stream_type === 'main_answer') {
//               this.is_generating = false;
//               this.second_level_generating = true;
//             }
//           }
//
//           // // Continuously refine the sub_questions based on the packets that we receive
//           if (
//             Object.hasOwn(packet, 'stop_reason') &&
//             Object.hasOwn(packet, 'level_question_num')
//           ) {
//             // TODO
//             // if (packet.stream_type === 'main_answer') {
//             //   this.updateChatState('streaming', frozenSessionId);
//             // }
//             if (
//               packet.stream_type === 'sub_questions' &&
//               packet.level_question_num === undefined
//             ) {
//               this.isStreamingQuestions = false;
//             }
//             this.sub_questions = constructSubQuestions(
//               this.sub_questions,
//               packet,
//             );
//           } else if (Object.hasOwn(packet, 'sub_question')) {
//             // TODO
//             // this.updateChatState('toolBuilding', frozenSessionId);
//             this.is_generating = true;
//             this.sub_questions = constructSubQuestions(
//               this.sub_questions,
//               packet,
//             );
//             // TODO
//             // this.setAgenticGenerating(true);
//           } else if (Object.hasOwn(packet, 'sub_query')) {
//             this.sub_questions = constructSubQuestions(
//               this.sub_questions,
//               packet,
//             );
//           } else if (
//             Object.hasOwn(packet, 'answer_piece') &&
//             Object.hasOwn(packet, 'answer_type') &&
//             packet.answer_type === 'agent_sub_answer'
//           ) {
//             this.sub_questions = constructSubQuestions(
//               this.sub_questions,
//               packet,
//             );
//           } else if (Object.hasOwn(packet, 'answer_piece')) {
//             // answer += packet.answer_piece;
//
//             this.sub_questions = this.sub_questions.map((subQ) => ({
//               ...subQ,
//               is_generating: false,
//             }));
//
//             if (Object.hasOwn(packet, 'level') && packet.level === 1) {
//               this.second_level_answer += packet.answer_piece;
//             } else {
//               answer += packet.answer_piece;
//             }
//           } else if (
//             Object.hasOwn(packet, 'top_documents') &&
//             Object.hasOwn(packet, 'level_question_num') &&
//             packet.level_question_num !== undefined
//           ) {
//             const documentsResponse = packet;
//             this.sub_questions = constructSubQuestions(
//               this.sub_questions,
//               documentsResponse,
//             );
//
//             if (
//               documentsResponse.level_question_num === 0 &&
//               documentsResponse.level === 0
//             ) {
//               documents = packet.top_documents;
//             } else if (
//               documentsResponse.level_question_num === 0 &&
//               documentsResponse.level === 1
//             ) {
//               this.agenticDocs = packet.top_documents;
//             }
//           } else if (Object.hasOwn(packet, 'top_documents')) {
//             documents = packet.top_documents;
//             query = packet.rephrased_query;
//             retrievalType = RetrievalType.Search;
//             if (documents && documents.length > 0) {
//               // point to the latest message (we don't know the messageId yet, which is why
//               // we have to use -1)
//               // setSelectedMessageForDocDisplay(TEMP_USER_MESSAGE_ID);
//             }
//           } else if (Object.hasOwn(packet, 'tool_name')) {
//             toolCalls = [
//               {
//                 tool_name: packet.tool_name,
//                 tool_args: packet.tool_args,
//                 tool_result: packet.tool_result,
//               },
//             ];
//
//             // if (!toolCall.tool_name.includes("agent")) {
//             //   if (
//             //     !toolCall.tool_result ||
//             //     toolCall.tool_result == undefined
//             //   ) {
//             //     updateChatState("toolBuilding", frozenSessionId);
//             //   } else {
//             //     updateChatState("streaming", frozenSessionId);
//             //   }
//             //
//             //   // This will be consolidated in upcoming tool calls udpate,
//             //   // but for now, we need to set query as early as possible
//             //   if (toolCall.tool_name == SEARCH_TOOL_NAME) {
//             //     query = toolCall.tool_args["query"];
//             //   }
//             // } else {
//             //   toolCall = null;
//             // }
//           } else if (Object.hasOwn(packet, 'file_ids')) {
//             aiMessageImages = packet.file_ids.map((fileId) => {
//               return {
//                 id: fileId,
//                 type: ChatFileType.IMAGE,
//               };
//             });
//           } else if (packet.error) {
//             // TODO: add more on errors and stop reason from original code
//             error = packet.error;
//           } else if (Object.hasOwn(packet, 'message_id')) {
//             finalMessage = packet;
//           }
//
//           const newUserMessageId =
//             finalMessage?.parent_message || TEMP_USER_MESSAGE_ID;
//           const newAssistantMessageId =
//             finalMessage?.message_id || TEMP_ASSISTANT_MESSAGE_ID;
//
//           const localMessages = [
//             {
//               messageId: newUserMessageId,
//               message: currMessage,
//               type: 'user',
//               files: [],
//               toolCalls: [],
//               parentMessageId: parentMessage?.messageId || null,
//               childrenMessageIds: [newAssistantMessageId],
//               latestChildMessageId: newAssistantMessageId,
//             },
//             {
//               ...finalMessage,
//               messageId: newAssistantMessageId,
//               message: error || answer,
//               type: error ? 'error' : 'assistant',
//               retrievalType,
//               query: finalMessage?.rephrased_query || query,
//               documents: finalMessage?.context_docs?.top_documents || documents,
//               citations: finalMessage?.citations || {},
//               sub_questions: finalMessage?.sub_questions || this.sub_questions,
//               files: finalMessage?.files || aiMessageImages || [],
//               toolCalls: finalMessage?.tool_calls || toolCalls,
//               parentMessageId: newUserMessageId,
//               alternateAssistantID: null, // alternativeAssistant?.id,
//             },
//           ];
//           const replacementsMap = finalMessage
//             ? new Map([
//                 [localMessages[0].messageId, TEMP_USER_MESSAGE_ID],
//                 [localMessages[1].messageId, TEMP_ASSISTANT_MESSAGE_ID],
//               ])
//             : null;
//           if (finalMessage) {
//             // console.log('final', finalMessage, localMessages);
//           }
//           const params = {
//             chatSessionId: frozenSessionId,
//             completeMessageMapOverride: frozenMessageMap,
//             messages: localMessages,
//             replacementsMap,
//             setCompleteMessageDetail: this.setCompleteMessageDetail,
//           };
//           newCompleteMessageDetail = upsertToCompleteMessageMap(params);
