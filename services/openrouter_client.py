# services/openrouter_client.py
# OpenRouter chat completions for the Telegram bot (Gemini Flash Lite 2.0)

import json
import os
import urllib.error
import urllib.request
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite")


def _headers() -> dict[str, str]:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is not set")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_HTTP_REFERER", os.getenv("APP_URL", "https://gajianaman.xyz")),
        "X-Title": os.getenv("OPENROUTER_APP_TITLE", "Gajian Aman Bot"),
    }


def _post_chat(payload: dict) -> str:
    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers=_headers(),
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter HTTP {exc.code}: {body}") from exc

    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"Unexpected OpenRouter response: {data}") from exc


def chat_completion(
    *,
    system: str | None = None,
    user: str,
    max_tokens: int = 256,
) -> str:
    messages: list[dict] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": user})
    return _post_chat(
        {
            "model": OPENROUTER_MODEL,
            "messages": messages,
            "max_tokens": max_tokens,
        }
    )


def chat_completion_with_image(
    *,
    system: str,
    user: str,
    image_b64: str,
    media_type: str = "image/jpeg",
    max_tokens: int = 512,
) -> str:
    return _post_chat(
        {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_b64}",
                            },
                        },
                    ],
                },
            ],
            "max_tokens": max_tokens,
        }
    )
