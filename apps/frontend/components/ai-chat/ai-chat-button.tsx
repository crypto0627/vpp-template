"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AiChatModal } from "./ai-chat-modal";

export function AiChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed right-6 bottom-6 z-50 pointer-events-auto">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full p-0 shadow-2xl hover:scale-110 transition-transform duration-300 overflow-hidden border-4 border-[#DA7756]"
          aria-label="開啟 AI 助手"
        >
          <Image
            src="/ai-button.jpg"
            alt="AI Chat"
            width={64}
            height={64}
            className="object-cover"
          />
        </Button>
      </div>

      <AiChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
