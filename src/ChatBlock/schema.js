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
          'enableQgen',
          'placeholderPrompt',
          'height',
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
    },
    required: [],
  };
}
