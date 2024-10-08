# PDF to MD

## Docker

Installation and usage:

*Docker compose:*
```yaml
services:
  pdf-to-md:
    ports:
      - "8000:8000"
    container_name: pdf-to-md
    image: ghcr.io/its4nik/pdf-to-md:latest
    restart: always
    volumes:
      - pdf-to-md:/app/app

volumes:
  pdf-to-md:

```

*Docker run:*

```shell
docker volume create pdf-to-md
docker run -p 8000:8000 --name pdf-to-md --restart always -v pdf-to-md:/app/app ghcr.io/its4nik/pdf-to-md:latest
```

## From source

```bash
git clone https://github.com/Its4Nik/pdf-to-md
cd pdf-to-md
pip install --no-cache-dir -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```


