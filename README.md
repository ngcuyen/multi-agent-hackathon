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
## New Features

### Document Summarization API

The application now includes a comprehensive document summarization API with the following endpoints:

- **POST** `/api/v1/text/summary/text` - Tóm tắt văn bản trực tiếp
- **POST** `/api/v1/text/summary/document` - Tóm tắt tài liệu từ file upload
- **POST** `/api/v1/text/summary/url` - Tóm tắt nội dung từ URL
- **GET** `/api/v1/text/summary/types` - Lấy danh sách loại tóm tắt

#### Features:
- Hỗ trợ nhiều định dạng file: PDF, DOCX, TXT
- Nhiều loại tóm tắt: general, bullet_points, key_insights, executive_summary, detailed
- Hỗ trợ tiếng Việt và tiếng Anh
z- Tích hợp với AWS Bedrock (Claude 3.7)
- Trích xuất nội dung từ URL

#### Quick Test:
```bash
python test_summary_api.py
```

Xem chi tiết trong [SUMMARY_API_DOCS.md](SUMMARY_API_DOCS.md)