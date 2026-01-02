"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useInactivityDetection() {
  const resetActivity = useAuthStore((state) => state.resetActivity);

  useEffect(() => {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
    ];

    const handleActivity = () => {
      resetActivity();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetActivity]);
}
