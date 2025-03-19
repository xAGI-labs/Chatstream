from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
from tempfile import NamedTemporaryFile
import base64
import sys

app = FastAPI(title="Simple Voice Chat Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get OpenAI API key from environment, but don't fail immediately if not found
# as we might get it from the request
default_openai_api_key = os.environ.get("OPENAI_API_KEY")

# Initialize OpenAI client factory function to create clients with specific keys
def create_openai_client(api_key):
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        return client
    except Exception as e:
        print(f"Error initializing client with new SDK: {e}")
        print("Falling back to legacy initialization")
        import openai
        openai.api_key = api_key
        return None  # Signal we're using legacy client

# Helper functions that can use either client style
def transcribe_audio(file, api_key):
    # Create client or use legacy
    client = create_openai_client(api_key)
    
    if client:  # New SDK
        return client.audio.transcriptions.create(
            model="whisper-1",
            file=file,
            language="en"
        )
    else:  # Legacy SDK
        import openai
        openai.api_key = api_key
        return openai.Audio.transcribe("whisper-1", file)
        
def get_chat_completion(messages, api_key):
    # Create client or use legacy
    client = create_openai_client(api_key)
    
    if client:  # New SDK
        return client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
    else:  # Legacy SDK
        import openai
        openai.api_key = api_key
        return openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
        
def generate_speech(text, api_key):
    # Create client or use legacy
    client = create_openai_client(api_key)
    
    if client:  # New SDK
        return client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
    else:  # Legacy SDK
        import openai
        openai.api_key = api_key
        return openai.Audio.speech(
            model="tts-1",
            voice="alloy",
            input=text
        )

class CharacterConfig(BaseModel):
    id: str
    name: str
    instructions: str
    description: Optional[str] = None

@app.post("/api/voice/process")
async def process_voice(
    audio_file: UploadFile = File(...),
    character_id: str = Form(...),
    character_name: str = Form(...),
    character_instructions: str = Form(...),
    openai_api_key: Optional[str] = Form(None)
):
    """Process voice audio and return spoken response"""
    try:
        # Use API key from request if provided, otherwise use default
        api_key = openai_api_key or default_openai_api_key
        
        if not api_key:
            raise HTTPException(
                status_code=400, 
                detail="OpenAI API key is required either in the request or as an environment variable"
            )
        
        print(f"Processing voice request for character: {character_name}")
        
        # Save audio file temporarily
        with NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await audio_file.read())
            temp_audio_path = temp_audio.name

        # Step 1: Convert speech to text using Whisper
        with open(temp_audio_path, "rb") as audio:
            transcript = transcribe_audio(audio, api_key)
            user_text = transcript.text if hasattr(transcript, 'text') else transcript['text']

        print(f"Transcribed user message: {user_text}")

        # Step 2: Get AI response from GPT
        system_prompt = f"You are {character_name}. {character_instructions}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ]
        
        response = get_chat_completion(messages, api_key)
        
        # Extract text response based on client version
        if hasattr(response, 'choices'):
            ai_text_response = response.choices[0].message.content
        else:
            ai_text_response = response['choices'][0]['message']['content']

        print(f"AI response: {ai_text_response[:100]}...")

        # Step 3: Convert response text to speech
        speech_response = generate_speech(ai_text_response, api_key)
        
        # Get audio content based on client version
        if hasattr(speech_response, 'content'):
            audio_data = speech_response.content
        else:
            audio_data = speech_response

        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        # Clean up temp file
        os.unlink(temp_audio_path)

        return {
            "status": "success",
            "user_text": user_text,
            "ai_text": ai_text_response,
            "audio_data": f"data:audio/mp3;base64,{audio_base64}"
        }
        
    except Exception as e:
        # More detailed error information
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing audio: {e}")
        print(error_details)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/")
async def root():
    openai_api_available = "✓" if default_openai_api_key else "✗"
    return {
        "status": "healthy", 
        "service": "Voice Chat Service",
        "openai_api_configured": openai_api_available
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
