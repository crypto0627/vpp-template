"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AiChatModal } from "./ai-chat-modal";

const BUTTON_SIZE = 64; // h-16 w-16
const MARGIN = 24; // keep this gap from viewport edges
const DRAG_THRESHOLD = 5; // px moved before a press counts as a drag (not a click)
const STORAGE_KEY = "vpp-ai-button-pos";

interface Position {
  x: number;
  y: number;
}

function clampToViewport({ x, y }: Position): Position {
  return {
    x: Math.max(MARGIN, Math.min(x, window.innerWidth - BUTTON_SIZE - MARGIN)),
    y: Math.max(MARGIN, Math.min(y, window.innerHeight - BUTTON_SIZE - MARGIN)),
  };
}

export function AiChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  // ssr:false (loaded via AdminAiChatButton), so window is available here.
  const [pos, setPos] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return clampToViewport(JSON.parse(saved) as Position);
    } catch {
      // ignore malformed storage
    }
    return clampToViewport({
      x: window.innerWidth - BUTTON_SIZE - MARGIN,
      y: window.innerHeight - BUTTON_SIZE - MARGIN,
    });
  });
  const dragState = useRef<{
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  // Re-clamp when the window resizes so the button never strands off-screen.
  useEffect(() => {
    const onResize = () => setPos((prev) => clampToViewport(prev));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragState.current = {
        offsetX: e.clientX - pos.x,
        offsetY: e.clientY - pos.y,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_THRESHOLD) {
      d.moved = true;
    }
    setPos(
      clampToViewport({ x: e.clientX - d.offsetX, y: e.clientY - d.offsetY }),
    );
  }, []);

  const onPointerUp = useCallback(() => {
    const d = dragState.current;
    dragState.current = null;
    if (!d) return;
    if (d.moved) {
      // End of a drag — persist the resting position.
      setPos((prev) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
        } catch {
          // ignore storage failures
        }
        return prev;
      });
    } else {
      // A plain click — open the chat.
      setIsOpen(true);
    }
  }, []);

  return (
    <>
      <div
        className="fixed z-50"
        style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      >
        <Button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="h-16 w-16 rounded-full p-0 shadow-2xl hover:scale-110 transition-transform duration-300 overflow-hidden border-4 border-[#DA7756] cursor-grab active:cursor-grabbing"
          aria-label="開啟 AI 助手"
        >
          <Image
            src="/ai-button.jpg"
            alt="AI Chat"
            width={64}
            height={64}
            draggable={false}
            className="object-cover pointer-events-none"
          />
        </Button>
      </div>

      <AiChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
