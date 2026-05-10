"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-lg dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <WifiOff className="size-4" />
        <span>当前处于离线状态，部分功能可能不可用</span>
      </div>
    </div>
  );
}
