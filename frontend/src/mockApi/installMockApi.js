import { MOCK_FIRMS } from "../data/mockFirms";
import { normalize, scoreFirm } from "../utils/firmUtils";

function jsonResponse(body, init) {
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getMethod(input, init) {
  if (init?.method) return String(init.method).toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return "GET";
}

function getUrl(input) {
  if (input instanceof Request) return new URL(input.url);
  return new URL(String(input), window.location.origin);
}

function handleFirmsIndex(url) {
  const query = url.searchParams.get("query") ?? url.searchParams.get("q") ?? "";
  const q = normalize(query);
  if (!q) return MOCK_FIRMS;

  return MOCK_FIRMS
    .map((firm) => ({ firm, score: scoreFirm(firm, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.firm.name.localeCompare(b.firm.name))
    .map((x) => x.firm);
}

function handleFirmShow(url) {
  const id = decodeURIComponent(url.pathname.split("/").pop() || "");
  return MOCK_FIRMS.find((f) => f.id === id) ?? null;
}

export function installMockApi() {
  if (typeof window === "undefined") return;
  if (window.__mockApiInstalled) return;
  window.__mockApiInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const method = getMethod(input, init);
    const url = getUrl(input);

    if (url.origin !== window.location.origin) return nativeFetch(input, init);
    if (!url.pathname.startsWith("/api/")) return nativeFetch(input, init);

    if (method === "GET" && url.pathname === "/api/firms") {
      return jsonResponse(handleFirmsIndex(url), { status: 200 });
    }

    if (method === "GET" && /^\/api\/firms\/[^/]+$/.test(url.pathname)) {
      const firm = handleFirmShow(url);
      if (!firm) return jsonResponse({ error: "not_found" }, { status: 404 });
      return jsonResponse(firm, { status: 200 });
    }

    return jsonResponse({ error: "not_implemented" }, { status: 501 });
  };
}
