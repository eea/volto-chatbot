# Streaming Format Differences

## Old Format (response-9.jsonl) - Legacy Agent Search

This format is used by the old `ChatMessageBubble` component and represents the legacy streaming implementation.

### Structure:

```json
{"user_message_id": 11736, "reserved_assistant_message_id": 11737}
{"tool_name": "agent_search_0", "tool_args": {"query": "..."}}
{"level": 0, "level_question_num": 0, "sub_question": "..."}
{"level": 0, "level_question_num": 0, "sub_query": "...", "query_id": 1}
{"level": 0, "level_question_num": 1, "answer_piece": "Here", "answer_type": "agent_sub_answer"}
{"llm_selected_doc_indices": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
```

### Key Fields:

- `answer_piece` - Text chunks for the answer
- `answer_type` - Type like "agent_sub_answer"
- `level` - Nesting level for multi-stage search
- `level_question_num` - Question number at that level
- `sub_question` - Sub-questions generated during search
- `sub_query` - Query parts for search
- `query_id` - Identifier for queries
- `tool_name` - Tool being executed
- `tool_args` - Arguments for the tool
- `llm_selected_doc_indices` - Document indices selected
- `stop_reason` - Completion status
- `stream_type` - Type of stream (e.g., "sub_questions")

---

## New Format (response-12.jsonl) - Onyx v2 Packet-Based

This format is used by the new TypeScript components (`AIMessage`, `ChatMessage`, etc.) and represents the modern Onyx v2 streaming architecture.

### Structure:

```json
{"user_message_id": 658, "reserved_assistant_message_id": 659}
{"ind": 1, "obj": {"type": "reasoning_start"}}
{"ind": 1, "obj": {"type": "reasoning_delta", "reasoning": "The user wants..."}}
{"ind": 1, "obj": {"type": "section_end"}}
{"ind": 7, "obj": {"type": "message_delta", "content": "**Overview**"}}
{"ind": 7, "obj": {"type": "citation_delta", "citation_num": 1, "document_id": "doc123"}}
{"ind": 0, "obj": {"type": "stop"}}
```

### Key Fields:

- `ind` - Index for grouping packets (tools/reasoning/messages are grouped by ind)
- `obj.type` - Packet type (see types below)
- `obj.content` - Text content for message deltas
- `obj.reasoning` - Reasoning text for reasoning deltas
- `obj.citation_num` - Citation number
- `obj.document_id` - Document identifier

### Packet Types:

- `reasoning_start` - Start of reasoning section
- `reasoning_delta` - Reasoning text chunk
- `section_end` - End of reasoning/tool section
- `message_delta` - Answer text chunk
- `citation_delta` - Citation information
- `search_tool_delta` - Search tool execution info
- `stop` - Stream complete

---

## Compatibility Status

### ✅ Fully Compatible with New Format:

- **Message streaming** - `message_delta` with `content`
- **Reasoning display** - `reasoning_start`, `reasoning_delta`, `section_end`
- **Tool execution** - Grouped by `ind` with `search_tool_delta`
- **Citations** - `citation_delta` packets
- **Documents** - Embedded in packet data
- **Packet grouping** - By `ind` for parallel execution
- **Stop detection** - `stop` packet type

### ⚠️ Old Format Features (Not in New Format):

These features from the old format are NOT present in the new Onyx v2 format:

- **Agent sub-questions** - Multi-level question decomposition
- **Query streaming** - `sub_query` deltas
- **`answer_type` field** - Used to distinguish answer types
- **`level` and `level_question_num`** - Multi-stage search hierarchy
- **`llm_selected_doc_indices`** - Explicit document selection

### 📝 Implementation Status:

#### Props Now Properly Used in AIMessage:

1. ✅ **`showSources`** - Conditionally shows/hides sources
2. ✅ **`noSupportDocumentsMessage`** - Displays when no documents found
3. ✅ **`allToolsDisplayed`** - Controls when to show final answer (waits for tools)
4. ✅ **`libs`** - Available for markdown rendering (currently using direct imports)
5. ✅ **`feedbackReasons`** - Passed to UserActionsToolbar
6. ✅ **`qualityCheck`** - Passed to HalloumiFeedback
7. ✅ **`enableMatomoTracking`** - Passed to analytics components

#### Legacy Features Not Implemented (Old Format Only):

- **Agent questions accordion** - Displays sub-questions hierarchy
- **Analyzing toggle** - Shows/hides reasoning for sub-questions
- **Multi-level answers** - Answers at different hierarchy levels

---

## Migration Notes

The new implementation focuses on the Onyx v2 packet-based format which is:

- **Simpler** - Flat structure with `ind` grouping
- **More flexible** - Extensible packet types
- **Better typed** - Clear TypeScript interfaces
- **More efficient** - Parallel execution via `ind` grouping

The old format's multi-level agent search features are specific to that implementation and not part of the modern Onyx v2 architecture.
