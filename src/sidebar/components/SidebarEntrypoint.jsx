import { isSidebarOpen } from "#stores/sidebarStore";

import { useStore } from "@nanostores/react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { SidebarDisplay } from "./SidebarDisplay";

import "./SidebarEntrypoint.scss";

export function SidebarEntrypoint() {
  const sidebarRef = useRef();
  const $isOpen = useStore(isSidebarOpen);
  const content = useSelector((state) => state.content.data);

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
      <SidebarDisplay content={content} ref={sidebarRef} />
    </>
  );
}
