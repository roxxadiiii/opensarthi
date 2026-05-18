import asyncio
import uuid
import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Any

from planner.agent import agent, AgentDependencies
from tools.desktop import DesktopTools
from tools.system import SystemTools
from voice.pipeline import VoicePipeline

logger = structlog.get_logger()
router = APIRouter()

class Session:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.session_id = str(uuid.uuid4())
        self.desktop_tools = DesktopTools()
        self.system_tools = SystemTools()
        self.voice_pipeline = VoicePipeline()
        async def log_action_cb(tool: str, description: str, status: str, result: Any = None):
            await self.send_message("tool_action", {
                "tool": tool,
                "description": description,
                "status": status,
                "result": result
            })

        self.deps = AgentDependencies(
            desktop=self.desktop_tools,
            system=self.system_tools,
            log_action=log_action_cb
        )
        import db
        self.thread_id = db.create_thread()

    async def send_message(self, msg_type: str, payload: dict):
        msg = {
            "id": str(uuid.uuid4()),
            "type": msg_type,
            "payload": payload,
            "timestamp": int(asyncio.get_event_loop().time() * 1000)
        }
        await self.ws.send_json(msg)

    async def handle_user_message(self, text: str):
        logger.info("Processing user message", text=text)
        
        try:
            import db
            import time
            msg_id = str(uuid.uuid4())
            timestamp = int(time.time() * 1000)
            db.save_message(self.thread_id, msg_id, "user", text, timestamp)

            from config import settings
            # Dynamically resolve model based on config
            model_name = settings.local_model.lower()
            if "gemini" in model_name:
                from pydantic_ai.models.gemini import GeminiModel
                active_model = GeminiModel(settings.local_model)
            else:
                from pydantic_ai.models.openai import OpenAIModel
                from pydantic_ai.providers.openai import OpenAIProvider
                active_model = OpenAIModel(
                    model_name=settings.local_model,
                    provider=OpenAIProvider(
                        base_url='http://localhost:11434/v1',
                        api_key='ollama',
                    )
                )

            result = await agent.run(text, deps=self.deps, model=active_model)
            
            ast_msg_id = str(uuid.uuid4())
            ast_timestamp = int(time.time() * 1000)
            db.save_message(self.thread_id, ast_msg_id, "assistant", result.output, ast_timestamp)

            # Send the assistant's response back to the UI
            await self.send_message("assistant_response", {
                "id": ast_msg_id,
                "role": "assistant",
                "content": result.output,
                "timestamp": ast_timestamp
            })
            
            # Trigger TTS for the response
            # audio_path = await self.voice_pipeline.speak(result.output)
            # await self.send_message("audio_state", {"playing": True, "path": audio_path})
            
        except Exception as e:
            logger.error("Agent execution failed", error=str(e))
            await self.send_message("error", {"error": str(e)})

    async def process_incoming(self, data: dict):
        msg_type = data.get("type")
        payload = data.get("payload", {})

        if msg_type == "user_message":
            await self.handle_user_message(payload.get("text", ""))
        elif msg_type == "session_state":
            active = payload.get("active", False)
            if active:
                asyncio.create_task(self._listen_loop())
            else:
                self.voice_pipeline.stop_listening()
        elif msg_type == "update_settings":
            from config import settings
            settings.local_model = payload.get("local_model", settings.local_model)
            settings.cloud_model = payload.get("cloud_model", settings.cloud_model)
            settings.gemini_api_key = payload.get("gemini_api_key", settings.gemini_api_key)
            if settings.gemini_api_key:
                import os
                os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
            logger.info("Settings updated", local_model=settings.local_model, cloud_model=settings.cloud_model)
            await self.send_message("assistant_response", {
                "id": str(uuid.uuid4()),
                "role": "system",
                "content": f"Settings saved! Local: {settings.local_model}, Cloud: {settings.cloud_model}",
                "timestamp": int(asyncio.get_event_loop().time() * 1000)
            })

    async def _listen_loop(self):
        """Simulate sending transcript updates."""
        await self.send_message("session_state", {"voiceState": "listening"})
        async for transcript in self.voice_pipeline.start_listening():
            await self.send_message("transcript_update", {"text": transcript})

class ConnectionManager:
    def __init__(self):
        self.sessions: dict[WebSocket, Session] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        session = Session(websocket)
        self.sessions[websocket] = session
        logger.info("Client connected", session_id=session.session_id)
        return session

    def disconnect(self, websocket: WebSocket):
        if websocket in self.sessions:
            session = self.sessions.pop(websocket)
            session.voice_pipeline.stop_listening()
            logger.info("Client disconnected", session_id=session.session_id)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    session = await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await session.process_incoming(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        manager.disconnect(websocket)
