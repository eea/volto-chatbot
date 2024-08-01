export function ChatBlockSchema({ assistants }) {
  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Defalt',
        fields: ['assistant'],
      },
    ],
    properties: {
      assistant: {
        title: 'Assistant',
        choices: assistants.map(({ id, name }) => [id.toString(), name]),
      },
    },
    required: [],
  };
}
