FROM python:3.12-slim

# WeasyPrint system deps (pango/cairo). If you don't need real PDF rendering
# and are fine with the reportlab fallback in report.py, you can drop these
# and remove weasyprint from requirements.txt for a much smaller image.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libcairo2 libgdk-pixbuf2.0-0 \
    libffi-dev shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY rules ./rules
COPY src ./src

ENV PYTHONPATH=/app/src
EXPOSE 8000
CMD ["uvicorn", "gatekeeper.main:app", "--host", "0.0.0.0", "--port", "8000"]
