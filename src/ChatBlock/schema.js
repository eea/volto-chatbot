export function ChatBlockSchema({ assistants }) {
  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Defalt',
        fields: [
          'assistant',
          'placeholderPrompt',
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
        choices: assistants?.map(({ id, name }) => [id.toString(), name]),
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
    },
    required: [],
  };
}
