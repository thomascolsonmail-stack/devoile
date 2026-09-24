"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications/unread-count")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setCount(data.count))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative w-10 h-10 rounded-full bg-panel2 border border-white/10 flex items-center justify-center text-lg"
      aria-label="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-accent text-[10px] font-bold text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}