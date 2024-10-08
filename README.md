# PDF to MD

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
1.
```bash
docker volume create pdf-to-md
```
2.
```bash
docker run -p 8000:8000 --name pdf-to-md --restart always -v pdf-to-md:/app/app ghcr.io/its4nik/pdf-to-md:latest
```
