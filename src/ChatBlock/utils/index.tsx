import type { ReactNode, MutableRefObject } from 'react';
import { useState, useCallback, useEffect } from 'react';

export const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

interface CreateChatMessageFeedbackArgs {
  chat_message_id: string;
  feedback_text?: string;
  is_positive: boolean;
  predefined_feedback?: string;
}

// Convert text with email addresses to mailto links
export function transformEmailsToLinks(text: string): (string | ReactNode)[] {
  return text.split(EMAIL_REGEX).map((part, index) => {
    if (EMAIL_REGEX.test(part)) {
      return (
        <a key={index} href={`mailto:${part}`} className="text-email">
          {part}
        </a>
      );
    }
    return part;
  });
}

export function debounce(
  callable: () => void,
  click_signal: MutableRefObject<boolean | null>,
): void {
  if (!click_signal.current) {
    click_signal.current = true;
    setTimeout(() => {
      click_signal.current = null;
    }, 1000);
    callable();
  }
}

export const useCopyToClipboard = (text: string): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, [text]);

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timeout);
  }, [copied]);

  return [copied, copy];
};

export function convertToPercentage(
  floatValue: number,
  digits: number = 2,
): string {
  if (floatValue < 0 || floatValue > 1) {
    return '0%';
  }
  return (floatValue * 100).toFixed(digits) + '%';
}

export async function createChatMessageFeedback({
  chat_message_id,
  feedback_text = '',
  is_positive,
  predefined_feedback = '',
}: CreateChatMessageFeedbackArgs): Promise<any> {
  const payload: {
    chat_message_id: string;
    feedback_text: string;
    is_positive: boolean;
    predefined_feedback?: string;
  } = {
    chat_message_id,
    feedback_text,
    is_positive,
  };

  if (!is_positive) {
    payload.predefined_feedback = predefined_feedback;
  }

  const createChatMessageFeedbackResponse = await fetch(
    '/_da/chat/create-chat-message-feedback',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  if (!createChatMessageFeedbackResponse.ok) {
    //eslint-disable-next-line no-console
    console.log(
      `Failed to submit feedback - ${createChatMessageFeedbackResponse.status}`,
    );
    throw Error(`Failed to submit feedback.`);
  }

  const createChatMessageFeedbackResponseJson =
    await createChatMessageFeedbackResponse.json();
  return await createChatMessageFeedbackResponseJson;
}
