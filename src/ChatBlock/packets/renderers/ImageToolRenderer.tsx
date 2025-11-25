import { useEffect } from 'react';
import type {
  ImageGenerationToolPacket,
  ImageGenerationToolDelta,
  GeneratedImage,
} from '../../types/streamingModels';
import type { MessageRenderer } from '../../types/interfaces';
import { PacketType } from '../../types/streamingModels';

export const ImageToolRenderer: MessageRenderer<ImageGenerationToolPacket> = ({
  packets,
  onComplete,
  children,
}) => {
  const imageDeltas = packets
    .filter(
      (packet) => packet.obj.type === PacketType.IMAGE_GENERATION_TOOL_DELTA,
    )
    .map((packet) => packet.obj as ImageGenerationToolDelta);

  const images: GeneratedImage[] = imageDeltas.flatMap(
    (delta) => delta.images || [],
  );

  const isComplete = packets.some(
    (packet) => packet.obj.type === PacketType.SECTION_END,
  );

  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  const content = (
    <div className="image-tool-renderer">
      <div className="images-header">
        <strong>Generated Images</strong>
      </div>
      <div className="images-grid">
        {images.map((image, i) => (
          <div key={image.file_id} className="image-item">
            <img
              src={image.url}
              alt={image.revised_prompt}
              className={`image-shape-${image.shape || 'square'}`}
            />
            {image.revised_prompt && (
              <div className="image-prompt">{image.revised_prompt}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return children({
    icon: null,
    status: isComplete ? 'Images generated' : 'Generating images...',
    content,
  });
};
