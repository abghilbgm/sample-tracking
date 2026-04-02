FROM python:3.12-slim

WORKDIR /app

# No third-party dependencies; keep the image small and deterministic.
ENV PYTHONUNBUFFERED=1

COPY . .

EXPOSE 8000

CMD ["python", "server.py"]

