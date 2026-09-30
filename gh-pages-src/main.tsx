import React from "react";
import { createRoot } from "react-dom/client";
import Home from "@/app/home-client";
import GroupClient from "@/app/g/[id]/group-client";
import "@/app/globals.css";
import "@/app/product.css";

window.__WARIKAN_PAGES__ = true;
window.__WARIKAN_API_BASE__ = "https://warikan-together-20260930.dorachan59.chatgpt.site";

const groupId = new URLSearchParams(window.location.search).get("g");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {groupId ? <GroupClient id={groupId} /> : <Home />}
  </React.StrictMode>,
);
