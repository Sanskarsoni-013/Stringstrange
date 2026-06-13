FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server files
COPY server/ /app/server/

EXPOSE 8001

# Run the server, binding to the environment $PORT variable
CMD ["sh", "-c", "uvicorn server.server:app --host 0.0.0.0 --port ${PORT:-8001}"]
