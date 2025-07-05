# Base image
FROM python:3.12

# Install system dependencies for lightweight OCR
RUN apt-get update && apt-get install -y \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set the working directory
WORKDIR /app

# Copy requirements file first to leverage Docker cache
COPY app/riskassessment/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.org/simple

# Copy application code
COPY . .

# Expose application port
EXPOSE 8080

# Start the FastAPI application
CMD ["uvicorn", "app.riskassessment.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4", "--timeout-keep-alive", "100", "--reload"]
