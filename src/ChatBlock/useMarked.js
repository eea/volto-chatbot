import React from 'react';

// import { marked } from 'marked';
// import { Renderer } from 'marked';
// import hljs from 'highlight.js';

export function useMarked(libs) {
  const hljs = libs.highlightJs.default;
  const { marked, Renderer } = libs.marked;

  const renderer = React.useMemo(() => new Renderer(), [Renderer]);

  renderer.paragraph = (text) => {
    return text + '\n';
  };
  renderer.list = (text) => {
    return `${text}\n\n`;
  };
  renderer.listitem = (text) => {
    return `\n• ${text}`;
  };
  renderer.code = (code, language) => {
    const validLanguage = hljs.getLanguage(language || '')
      ? language
      : 'plaintext';
    const lang = validLanguage || 'plaintext';
    const highlightedCode = hljs.highlight(lang, code).value;
    return `<pre class="highlight bg-gray-700" style="padding: 5px; border-radius: 5px; overflow: auto; overflow-wrap: anywhere; white-space: pre-wrap; max-width: 100%; display: block; line-height: 1.2">
<code class="${language}" style="color: #d6e2ef; font-size: 12px; ">${highlightedCode}</code>
</pre>`;
  };

  marked.setOptions({ renderer });

  const parser = React.useCallback(
    async (msg) => {
      const res = await marked.parse(`## Hello world

this is my text.

- this is a list
- and another list
`);
      console.log('parsing message', { msg, res });
      return res;
    },
    [marked],
  );

  return { parser };
}
