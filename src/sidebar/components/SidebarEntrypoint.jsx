import config from "@plone/registry";
import RenderBlocks from "@plone/volto/components/theme/View/RenderBlocks";
import { forwardRef, useEffect, useRef } from "react";
import { Button } from "semantic-ui-react";
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { DefaultChatbotStartButton } from "./DefaultChatbotStartButton";
import "./SidebarEntrypoint.scss";

import clearSVG from '@plone/volto/icons/clear.svg';

import { isSidebarOpen } from "#stores/sidebarStore";
import { useStore } from "@nanostores/react";
import {
  getBlocksFieldname,
  getBlocksLayoutFieldname,
} from "@plone/volto/helpers";

function ChatBlock({ content }) {
  const blocksFieldname = getBlocksFieldname(content) || "blocks";
  const blocksLayoutFieldname =
    getBlocksLayoutFieldname(content) || "blocks_layout";

  const existingChatBlock = Object.values(content?.[blocksFieldname] || {}).find(
    (block) => block["@type"] === "danswerChat",
  );

  const blockContent = {};
  blockContent[blocksFieldname] = {
    "00000000-0000-0000-0000-000000000000": existingChatBlock
  };
  blockContent[blocksLayoutFieldname] = {
    items: ["00000000-0000-0000-0000-000000000000"],
  };

  return <RenderBlocks content={blockContent} path="/" />;
}

const ChatbotSidebar = forwardRef(function ChatbotSidebar({ content }, ref) {
  const sidebarTitle =
    config.settings["volto-chatbot"]?.sidebar?.sidebarTitle ||
    "Help using this site";

  return (
    <>
      <div id="chatbot-sidebar">
        <dialog
          aria-modal="true"
          id="chatbot-sidebar-dialog"
          aria-labelledby="dialog_heading"
          ref={ref}
        >
          <div className="dialogContent">
            <div className="heading">
              <Button
                type="button"
                basic
                aria-label={"Close"}
                onClick={() => {
                  isSidebarOpen.set(false);
                }}
              >
                <Icon circled name={clearSVG} size="48px" />
              </Button>
              <h2 id="dialog_heading">{sidebarTitle}</h2>
            </div>
            <ChatBlock content={content} />
          </div>
        </dialog>
      </div>
    </>
  );
});

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
      <div className="fab">
        <ChatbotStartButton
          onClick={() => {
            isSidebarOpen.set(true);
          }}
          title={
            config.settings["volto-chatbot"]?.sidebar?.startButtonTitle ||
            "Start assistant chat"
          }
        />
      </div>
      <ChatbotSidebar content={content} ref={sidebarRef} />
    </>
  );
}
