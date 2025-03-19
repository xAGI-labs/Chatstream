FROM python:3.9-slim

WORKDIR /app

# Install system dependencies including curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Add non-root user for security
RUN adduser --disabled-password --gecos '' appuser
# Give permission to the directory
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:8000/ || exit 1

# Use main.py as the entry point (based on your codebase)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
