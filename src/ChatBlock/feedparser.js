import { upsertToMessageStore } from './upsetToCompleteMessageMap';
import {
  CurrentMessageFIFO,
  buildLatestMessageChain,
  constructSubQuestions,
  createChatSession,
  // delay,
  extractJSON,
  fetchRelatedQuestions,
  getLastSuccessfulMessageId,
  updateCurrentMessageFIFO,
} from './lib';
import {
  ChatFileType,
  RetrievalType,
  SYSTEM_MESSAGE_ID,
  TEMP_ASSISTANT_MESSAGE_ID,
  TEMP_USER_MESSAGE_ID,
} from './constants';

export class FeedParser {
  constructor({
    frozenSessionId,
    frozenMessageMap,
    parentMessage,
    currMessage,
    setCompleteMessageDetail,
  }) {
    this.frozenSessionId = frozenSessionId;
    this.parentMessage = parentMessage;
    this.currMessage = currMessage;
    this.frozenMessageMap = frozenMessageMap;
    this.setCompleteMessageDetail = setCompleteMessageDetail;

    this.answer = '';
    this.query = null;
    this.retrievalType = RetrievalType.None;
    this.documents = []; // selectedDocuments;
    this.aiMessageImages = null; // shouldn't be needed
    this.error = null;
    this.finalMessage = null;
    this.toolCalls = [];
    this.secondLevelMessageId = null;
    this.includeAgentic = false;
    this.is_generating = false;
    this.isStreamingQuestions = false;
    this.second_level_generating = false;
    this.sub_questions = [];
    this.agenticDocs = [];

    this.signals = [
      'agentic_message_ids',
      'level',
      'is_agentic',
      'refined_answer_improvement',
      'stream_type',
      'stop_reason',
      'sub_question',
      'sub_query',
      'answer_piece',
      'top_documents',
      'tool_name',
      'file_ids',
      'error',
      'message_id',
    ];
  }

  read(packet) {
    this.signals.forEach((name) => {
      if (Object.hasOwn(packet, name)) {
        const handler = this[`handle_${name}`];
        handler(packet);
      }
    });
  }

  handle_agentic_message_ids(packet) {
    const msg_ids = packet.agentic_message_ids;
    const msg_id = msg_ids.find((item) => item.level === 1)?.message_id;
    if (msg_id) {
      this.secondLevelMessageId = msg_id;
      this.includeAgentic = true;
    }
  }

  handle_level(packet) {
    if (packet.level === 1) {
      this.second_level_generating = true;
    }
  }

  handle_is_agentic(packet) {
    this.isAgentic = packet.is_agentic;
  }

  handle_refined_answer_improvement(packet) {
    this.isImprovement = packet.refined_answer_improvement;
  }

  handle_stream_type(packet) {
    if (packet.stream_type === 'main_answer') {
      this.is_generating = false;
      this.second_level_generating = true;
    }
  }

  handle_stop_reason(packet) {
    if (Object.hasOwn(packet, 'level_question_num')) {
      if (
        packet.stream_type === 'sub_questions' &&
        (packet.level_question_num === undefined ||
          packet.level_question_num === null)
      ) {
        this.isStreamingQuestions = false;
      }
      this.sub_questions = constructSubQuestions(this.sub_questions, packet);
    }
  }

  handle_sub_question(packet) {
    // TODO
    // this.updateChatState('toolBuilding', frozenSessionId);
    this.is_generating = true;
    this.sub_questions = constructSubQuestions(this.sub_questions, packet);
    // TODO
    // this.setAgenticGenerating(true);
  }

  handle_sub_query(packet) {
    this.sub_questions = constructSubQuestions(this.sub_questions, packet);
  }

  handle_answer_piece(packet) {
    if (
      Object.hasOwn(packet, 'answer_type') &&
      packet.answer_type === 'agent_sub_answer'
    ) {
      this.sub_questions = constructSubQuestions(this.sub_questions, packet);
    } else {
      // answer += packet.answer_piece;

      this.sub_questions = this.sub_questions.map((subQ) => ({
        ...subQ,
        is_generating: false,
      }));

      if (Object.hasOwn(packet, 'level') && packet.level === 1) {
        this.second_level_answer += packet.answer_piece;
      } else {
        this.answer += packet.answer_piece;
      }
    }
  }

