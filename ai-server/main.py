import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_KEY")

app = FastAPI(title="eventpinmap ai-fill")


class AiFillRequest(BaseModel):
    text: str = Field(..., description="Free text in Japanese")
    tz: Optional[str] = Field("Asia/Tokyo")
    now_iso: Optional[str] = Field(None, description="Client now in ISO8601")
    locale: Optional[str] = Field("ja-JP")
    hint_city: Optional[str] = Field(None)


class AiFillResponse(BaseModel):
    what: Optional[str] = None
    where_text: Optional[str] = None
    start_iso: Optional[str] = None
    end_iso: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


SYSTEM_PROMPT = (
    "あなたは日本語の自由文からイベントの構造化情報を抽出するアシスタントです。"
    "日付や時間の相対表現（今日/明日/明後日/今週末/曜日）を、与えられた now_iso と tz を使ってISO8601に正規化して下さい。"
    "時間範囲が不明な場合は開始+2時間で end_iso を補完して下さい。"
    "出力は必ず厳密なJSONのみ（追加のテキストなし）で、以下のキーを含めてください:"
    "{what, where_text, start_iso, end_iso}。"
)

async def call_gemini_structured(text: str, tz: str, now_iso: Optional[str]) -> AiFillResponse:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not set")

    snippet = text.strip()
    if len(snippet) > 600:
        snippet = snippet[:600]
    now = now_iso or datetime.now(timezone.utc).isoformat()

    # Use REST API for Gemini. Force JSON output via responseMimeType.
    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"

    user_text = (
        f"{SYSTEM_PROMPT}\n\n"
        f"text: {snippet}\n"
        f"tz: {tz}\n"
        f"now_iso: {now}\n"
        "出力はJSONのみ。キーは what, where_text, start_iso, end_iso。"
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_text}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, json=payload)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Gemini error {r.status_code}: {r.text}")
        data = r.json()
        try:
            parts = data["candidates"][0]["content"]["parts"]
            # Concatenate text parts in case there are multiple
            content = "".join(p.get("text", "") for p in parts)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Invalid Gemini response: {e}")

    try:
        import json

        obj = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Non-JSON Gemini content: {e}")

    return AiFillResponse(**obj)


async def call_openai_structured(text: str, tz: str, now_iso: Optional[str]) -> AiFillResponse:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set")

    # Minimal safety: limit input length
    snippet = text.strip()
    if len(snippet) > 600:  # ~ short prompt budget
        snippet = snippet[:600]

    now = now_iso or datetime.now(timezone.utc).isoformat()

    # Use responses API (JSON mode) if available; fall back to a strict instruction
    # We call the Chat Completions API with JSON schema enforcement.
    schema = {
        "type": "object",
        "properties": {
            "what": {"type": "string"},
            "where_text": {"type": "string"},
            "start_iso": {"type": "string"},
            "end_iso": {"type": "string"},
        },
        "required": ["what", "start_iso"],
        "additionalProperties": False,
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"text: {snippet}\n"
                    f"tz: {tz}\n"
                    f"now_iso: {now}\n"
                    "出力はJSONのみ。キーは what, where_text, start_iso, end_iso。"
                ),
            },
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "ai_fill_schema",
                "schema": schema,
                "strict": True,
            },
        },
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenAI error {r.status_code}: {r.text}")
        data = r.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Invalid OpenAI response: {e}")

    try:
        import json

        obj = json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Non-JSON OpenAI content: {e}")

    return AiFillResponse(**obj)


async def geocode(address: Optional[str]) -> tuple[Optional[float], Optional[float], Optional[str]]:
    if not address:
        return None, None, None
    if not GOOGLE_MAPS_KEY:
        return None, None, address
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": GOOGLE_MAPS_KEY}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, params=params)
        if r.status_code >= 400:
            return None, None, address
        j = r.json()
        if j.get("status") != "OK":
            return None, None, address
        top = j["results"][0]
        loc = top["geometry"]["location"]
        return float(loc["lat"]), float(loc["lng"]), top.get("formatted_address", address)


@app.post("/ai-fill", response_model=AiFillResponse)
async def ai_fill(req: AiFillRequest) -> AiFillResponse:
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")
    # Prefer Gemini if key is provided; otherwise fall back to OpenAI if available
    if GEMINI_API_KEY:
        res = await call_gemini_structured(req.text, req.tz or "Asia/Tokyo", req.now_iso)
    elif OPENAI_API_KEY:
        res = await call_openai_structured(req.text, req.tz or "Asia/Tokyo", req.now_iso)
    else:
        raise HTTPException(status_code=500, detail="No LLM API key set (GEMINI_API_KEY or OPENAI_API_KEY)")
    # Optional server-side geocoding (keep client secrets safe)
    lat, lng, normalized = await geocode(res.where_text)
    res.latitude = lat
    res.longitude = lng
    if normalized:
        res.where_text = normalized
    return res


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8787"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
