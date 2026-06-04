"use client";

import dynamic from "next/dynamic";
import { useAuthStore } from "@/stores/auth-store";

const AiChatButton = dynamic(
  () => import("./ai-chat-button").then((m) => m.AiChatButton),
  { ssr: false },
);

export function AdminAiChatButton() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "admin") return null;

  return <AiChatButton />;
}
