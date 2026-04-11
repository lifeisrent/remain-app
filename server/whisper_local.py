#!/usr/bin/env python3
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from faster_whisper import WhisperModel

MODEL_NAME = os.getenv("WHISPER_LOCAL_MODEL", "whisper-1")
PORT = int(os.getenv("WHISPER_LOCAL_PORT", "9000"))

# map common OpenAI-ish names to faster-whisper model sizes
MODEL_MAP = {
    "whisper-1": os.getenv("WHISPER_FASTER_MODEL", "small"),
    "tiny": "tiny",
    "base": "base",
    "small": "small",
    "medium": "medium",
    "large": "large-v3",
    "large-v3": "large-v3",
}

model_size = MODEL_MAP.get(MODEL_NAME, MODEL_NAME)
compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
device = os.getenv("WHISPER_DEVICE", "cpu")

app = FastAPI(title="Remain Local Whisper")
model = WhisperModel(model_size, device=device, compute_type=compute_type)


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": model_size,
        "device": device,
        "compute_type": compute_type,
    }


@app.post("/v1/audio/transcriptions")
async def transcriptions(
    file: UploadFile = File(...),
    model: str = Form(default=MODEL_NAME),
    language: str = Form(default="ko"),
):
    if not file:
        raise HTTPException(status_code=400, detail="file is required")

    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        tmp.write(await file.read())

    try:
        segments, info = model.transcribe(tmp_path, language=language or "ko")
        text = "".join(seg.text for seg in segments).strip()
        return {
            "text": text,
            "language": info.language,
            "duration": info.duration,
            "model": model,
            "provider": "local",
        }
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=PORT)
