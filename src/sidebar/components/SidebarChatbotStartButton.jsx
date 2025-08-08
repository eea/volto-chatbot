import { selectedSidebarChatbot } from "#stores/sidebarStore";
import config from "@plone/registry";
import { DefaultChatbotStartButton } from "./DefaultChatbotStartButton";

export function SidebarChatbotStartButton({ assistant }) {
  const ChatbotStartButton =
    config.getComponent("ChatbotStartButton")?.component ||
    DefaultChatbotStartButton;

  // TODO: Hide the start button until we've checked we support the dialog element and JS is loaded
  return (
    <ChatbotStartButton
      onClick={() => {
        selectedSidebarChatbot.set(assistant);
      }}
      title={
        config.settings["volto-chatbot"]?.sidebar?.startButtonTitle ||
        "Start assistant chat"
      }
    />
  );
}
