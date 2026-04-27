import json
import os
import time
import sys

import httpx


BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
IMPORT_ENDPOINT = f"{BACKEND_URL.rstrip('/')}/companies/import-scraped"
MAX_ATTEMPTS = int(os.getenv("IMPORT_MAX_ATTEMPTS", "20"))
RETRY_DELAY_SECONDS = float(os.getenv("IMPORT_RETRY_DELAY_SECONDS", "3"))


def push_payload_to_backend(payload: dict) -> dict:
    last_error: Exception | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = httpx.post(IMPORT_ENDPOINT, json=payload, timeout=60.0)
            response.raise_for_status()
            return response.json()
        except Exception as error:
            last_error = error
            if attempt == MAX_ATTEMPTS:
                raise
            print(
                f"Import attempt {attempt}/{MAX_ATTEMPTS} failed: {error}. "
                f"Retrying in {RETRY_DELAY_SECONDS}s...",
                flush=True,
            )
            time.sleep(RETRY_DELAY_SECONDS)

    if last_error:
        raise last_error

    raise RuntimeError("Import failed without a captured exception.")


def main() -> int:
    input_path = sys.argv[1] if len(sys.argv) > 1 else "articles.json"

    with open(input_path, "r", encoding="utf-8") as file:
        payload = json.load(file)

    response = push_payload_to_backend(payload)
    print(json.dumps(response, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
