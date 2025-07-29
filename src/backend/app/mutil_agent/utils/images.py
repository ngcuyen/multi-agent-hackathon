import base64
import logging
from io import BytesIO

import requests
from PIL import Image


def url_to_base64(image_url):
    try:
        response = requests.get(image_url)
        response.raise_for_status()

        image_data = BytesIO(response.content)
        image = Image.open(image_data)

        if image.mode != "RGB":
            image = image.convert("RGB")

        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"{img_str}"

    except requests.exceptions.RequestException as e:
        logging.error(f"[ERROR]: Failed to download image: {e}")
        return None
    except Exception as e:
        logging.error(f"[ERROR]: Failed to process image: {e}")
        return None
