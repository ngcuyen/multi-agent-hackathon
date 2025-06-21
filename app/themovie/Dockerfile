# Base image
FROM python:3.12

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file
COPY app/themovie/requirements.txt .

# Install the requirements
RUN pip install --no-cache-dir -r requirements.txt

# Copy the whole FastAPI app
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Command to run the app
CMD ["uvicorn", "app.themovie.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4", "--timeout-keep-alive", "100", "--reload"]