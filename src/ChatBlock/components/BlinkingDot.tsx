export function BlinkingDot({ addMargin = false }: { addMargin?: boolean }) {
  return <span className={`blinking-dot ${addMargin ? 'with-margin' : ''}`} />;
}
