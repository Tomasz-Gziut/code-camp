export async function requestJson(path) {
  const response = await fetch(path, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return response.json();
}
