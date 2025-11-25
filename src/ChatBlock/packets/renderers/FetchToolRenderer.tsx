import type {
  FetchToolPacket,
  FetchToolStart,
} from '../../types/streamingModels';
import type { MessageRenderer } from '../../types/interfaces';
import { useEffect } from 'react';
import { PacketType } from '../../types/streamingModels';

export const FetchToolRenderer: MessageRenderer<FetchToolPacket> = ({
  packets,
  onComplete,
  children,
}) => {
  const fetchStart = packets.find(
    (packet) => packet.obj.type === PacketType.FETCH_TOOL_START,
  )?.obj as FetchToolStart | undefined;

  const queries = fetchStart?.queries || [];
  const documents = fetchStart?.documents || [];

  const isComplete = packets.some(
    (packet) => packet.obj.type === PacketType.SECTION_END,
  );

  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  const content = (
    <div className="fetch-tool-renderer">
      <div className="fetch-header">
        <span className="fetch-icon">📥</span>
        <strong>Fetching Documents</strong>
      </div>
      {queries.length > 0 && (
        <div className="fetch-queries">
          {queries.map((query, i) => (
            <div key={i} className="query-item">
              {query}
            </div>
          ))}
        </div>
      )}
      {documents.length > 0 && (
        <div className="fetch-results">
          <div>Fetched {documents.length} documents</div>
        </div>
      )}
    </div>
  );

  return children({
    icon: null,
    status: isComplete ? 'Fetch complete' : 'Fetching...',
    content,
  });
};
