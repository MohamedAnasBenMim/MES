# Base Python image
FROM python:3.14-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for PostgreSQL and building packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

EXPOSE 8000

# Start server using Gunicorn WSGI
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "Backend.wsgi:application"]
