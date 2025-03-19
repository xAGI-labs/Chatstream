FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create requirements.txt if it doesn't exist
RUN echo "fastapi>=0.95.0\nuvicorn>=0.21.1\npydantic>=1.10.7\nopenai>=1.0.0\nhttpx>=0.24.0\npython-multipart>=0.0.6" > requirements.txt

# Install requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make the start script executable
RUN chmod +x start.sh

# Add non-root user for security
RUN adduser --disabled-password --gecos '' appuser
# Give permission to the directory
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8000/ || exit 1

# Use start.sh script as the entry point instead of directly running uvicorn
CMD ["./start.sh"]
