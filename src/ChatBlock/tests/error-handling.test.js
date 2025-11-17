import { hasError, isStreamingComplete } from '../services/packetUtils';
import { PacketType } from '../types/streamingModels';

describe('Error handling in packets', () => {
  test('hasError should detect error packets', () => {
    const packetsWithError = [
      { ind: 0, obj: { type: PacketType.REASONING_START } },
      {
        ind: 0,
        obj: { type: PacketType.REASONING_DELTA, reasoning: 'Some reasoning' },
      },
      {
        ind: -1,
        obj: {
          type: PacketType.ERROR,
          error:
            'Final answer is empty. Inference provider likely failed to provide content packets.',
        },
      },
    ];

    const packetsWithoutError = [
      { ind: 0, obj: { type: PacketType.REASONING_START } },
      {
        ind: 0,
        obj: { type: PacketType.REASONING_DELTA, reasoning: 'Some reasoning' },
      },
      { ind: 0, obj: { type: PacketType.STOP } },
    ];

    const { hasError: hasErrorResult, errorMessage } =
      hasError(packetsWithError);
    expect(hasErrorResult).toBe(true);
    expect(errorMessage).toBe(
      'Final answer is empty. Inference provider likely failed to provide content packets.',
    );

    const { hasError: noErrorResult } = hasError(packetsWithoutError);
    expect(noErrorResult).toBe(false);
  });

  test('isStreamingComplete should detect both stop packets and error packets', () => {
    const packetsWithStop = [
      { ind: 0, obj: { type: PacketType.REASONING_START } },
      { ind: 0, obj: { type: PacketType.STOP } },
    ];

    const packetsWithError = [
      { ind: 0, obj: { type: PacketType.REASONING_START } },
      {
        ind: -1,
        obj: { type: PacketType.ERROR, error: 'Some error occurred' },
      },
    ];

    const packetsIncomplete = [
      { ind: 0, obj: { type: PacketType.REASONING_START } },
      {
        ind: 0,
        obj: { type: PacketType.REASONING_DELTA, reasoning: 'Some reasoning' },
      },
    ];

    expect(isStreamingComplete(packetsWithStop)).toBe(true);
    expect(isStreamingComplete(packetsWithError)).toBe(true);
    expect(isStreamingComplete(packetsIncomplete)).toBe(false);
  });
});
