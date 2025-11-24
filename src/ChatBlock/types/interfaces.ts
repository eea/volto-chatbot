import type { Packet, OnyxDocument } from './streamingModels';

export type FeedbackType = 'like' | 'dislike';

export enum RetrievalType {
  None = 'none',
  Search = 'search',
  SelectedDocs = 'selectedDocs',
}

export enum ResearchType {
  LegacyAgentic = 'LEGACY_AGENTIC',
  Thoughtful = 'THOUGHTFUL',
  Deep = 'DEEP',
  Fast = 'FAST',
}

export enum ChatFileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  PLAIN_TEXT = 'plain_text',
  CSV = 'csv',
  USER_KNOWLEDGE = 'user_knowledge',
}

export interface Message {
  messageId: number | null;
  nodeId: number;
  message: string; // Unique identifier for tree structure (can be negative for temp messages)
  type: 'user' | 'assistant' | 'system' | 'error';
  retrievalType?: RetrievalType;
  researchType?: ResearchType;
  query?: string | null;
  files: FileDescriptor[];
  toolCall: ToolCallMetadata | null;

  // for rebuilding the message tree
  parentNodeId: number | null;
  childrenNodeIds?: number[];
  latestChildNodeId?: number | null;
  overridden_model?: string;

  // Packet-based data
  packets: Packet[];

  // Cached values for easy access
  documents?: OnyxDocument[] | null;
  citations?: Record<string, string>; // citation_num -> document_id

  // Feedback state
  currentFeedback?: FeedbackType | null;

  // Timestamps
  time_sent?: string;
}

export interface RendererResult {
  icon: React.ComponentType<{ size: number }> | null;
  status: string | null;
  content: JSX.Element;
  expandedText?: JSX.Element;
}

export enum RenderType {
  HIGHLIGHT = 'highlight',
  FULL = 'full',
}

export interface MessageRendererProps<T extends Packet = Packet> {
  packets: T[];
  message: Message;
  libs: {
    [key: string]: any;
  };
  markers?: any;
  stableContextSources?: any;
  addQualityMarkersPlugin?: any;
  onComplete: () => void;
  renderType: RenderType;
  animate: boolean;
  stopPacketSeen: boolean;
  children: (result: RendererResult) => JSX.Element;
}

export type MessageRenderer<T extends Packet = Packet> = React.FC<
  MessageRendererProps<T>
>;

export interface GroupedPackets {
  ind: number;
  packets: Packet[];
}

export interface FileDescriptor {
  id: string;
  type: ChatFileType;
  name?: string | null;

  user_file_id?: string | null;
  // FE only
  isUploading?: boolean;
}

export interface Filters {
  source_type: string[] | null;
  document_set: string[] | null;
  time_cutoff: Date | null;
}

export interface ToolCallMetadata {
  tool_name: string;
  tool_args: Record<string, any>;
  tool_result?: Record<string, any>;
}

export interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  libs?: any;
  onChoice?: (message: string) => void;
  showToolCalls?: boolean;
  enableFeedback?: boolean;
  feedbackReasons?: string[];
  qualityCheck?: string;
  qualityCheckStages?: any[];
  qualityCheckContext?: string;
  qualityCheckEnabled?: boolean;
  noSupportDocumentsMessage?: any;
  totalFailMessage?: any;
  isFetchingRelatedQuestions?: boolean;
  enableShowTotalFailMessage?: boolean;
  enableMatomoTracking?: boolean;
  persona?: number;
  maxContextSegments?: number;
  isLastMessage?: boolean;
  className?: string;
}

export interface Persona {
  id: number;
  name: string;
  description?: string;
}
