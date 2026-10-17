"use client";

import { useEffect } from "react";

import { captureUtmFromLocation } from "@/lib/utm";

/** При загрузке сохраняет utm_source / utm_campaign + landing_url, если utm есть в URL. */
export function UtmCapture() {
  useEffect(() => {
    captureUtmFromLocation(window.location.href);
  }, []);

  return null;
}
