from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import tts, asr, proxy, project, audio

app = FastAPI(
    title="VoiceCraft Pro API",
    description="Backend API for VoiceCraft Pro - Visual dubbing workstation",
    version="1.0.0",
)

# CORS - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(tts.router, prefix="/api/v1/tts", tags=["TTS"])
app.include_router(asr.router, prefix="/api/v1/asr", tags=["ASR"])
app.include_router(proxy.router, prefix="/api/v1/proxy/elevenlabs", tags=["Proxy"])
app.include_router(project.router, prefix="/api/v1/project", tags=["Project"])
app.include_router(audio.router, prefix="/api/v1/audio", tags=["Audio"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "voicecraft-pro"}

@app.get("/")
def root():
    return {"message": "VoiceCraft Pro API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
