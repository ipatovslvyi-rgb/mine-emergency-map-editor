import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import GioPage from "@/pages/GioPage";

const TITLE = "ГИО — ЗВТ";

// Old short link: shows the ZVT tool and replaces the address with /gio/zvt, as before.
export const Route = createFileRoute("/zvt")({
  head: () => ({
    meta: [{ title: TITLE }, { property: "og:title", content: TITLE }],
  }),
  component: ZvtRedirect,
});

function ZvtRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/gio/$tool", params: { tool: "zvt" }, replace: true });
  }, [navigate]);
  return <GioPage toolId="zvt" />;
}
