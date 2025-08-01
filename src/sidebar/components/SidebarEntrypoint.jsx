import { isSidebarOpen } from "#stores/sidebarStore";
import config from "@plone/registry";

import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import { DefaultChatbotStartButton } from "./DefaultChatbotStartButton";
import { SidebarDisplay } from "./SidebarDisplay";

import "./SidebarEntrypoint.scss";

export function SidebarEntrypoint({ content }) {
  const ChatbotStartButton =
    config.getComponent("ChatbotStartButton")?.component ||
    DefaultChatbotStartButton;
  const sidebarRef = useRef();
  const $isOpen = useStore(isSidebarOpen);

  // Effect for programmatic open/ close via store from elsewhere in the app
  useEffect(() => {
    if (sidebarRef.current) {
      if ($isOpen && !sidebarRef.current.open) {
        sidebarRef.current.showModal();
      } else if (!$isOpen && sidebarRef.current.open) {
        sidebarRef.current.close();
      }
    }
  }, [$isOpen]);

  // TODO: Hide the start button until we've checked we support the dialog element and JS is loaded
  return (
    <>
      <ChatbotStartButton
        onClick={() => {
          isSidebarOpen.set(true);
        }}
        title={
          config.settings["volto-chatbot"]?.sidebar?.startButtonTitle ||
          "Start assistant chat"
        }
      />
      <SidebarDisplay content={content} ref={sidebarRef} />
    </>
  );
}
