#!/usr/bin/env python3
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from faster_whisper import WhisperModel

# model alias mapping
MODEL_MAP = {
    # Railway OOM 방지를 위해 whisper-1 기본 alias를 tiny로 내림
    "whisper-1": os.getenv("WHISPER_FASTER_MODEL", "tiny"),
    "tiny": "tiny",
    "base": "base",
    "small": "small",
    "medium": "medium",
    "large": "large-v3",
    "large-v3": "large-v3",
}

DEFAULT_MODEL_NAME = os.getenv("WHISPER_LOCAL_MODEL", "whisper-1")
MODEL_SIZE = MODEL_MAP.get(DEFAULT_MODEL_NAME, DEFAULT_MODEL_NAME)
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "1"))

app = FastAPI(title="Remain Whisper Service")
model = None

def get_model():
    global model
    if model is None:
        model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return model


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": MODEL_SIZE,
        "device": DEVICE,
        "computeType": COMPUTE_TYPE,
        "beamSize": BEAM_SIZE,
    }


@app.post("/v1/audio/transcriptions")
async def transcriptions(
    file: UploadFile = File(...),
    model_name: str = Form(default=DEFAULT_MODEL_NAME, alias="model"),
    language: str = Form(default="ko"),
):
    if not file:
        raise HTTPException(status_code=400, detail="file is required")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        tmp.write(await file.read())

    try:
        # language fixed to ko by upstream unless caller overrides
        m = get_model()
        segments, info = m.transcribe(
            tmp_path,
            language=language or "ko",
            beam_size=BEAM_SIZE,
            condition_on_previous_text=False,
        )
        text = "".join(seg.text for seg in segments).strip()
        return {
            "text": text,
            "language": info.language,
            "duration": info.duration,
            "model": model_name,
            "provider": "local",
        }
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
