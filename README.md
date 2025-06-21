# ai-movie-api

## Prerequisites
- Docker
- Docker Compose

## Setup

1. **Clone the repository:**
    ```sh
    git clone 
    cd ai-movie-api
    ```

2. **Create a `.env` file:**
    ```sh
    cp .env.example .env
    ```
    Edit the `.env` file to include your environment variables.

## Running the Application

1. **Build the Docker images:**
    ```sh
    docker-compose up --build
    ```

2. **Run the Docker containers:**
    ```sh
    docker-compose up
    ```

3. **Access the application:**
    Open your browser and go to `http://localhost:8000` (or the port specified in your `docker-compose.yml`).

## Stopping the Application

1. **Stop the Docker containers:**
    ```sh
    docker-compose down
    ```
test