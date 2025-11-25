import type { Message } from '../types/interfaces';

/**
 * Regex to match citation markers like [1], [2], etc.
 * The negative lookahead (?![[(\])])  ensures we don't match citations
 * that are already formatted as links like [1](1) or [1][ or [1]]
 */
const CITATION_MATCH = /\[\d+\](?![[(\])])/gm;

/**
 * Transforms citation markers [1] into markdown links [1](1)
 * so they can be rendered as clickable citations by the Citation component.
 *
 * @param text - The text containing citation markers
 * @returns The text with citations transformed into markdown links
 */
export function addCitations(text: string, message: Message): string {
  return text.replaceAll(CITATION_MATCH, (match) => {
    const number = match.match(/\d+/)?.[0];
    if (!number || !message.citations) {
      return text;
    }
    return `[${match}](${message.citations[number]})`;
  });
}
