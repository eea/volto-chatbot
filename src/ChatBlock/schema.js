export function ChatBlockSchema({ assistants, data }) {
  const assistantChoices = () =>
    Array.isArray(assistants)
      ? assistants.map(({ id, name }) => [id.toString(), name])
      : [];

  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'assistant',
          'qgenAsistantId',
          'placeholderPrompt',
          'height',
          'enableQgen',
          'enableFeedback',
          ...(data.enableFeedback ? ['feedbackReasons'] : []),
          'scrollToInput',
          'showToolCalls',
          'showAssistantTitle',
          'showAssistantDescription',
          'showAssistantPrompts',
          'chatTitle',
        ],
      },
    ],
    properties: {
      assistant: {
        title: 'Assistant',
        choices: assistantChoices(),
      },
      qgenAsistantId: {
        title: 'QAssistant',
        choices: assistantChoices(),
        description: 'The assistant used to generate the related questions',
      },
      enableQgen: {
        title: 'Enable related question generation',
        type: 'boolean',
        default: false,
      },
      enableFeedback: {
        title: 'Enable Feedback',
        type: 'boolean',
        default: true,
      },
      feedbackReasons: {
        title: 'Feedback reasons',
        description: 'Select the reasons for negative feedback.',
        choices: [
          ['Repetitive', 'Repetitive'],
          ['Irrelevant', 'Irrelevant'],
          ['Inaccurate/Incomplete', 'Inaccurate/Incomplete'],
          ['Unclear', 'Unclear'],
          ['Slow', 'Slow'],
          ['Wrong source(s)', 'Wrong source(s)'],
          ['Too long', 'Too long'],
          ['Too short', 'Too short'],
          ['Outdated sources', 'Outdated sources'],
          [
            'Too many follow-up questions needed',
            'Too many follow-up questions needed',
          ],
        ],
        isMulti: true,
        default: [
          'Repetitive',
          'Irrelevant',
          'Inaccurate/Incomplete',
          'Unclear',
          'Slow',
          'Wrong source(s)',
          'Too long',
          'Too short',
          'Outdated sources',
          'Too many follow-up questions needed',
        ],
      },
      showToolCalls: {
        title: 'Show query used in retriever',
        type: 'boolean',
        default: true,
      },
      placeholderPrompt: {
        default: 'Ask a question',
        title: 'Prompt',
      },
      showAssistantTitle: {
        title: 'Show assistant title',
        type: 'boolean',
        default: true,
      },
      showAssistantDescription: {
        title: 'Show assistant description',
        type: 'boolean',
        default: true,
      },
      showAssistantPrompts: {
        title: 'Show predefined prompts',
        type: 'boolean',
        default: true,
      },
      chatTitle: {
        title: 'Chat title',
        description: 'Chat are saved with this title. Visible only in Danswer',
        default: 'Online public chat',
      },
      height: {
        title: (
          <a
            target="_blank"
            rel="noreferrer"
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/height"
          >
            Height
          </a>
        ),
        description:
          'Chat window height. ' +
          'Use CSS numeric dimension (ex: 500px or 70vh).',
      },
      scrollToInput: {
        title: 'Scroll the page to focus on the chat input',
        type: 'boolean',
      },
    },
    required: [],
  };
}
