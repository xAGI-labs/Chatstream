#!/bin/bash

# Ensure we have the right dependencies
pip install --upgrade "openai>=1.0.0" "httpx>=0.24.0"

# Set OpenAI API key from environment or .env.local file
if [ -z "$OPENAI_API_KEY" ]; then
    if [ -f "../.env.local" ]; then
        # Extract API key, handling quotes correctly
        OPENAI_API_KEY=$(grep OPENAI_API_KEY ../.env.local | cut -d '=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        export OPENAI_API_KEY
        echo "Using OpenAI API key from .env.local"
        # Verify key format
        if [[ ! $OPENAI_API_KEY == sk-* ]]; then
            echo "WARNING: OpenAI API key doesn't start with 'sk-', which is unusual."
            echo "Current value starts with: ${OPENAI_API_KEY:0:5}..."
        fi
    else
        echo "WARNING: OPENAI_API_KEY not set and no .env.local file found"
        echo "Voice service will rely on API keys provided in each request"
    fi
fi

# Output environment information (useful for debugging)
echo "Environment: $ENVIRONMENT"
echo "Environment variables available to the application:"
echo "- OPENAI_API_KEY: ${OPENAI_API_KEY:0:3}... (partially hidden for security)"
# Add any other important environment variables here

# Start the FastAPI server - in Docker we don't need --reload
# Use --reload only in development environments
if [ "$ENVIRONMENT" = "development" ]; then
    echo "Starting voice service on port 8000 with hot reload..."
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Starting voice service on port 8000 in production mode..."
    uvicorn app:app --host 0.0.0.0 --port 8000
fi
