import { MessageProcessor } from '../services/messageProcessor';
import { PacketType } from '../types/streamingModels';

describe('MessageProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new MessageProcessor();
  });

  it('should initialize with empty state', () => {
    const result = processor.getMessage();
    expect(result.groupedPackets).toEqual([]);
    expect(result.toolPackets).toEqual([]);
    expect(result.displayPackets).toEqual([]);
    expect(result.citations || {}).toEqual({});
    expect(result.documents).toEqual(null);
    expect(result.isComplete).toBe(false);
  });

  it('should process text message packets', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.MESSAGE_START,
          id: 'msg1',
          content: 'Hello world',
          final_documents: null,
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.groupedPackets).toHaveLength(1);
    expect(result.displayPackets).toContain(0);
    expect(result.groupedPackets[0].packets[0].obj.content).toBe('Hello world');
  });

  it('should process search tool packets', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.SEARCH_TOOL_START,
          search_query: 'test query',
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.groupedPackets).toHaveLength(1);
    expect(result.toolPackets).toContain(0);
  });

  it('should process citation packets', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.CITATION_DELTA,
          citations: [{ citation_num: 1, document_id: 'doc123' }],
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.citations).toEqual({ 1: 'doc123' });
  });

  it('should process document packets', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.SEARCH_TOOL_DELTA,
          documents: [
            {
              document_id: 'doc123',
              semantic_identifier: 'Test Document',
              link: 'https://example.com',
            },
          ],
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].document_id).toBe('doc123');
  });

  it('should process error packets', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.ERROR,
          error: 'Something went wrong',
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.error).toBe('Something went wrong');
  });

  it('should mark as complete when stop packet received', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.MESSAGE_DELTA,
          content: 'Hello',
        },
      },
      {
        ind: 1,
        obj: {
          type: PacketType.STOP,
        },
      },
    ];

    processor.addPackets(packets);
    const result = processor.getMessage();
    expect(result.isComplete).toBe(true);
  });

  it('should reset processor state', () => {
    const packets = [
      {
        ind: 0,
        obj: {
          type: PacketType.MESSAGE_DELTA,
          content: 'Hello',
        },
      },
    ];

    processor.addPackets(packets);
    processor.reset();

    const result = processor.getMessage();
    expect(result.groupedPackets).toEqual([]);
    expect(result.documents).toEqual(null);
    expect(result.citations || {}).toEqual({});
  });
});
