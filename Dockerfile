FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04

RUN apt update && apt install -y python3 python3-pip python3-dev && \
    ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY app/themovie/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ project
COPY . .

# Mở cổng
EXPOSE 8080

# Chạy Uvicorn (vì bạn dùng reload nên dùng uvicorn thay vì gunicorn)
CMD ["uvicorn", "app.themovie.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4", "--timeout-keep-alive", "100", "--reload"]
