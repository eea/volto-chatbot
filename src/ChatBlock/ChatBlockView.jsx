import React from "react";
import superagent from "superagent";
import ChatWindow from "./ChatWindow";
import withDanswerData from "./withDanswerData";

import { SidebarChatbotStartButton } from "@eeacms/volto-chatbot/sidebar/components/SidebarChatbotStartButton";

const OnPageChat = withDanswerData((props) => [
  "assistantData",
  typeof props.data?.assistant !== "undefined"
    ? superagent.get(`/_da/persona/${props.data.assistant}`).type("json")
    : null,
  props.data?.assistant,
])(function OnPageChat(props) {
  const { assistantData, data, isEditMode } = props;

  return assistantData ? (
    <ChatWindow persona={assistantData} isEditMode={isEditMode} {...data} />
  ) : (
    <div>Chatbot</div>
  );
});

export default function ChatBlockView(props) {
  const { data, isEditMode } = props;

  if (data.globalMode) {
    if (isEditMode) {
      return (
        <div inert="">
          <SidebarChatbotStartButton assistant={data.assistant} />
        </div>
      );
    }
    return <SidebarChatbotStartButton assistant={data.assistant} />;
  }

  return <OnPageChat {...props} />;
}