  handle_top_documents(packet) {
    this.sub_questions = constructSubQuestions(this.sub_questions, packet);

    if (packet.level_question_num === 0 && packet.level === 0) {
      this.documents = packet.top_documents;
    } else if (packet.level_question_num === 0 && packet.level === 1) {
      this.agenticDocs = packet.top_documents;
    } else {
      this.documents = packet.top_documents;
      this.query = packet.rephrased_query;
      this.retrievalType = RetrievalType.Search;
      if (this.documents && this.documents.length > 0) {
        // point to the latest message (we don't know the messageId yet, which is why
        // we have to use -1)
        // setSelectedMessageForDocDisplay(TEMP_USER_MESSAGE_ID);
      }
    }
  }

  handle_tool_name(packet) {
    this.toolCalls = [
      {
        tool_name: packet.tool_name,
        tool_args: packet.tool_args,
        tool_result: packet.tool_result,
      },
    ];

    // if (!toolCall.tool_name.includes("agent")) {
    //   if (
    //     !toolCall.tool_result ||
    //     toolCall.tool_result == undefined
    //   ) {
    //     updateChatState("toolBuilding", frozenSessionId);
    //   } else {
    //     updateChatState("streaming", frozenSessionId);
    //   }
    //
    //   // This will be consolidated in upcoming tool calls udpate,
    //   // but for now, we need to set query as early as possible
    //   if (toolCall.tool_name == SEARCH_TOOL_NAME) {
    //     query = toolCall.tool_args["query"];
    //   }
    // } else {
    //   toolCall = null;
    // }
  }

  handle_file_ids(packet) {
    this.aiMessageImages = packet.file_ids.map((fileId) => {
      return {
        id: fileId,
        type: ChatFileType.IMAGE,
      };
    });
  }

  handle_error(packet) {
    this.error = packet.error;
  }

  handle_message_id(packet) {
    this.finalMessage = packet;
  }

  getCompleteMessageStore() {
    const newUserMessageId =
      this.finalMessage?.parent_message || TEMP_USER_MESSAGE_ID;
    const newAssistantMessageId =
      this.finalMessage?.message_id || TEMP_ASSISTANT_MESSAGE_ID;

    const localMessages = [
      {
        messageId: newUserMessageId,
        message: this.currMessage,
        type: 'user',
        files: [],
        toolCalls: [],
        parentMessageId: this.parentMessage?.messageId || null,
        childrenMessageIds: [newAssistantMessageId],
        latestChildMessageId: newAssistantMessageId,
      },
      {
        ...this.finalMessage,
        messageId: newAssistantMessageId,
        message: this.error || this.answer,
        type: this.error ? 'error' : 'assistant',
        retrievalType: this.retrievalType,
        query: this.finalMessage?.rephrased_query || this.query,
        documents:
          this.finalMessage?.context_docs?.top_documents || this.documents,
        citations: this.finalMessage?.citations || {},
        sub_questions: this.finalMessage?.sub_questions || this.sub_questions,
        files: this.finalMessage?.files || this.aiMessageImages || [],
        toolCalls: this.finalMessage?.tool_calls || this.toolCalls,
        parentMessageId: newUserMessageId,
        alternateAssistantID: null, // alternativeAssistant?.id,
      },
    ];
    const replacementsMap = this.finalMessage
      ? new Map([
          [localMessages[0].messageId, TEMP_USER_MESSAGE_ID],
          [localMessages[1].messageId, TEMP_ASSISTANT_MESSAGE_ID],
        ])
      : null;
    const params = {
      chatSessionId: this.frozenSessionId,
      completeMessageMapOverride: this.frozenMessageMap,
      messages: localMessages,
      replacementsMap,
      setCompleteMessageDetail: this.setCompleteMessageDetail,
    };
    const messageStore = upsertToMessageStore(params);
    return messageStore;
  }
}
