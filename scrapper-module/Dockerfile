FROM mcr.microsoft.com/playwright/python:v1.58.0-jammy

WORKDIR /collector

COPY collector/requirements.txt .
RUN pip install -r requirements.txt

COPY collector/ .


CMD ["python", "google_news.py"]