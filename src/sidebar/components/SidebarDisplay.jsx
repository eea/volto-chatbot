import { selectedSidebarChatbot } from "#stores/sidebarStore";
import ChatWindow from "@eeacms/volto-chatbot/ChatBlock/ChatWindow";
import { useStore } from "@nanostores/react";
import Icon from "@plone/volto/components/theme/Icon/Icon";
import { Button } from "semantic-ui-react";

// ChatBlock
import { getBlocksFieldname } from "@plone/volto/helpers";
import clearSVG from "@plone/volto/icons/clear.svg";
import { forwardRef } from "react";
import superagent from "superagent";
import withDanswerData from "../../ChatBlock/withDanswerData";

import config from "@plone/registry";

const ChatBlockDisplay = withDanswerData(({ assistant }) => [
  "assistantData",
  typeof assistant !== "undefined" && assistant !== null
    ? superagent.get(`/_da/persona/${assistant}`).type("json")
    : null,
  assistant,
])(function ChatBlockDisplay({ data, assistantData }) {
  if (!assistantData) {
    return null;
  }
  return <ChatWindow persona={assistantData} {...data} />;
});

export const SidebarDisplay = forwardRef(function SidebarDisplay(
  { content },
  ref,
) {
  const $selectedSidebarChatbot = useStore(selectedSidebarChatbot);

  const blocksFieldname = getBlocksFieldname(content) || "blocks";

  const sidebarBlockData = Object.values(content?.[blocksFieldname] || {}).find(
    (block) =>
      block["@type"] === "danswerChat" &&
      block.assistant == $selectedSidebarChatbot,
  );
  const sidebarTitle =
    sidebarBlockData?.starterPromptsHeading ||
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
                  selectedSidebarChatbot.set(null);
                }}
              >
                <Icon circled name={clearSVG} size="48px" />
              </Button>
              <h2 id="dialog_heading">{sidebarTitle}</h2>
            </div>
            <ChatBlockDisplay
              assistant={$selectedSidebarChatbot}
              data={sidebarBlockData}
            />
          </div>
        </dialog>
      </div>
    </>
  );
});
