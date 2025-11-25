declare module '*.less' {}

declare module '*.svg' {
  const attributes: Record<string, string>;
  const content: string;
  export default content;
}
