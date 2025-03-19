from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import json
import os
from typing import Dict, Optional

app = FastAPI(title="PipeCat Voice Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to FE URL ptoduction ma
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Flow:
    @classmethod
    def from_config(cls, config):
        return cls(config)
        
    def __init__(self, config):
        self.config = config
        
    def run(self, inputs):
        return {
            "audio_output": inputs.get("audio_input", ""),
            "text_output": f"Echo response for: {inputs.get('audio_input', 'unknown')}"
        }

active_flows: Dict[str, Flow] = {}

class CharacterConfig(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    instructions: str
    flow_config: Optional[dict] = None

def generate_flow_config(character: CharacterConfig) -> dict:
    return {
        "name": f"voice_chat_{character.id}",
        "description": f"Voice chat flow for character {character.name}",
        "character_instructions": character.instructions
    }

@app.post("/api/voice/start-session")
async def start_session(character: CharacterConfig):
    """Start a new voice chat session with a character"""
    try:
        if not character.flow_config:
            flow_config = generate_flow_config(character)
        else:
            flow_config = character.flow_config
        
        flow = Flow.from_config(flow_config)
        session_id = f"session_{character.id}"
        active_flows[session_id] = flow
        
        return {"status": "success", "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/api/voice/process-audio/{session_id}")
async def process_audio(session_id: str, audio_file: UploadFile = File(...)):
    if session_id not in active_flows:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        audio_path = f"temp_{session_id}.wav"
        with open(audio_path, "wb") as f:
            content = await audio_file.read()
            f.write(content)
        
        flow = active_flows[session_id]
        result = flow.run({"audio_input": audio_path})
        
        if os.path.exists(audio_path):
            os.remove(audio_path)
        
        return {
            "status": "success",
            "response_audio": result.get("audio_output"),
            "response_text": result.get("text_output")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process audio: {str(e)}")

@app.delete("/api/voice/end-session/{session_id}")
async def end_session(session_id: str):
    if session_id in active_flows:
        del active_flows[session_id]
    return {"status": "success", "message": "Session ended"}

@app.get("/")
async def root():
    return {"status": "healthy", "service": "PipeCat Voice Service"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
