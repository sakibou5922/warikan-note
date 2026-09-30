declare global {
  interface Window {
    __WARIKAN_API_BASE__?: string;
    __WARIKAN_PAGES__?: boolean;
  }
}

export function apiUrl(path: string) {
  return `${typeof window === "undefined" ? "" : window.__WARIKAN_API_BASE__ ?? ""}${path}`;
}

export function homeHref() {
  return typeof window !== "undefined" && window.__WARIKAN_PAGES__ ? window.location.pathname : "/";
}

export function groupHref(id: string) {
  return typeof window !== "undefined" && window.__WARIKAN_PAGES__ ? `${window.location.pathname}?g=${id}` : `/g/${id}`;
}
