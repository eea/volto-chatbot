export async function createChatSession(personaId, description) {
  const createChatSessionResponse = await fetch(
    '/_da/chat/create-chat-session',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        persona_id: personaId,
        description,
      }),
    },
  );
  if (!createChatSessionResponse.ok) {
    //eslint-disable-next-line no-console
    console.log(
      `Failed to create chat session - ${createChatSessionResponse.status}`,
    );
    throw Error('Failed to create chat session');
  }
  const chatSessionResponseJson = await createChatSessionResponse.json();
  return chatSessionResponseJson.chat_session_id;
}
