"use client";

import { useEffect, useState } from "react";

type NetworkConnection = {
  saveData?: boolean;
  effectiveType?: string;
};

function canLoadVideo(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  const connection = (
    navigator as Navigator & { connection?: NetworkConnection }
  ).connection;

  if (connection?.saveData) {
    return false;
  }

  if (
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g"
  ) {
    return false;
  }

  return true;
}

function pickVideoSrc(): string {
  return window.matchMedia("(min-width: 768px)").matches
    ? "/video/bg.mp4"
    : "/video/bgMin.mp4";
}

export function HeroBackgroundVideo() {
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canLoadVideo()) {
      return;
    }

    const mount = () => setSrc(pickVideoSrc());

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(mount);
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(mount, 1);
    return () => window.clearTimeout(id);
  }, []);

  if (!src) {
    return null;
  }

  return (
    <video
      className={`hero-video absolute inset-0 h-full w-full object-cover${ready ? " is-ready" : ""}`}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      onCanPlay={() => setReady(true)}
      aria-hidden
      tabIndex={-1}
    />
  );
}
