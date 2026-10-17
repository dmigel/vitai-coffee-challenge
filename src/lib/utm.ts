export type UtmPayload = {
  utm_source: string | null;
  utm_campaign: string | null;
  landing_url: string | null;
};

const STORAGE_KEY = "kvarta_utm";

/** Запасной вариант, если localStorage недоступен (встроенные браузеры). */
let memoryUtm: UtmPayload | null = null;

export function saveUtm(payload: UtmPayload): void {
  memoryUtm = payload;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // storage заблокирован — остаёмся на memoryUtm
  }
}

export function readUtm(): UtmPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        return {
          utm_source:
            typeof obj.utm_source === "string" ? obj.utm_source : null,
          utm_campaign:
            typeof obj.utm_campaign === "string" ? obj.utm_campaign : null,
          landing_url:
            typeof obj.landing_url === "string" ? obj.landing_url : null,
        };
      }
    }
  } catch {
    // fall through to memory
  }
  return memoryUtm;
}

/** Читает utm из URL; если есть хотя бы один — сохраняет вместе с landing_url. */
export function captureUtmFromLocation(href: string): void {
  try {
    const url = new URL(href);
    const utm_source = url.searchParams.get("utm_source");
    const utm_campaign = url.searchParams.get("utm_campaign");

    if (!utm_source && !utm_campaign) {
      return;
    }

    saveUtm({
      utm_source: utm_source?.trim() || null,
      utm_campaign: utm_campaign?.trim() || null,
      landing_url: url.href,
    });
  } catch {
    // некорректный URL — молча пропускаем
  }
}
