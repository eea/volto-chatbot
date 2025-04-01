export function ChatBlockSchema({ assistants }) {
  const assistantChoices = () =>
    Array.isArray(assistants)
      ? assistants.map(({ id, name }) => [id.toString(), name])
      : [];

  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Defalt',
        fields: [
          'assistant',
          'qgenAsistantId',
          'placeholderPrompt',
          'height',
          'enableQgen',
          'scrollToInput',
          'showToolCalls',
          'deepResearch',
          'showAssistantTitle',
          'showAssistantDescription',
          'showAssistantPrompts',
          'chatTitle',
        ],
      },
    ],
    properties: {
      deepResearch: {
        title: 'Deep research',
        choices: [
          ['always_on', 'Always on'],
          ['unavailable', 'Unavailable'],
          ['user_on', 'User choice, on by default'],
          ['user_off', 'User choice, off by default'],
        ],
      },
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
          'Use CSS numeric dimmension (ex: 500px or 70vh).',
      },
      scrollToInput: {
        title: 'Scroll the page to focus on the chat input',
        type: 'boolean',
      },
    },
    required: [],
  };
}
