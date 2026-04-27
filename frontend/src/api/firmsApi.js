async function requestJson(path) {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

export function getFirms({ query } = {}) {
  const q = (query ?? "").trim();
  const url = q ? `/api/firms?query=${encodeURIComponent(q)}` : "/api/firms";
  return requestJson(url);
}

export function getFirmById(firmId) {
  return requestJson(`/api/firms/${encodeURIComponent(firmId)}`);
}
