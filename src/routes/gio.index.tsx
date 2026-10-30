import { createFileRoute } from "@tanstack/react-router";
import GioPage from "@/pages/GioPage";

const TITLE = "ГИО — группа инженерного обеспечения";

export const Route = createFileRoute("/gio/")({
  head: () => ({
    meta: [{ title: TITLE }, { property: "og:title", content: TITLE }],
  }),
  component: GioPage,
});
