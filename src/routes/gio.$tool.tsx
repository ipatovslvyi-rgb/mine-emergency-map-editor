import { createFileRoute, notFound } from "@tanstack/react-router";
import GioPage, { TOOLS } from "@/pages/GioPage";

export const Route = createFileRoute("/gio/$tool")({
  loader: ({ params }) => {
    const tool = TOOLS.find((t) => t.id === params.tool);
    if (!tool) throw notFound();
    return { label: tool.label };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `ГИО — ${loaderData.label}` : "ГИО — группа инженерного обеспечения";
    return { meta: [{ title }, { property: "og:title", content: title }] };
  },
  component: GioPage,
});
