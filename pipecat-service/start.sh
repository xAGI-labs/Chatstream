#!/bin/bash

# Ensure we have the right dependencies
pip install --upgrade "openai>=1.0.0" "httpx>=0.24.0"

# Set OpenAI API key from environment or .env.local file
if [ -z "$OPENAI_API_KEY" ]; then
    if [ -f "../.env.local" ]; then
        export OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.local | cut -d '=' -f2)
        echo "Using OpenAI API key from .env.local"
    else
        echo "ERROR: OPENAI_API_KEY not set and no .env.local file found"
        exit 1
    fi
fi

# Start the FastAPI server
echo "Starting voice service on port 8000..."
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
