"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTime(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function LiveClock({ className }: { className?: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(formatDateTime(new Date()));
    const id = setInterval(() => setTime(formatDateTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className={className ?? "text-xs text-white/40 font-mono tabular-nums"}>
      {time}
    </span>
  );
}
