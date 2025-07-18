# Base image
FROM python:3.12

# Install system dependencies for OCR and SSL certificates
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-vie \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    libpoppler-cpp-dev \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Verify tessdata directory and available languages
RUN tesseract --list-langs

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file
COPY app/mutil_agent/requirements.txt .

# Install the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the whole FastAPI app
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app directly
CMD ["uvicorn", "app.mutil_agent.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4", "--timeout-keep-alive", "100", "--reload"]
