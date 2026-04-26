from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
import httpx
from config import ELEVENLABS_API_KEY, ELEVENLABS_BASE_URL

router = APIRouter()

def get_headers():
    return {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }

async def proxy_request(method: str, path: str, body: dict = None, query=None):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API Key 未配置")

    url = f"{ELEVENLABS_BASE_URL}/{path}"
    async with httpx.AsyncClient() as client:
        kwargs = {"headers": get_headers()}
        if body:
            kwargs["json"] = body
        if query:
            kwargs["params"] = query

        resp = await client.request(method, url, **kwargs)
        return Response(
            content=resp.content,
            status_code=resp.status_code,
            headers={"content-type": resp.headers.get("content-type", "application/json")},
        )

@router.get("/voices")
async def list_voices():
    return await proxy_request("GET", "voices")

@router.get("/voices/{voice_id}")
async def voice_details(voice_id: str):
    return await proxy_request("GET", f"voices/{voice_id}")

@router.get("/user/subscription")
async def subscription():
    return await proxy_request("GET", "user/subscription")

# 透传所有其他请求
@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(request: Request, path: str):
    body = await request.json() if request.method in ["POST", "PUT", "PATCH"] else None
    return await proxy_request(request.method, path, body)
