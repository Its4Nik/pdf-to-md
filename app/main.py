# app/main.py

from fastapi import FastAPI, File, UploadFile, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pdfplumber
import fitz  # PyMuPDF
import os
import shutil
import uuid
import sqlite3
from pathlib import Path

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Ensure upload directory exists within static
UPLOAD_DIR = Path("app/static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Database setup
DB_PATH = Path("app/files_converted.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS count (
            id INTEGER PRIMARY KEY,
            total INTEGER
        )
    """)
    cursor.execute("SELECT * FROM count WHERE id=1")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO count (id, total) VALUES (1, 0)")
    conn.commit()
    conn.close()

init_db()

def increment_count():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE count SET total = total + 1 WHERE id=1")
    conn.commit()
    cursor.execute("SELECT total FROM count WHERE id=1")
    total = cursor.fetchone()[0]
    conn.close()
    return total

def get_count():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT total FROM count WHERE id=1")
    total = cursor.fetchone()[0]
    conn.close()
    return total

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    total = get_count()
    return templates.TemplateResponse("index.html", {"request": request, "total": total})

@app.post("/convert")
async def convert_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return JSONResponse(status_code=400, content={"error": "Invalid file type. Please upload a PDF."})

    # Save the uploaded PDF
    unique_id = str(uuid.uuid4())
    pdf_path = UPLOAD_DIR.parent / f"{unique_id}.pdf"  # Save PDF one level up to avoid serving it
    with open(pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text using pdfplumber
    markdown_content = ""
    images = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()
                if text:
                    markdown_content += f"## Page {page_num}\n\n{text}\n\n"

        # Extract images using PyMuPDF
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list, start=1):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image_filename = f"{unique_id}_page{page_num+1}_img{img_index}.{image_ext}"
                image_path = UPLOAD_DIR / image_filename
                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)
                images.append(image_filename)
                markdown_content += f"![Image {page_num+1}-{img_index}](static/uploads/{image_filename})\n\n"
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    # Increment the count
    total = increment_count()

    # Clean up the uploaded PDF
    pdf_path.unlink(missing_ok=True)

    return JSONResponse(content={
        "markdown": markdown_content,
        "images": images,
        "total": total
    })
