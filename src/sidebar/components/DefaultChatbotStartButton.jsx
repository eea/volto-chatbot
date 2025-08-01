import { Button } from "semantic-ui-react";

export function DefaultChatbotStartButton({ onClick, title }) {
  return (
    <Button primary onClick={onClick} size="big">
      {title}
    </Button>
  );
}
