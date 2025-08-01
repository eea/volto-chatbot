import { isSidebarOpen } from "#stores/sidebarStore";
import Icon from "@plone/volto/components/theme/Icon/Icon";
import { forwardRef } from "react";
import { Button } from "semantic-ui-react";

// ChatBlock
import RenderBlocks from "@plone/volto/components/theme/View/RenderBlocks";
import {
  getBlocksFieldname,
  getBlocksLayoutFieldname,
} from "@plone/volto/helpers";
import clearSVG from "@plone/volto/icons/clear.svg";

import config from "@plone/registry";

function ChatBlock({ content }) {
  const blocksFieldname = getBlocksFieldname(content) || "blocks";
  const blocksLayoutFieldname =
    getBlocksLayoutFieldname(content) || "blocks_layout";

  const existingChatBlock = Object.values(
    content?.[blocksFieldname] || {},
  ).find((block) => block["@type"] === "danswerChat");

  const blockContent = {};
  blockContent[blocksFieldname] = {
    "00000000-0000-0000-0000-000000000000": existingChatBlock,
  };
  blockContent[blocksLayoutFieldname] = {
    items: ["00000000-0000-0000-0000-000000000000"],
  };

  return <RenderBlocks content={blockContent} path="/" />;
}

export const SidebarDisplay = forwardRef(function SidebarDisplay(
  { content },
  ref,
) {
  const blocksFieldname = getBlocksFieldname(content) || "blocks";
  const isGlobalModeEnabled = !!Object.values(content[blocksFieldname]).find(
    (block) => block["@type"] === "danswerChat" && block.globalMode === true,
  );

  if (!isGlobalModeEnabled) {
    return false;
  }

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
