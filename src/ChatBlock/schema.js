export function ChatBlockSchema({ formData }) {
  return {
    title: 'Chatbot',
    fieldsets: [
      {
        id: 'default',
        title: 'Defalt',
        fields: [],
      },
    ],
    properties: {
      title: {
        title: 'Title',
      },
    },
    required: [],
  };
}
