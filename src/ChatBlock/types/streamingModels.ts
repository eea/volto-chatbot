/**
 * Streaming Models for Onyx v2
 * Based on the new packet-based architecture
 */

export interface OnyxDocument {
  document_id: string;
  semantic_identifier: string;
  link: string | null;
  blurb: string;
  content?: string;
  source_type: string;
  updated_at: string | null;
  match_highlights: string[];
  db_doc_id?: number;
  score?: number;
}

interface BaseObj {
  type: string;
}

export enum PacketType {
  MESSAGE_START = 'message_start',
  MESSAGE_DELTA = 'message_delta',
  MESSAGE_END = 'message_end',

  STOP = 'stop',
  SECTION_END = 'section_end',

  // Specific tool packets
  SEARCH_TOOL_START = 'internal_search_tool_start',
  SEARCH_TOOL_DELTA = 'internal_search_tool_delta',
  IMAGE_GENERATION_TOOL_START = 'image_generation_tool_start',
  IMAGE_GENERATION_TOOL_DELTA = 'image_generation_tool_delta',
  FETCH_TOOL_START = 'fetch_tool_start',

  // Custom tool packets
  CUSTOM_TOOL_START = 'custom_tool_start',
  CUSTOM_TOOL_DELTA = 'custom_tool_delta',

  // Reasoning packets
  REASONING_START = 'reasoning_start',
  REASONING_DELTA = 'reasoning_delta',
  REASONING_END = 'reasoning_end',

  CITATION_START = 'citation_start',
  CITATION_DELTA = 'citation_delta',
  CITATION_END = 'citation_end',

  MESSAGE_END_ID_INFO = 'message_end_id_info',

  ERROR = 'error',
}

// Basic Message Packets
export interface MessageStart extends BaseObj {
  id: string;
  type: PacketType.MESSAGE_START;
  content: string;
  final_documents: OnyxDocument[] | null;
}

export interface MessageDelta extends BaseObj {
  content: string;
  type: PacketType.MESSAGE_DELTA;
}

export interface MessageEnd extends BaseObj {
  type: PacketType.MESSAGE_END;
}

// Control Packets
export interface Stop extends BaseObj {
  type: PacketType.STOP;
}

export interface SectionEnd extends BaseObj {
  type: PacketType.SECTION_END;
}

// Specific tool packets
export interface SearchToolStart extends BaseObj {
  type: PacketType.SEARCH_TOOL_START;
  is_internet_search?: boolean;
}

export interface SearchToolDelta extends BaseObj {
  type: PacketType.SEARCH_TOOL_DELTA;
  queries: string[] | null;
  documents: OnyxDocument[] | null;
}

export type ImageShape = 'square' | 'landscape' | 'portrait';

export interface GeneratedImage {
  file_id: string;
  url: string;
  revised_prompt: string;
  shape?: ImageShape;
}

export interface ImageGenerationToolStart extends BaseObj {
  type: PacketType.IMAGE_GENERATION_TOOL_START;
}

export interface ImageGenerationToolDelta extends BaseObj {
  type: PacketType.IMAGE_GENERATION_TOOL_DELTA;
  images: GeneratedImage[];
}

export interface FetchToolStart extends BaseObj {
  type: PacketType.FETCH_TOOL_START;
  queries: string[] | null;
  documents: OnyxDocument[] | null;
}

// Custom Tool Packets
export interface CustomToolStart extends BaseObj {
  type: PacketType.CUSTOM_TOOL_START;
  tool_name: string;
}

export interface CustomToolDelta extends BaseObj {
  type: PacketType.CUSTOM_TOOL_DELTA;
  tool_name: string;
  response_type: string;
  data?: any;
  file_ids?: string[] | null;
}

// Reasoning Packets
export interface ReasoningStart extends BaseObj {
  type: PacketType.REASONING_START;
}

export interface ReasoningDelta extends BaseObj {
  type: PacketType.REASONING_DELTA;
  reasoning: string;
}

export interface ReasoningEnd extends BaseObj {
  type: PacketType.REASONING_END;
}

// Citation Packets
export interface StreamingCitation {
  citation_num: number;
  document_id: string;
}

export interface CitationStart extends BaseObj {
  type: PacketType.CITATION_START;
}

export interface CitationDelta extends BaseObj {
  type: PacketType.CITATION_DELTA;
  citations: StreamingCitation[];
}

export interface CitationEnd extends BaseObj {
  type: PacketType.CITATION_END;
}

export interface MessageEndIdInfo extends BaseObj {
  type: PacketType.MESSAGE_END_ID_INFO;
  user_message_id: number;
  reserved_assistant_message_id: number;
}

// Error packet
export interface ErrorObj extends BaseObj {
  type: PacketType.ERROR;
  error: string;
}

export type ChatObj = MessageStart | MessageDelta | MessageEnd;
export type StopObj = Stop;
export type SectionEndObj = SectionEnd;

// Specific tool objects
export type SearchToolObj = SearchToolStart | SearchToolDelta | SectionEnd;
export type ImageGenerationToolObj =
  | ImageGenerationToolStart
  | ImageGenerationToolDelta
  | SectionEnd;
export type FetchToolObj = FetchToolStart | SectionEnd;
export type CustomToolObj = CustomToolStart | CustomToolDelta | SectionEnd;
export type NewToolObj =
  | SearchToolObj
  | ImageGenerationToolObj
  | FetchToolObj
  | CustomToolObj;

export type ReasoningObj =
  | ReasoningStart
  | ReasoningDelta
  | ReasoningEnd
  | SectionEnd;
export type CitationObj =
  | CitationStart
  | CitationDelta
  | CitationEnd
  | SectionEnd;

// Union type for all possible streaming objects
export type ObjTypes =
  | ChatObj
  | NewToolObj
  | ReasoningObj
  | StopObj
  | SectionEndObj
  | CitationObj
  | ErrorObj
  | MessageEndIdInfo;

// Packet wrapper for streaming objects
export interface Packet {
  ind: number;
  obj: ObjTypes;
}

export interface ChatPacket {
  ind: number;
  obj: ChatObj;
}

export interface StopPacket {
  ind: number;
  obj: StopObj;
}

export interface CitationPacket {
  ind: number;
  obj: CitationObj;
}

// New specific tool packet types
export interface SearchToolPacket {
  ind: number;
  obj: SearchToolObj;
}

export interface ImageGenerationToolPacket {
  ind: number;
  obj: ImageGenerationToolObj;
}

export interface FetchToolPacket {
  ind: number;
  obj: FetchToolObj;
}

export interface CustomToolPacket {
  ind: number;
  obj: CustomToolObj;
}

export interface ReasoningPacket {
  ind: number;
  obj: ReasoningObj;
}

export interface SectionEndPacket {
  ind: number;
  obj: SectionEndObj;
}
