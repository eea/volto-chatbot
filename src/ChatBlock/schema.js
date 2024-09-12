export function ChatBlockSchema({ assistants }) {
  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Defalt',
        fields: ['assistant', 'placeholderPrompt'],
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
    },
    required: [],
  };
}
