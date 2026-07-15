FROM python:3.11-slim

RUN apt-get update && apt-get install -y default-libmysqlclient-dev gcc pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p media/images media/hisobot media/hisobot_arxiv

EXPOSE 8000
CMD ["sh", "-c", "\
  python manage.py migrate --noinput && \
  python manage.py create_default_admin && \
  python manage.py collectstatic --noinput --clear 2>/dev/null || true && \
  gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120\
"]
