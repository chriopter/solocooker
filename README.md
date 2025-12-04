# Solocooker

A fork of [Campfire](https://github.com/basecamp/campfire) by [37signals](https://37signals.com/).

![Solocooker Demo](https://chriopter.de/user/pages/03.texts/campfire-fork-solocooker/solocooker.gif)

## Development

```bash
bin/setup   # Initial setup
bin/dev     # Start dev server
```

## Solocooker Additions

```yaml
# docker-compose.yml
services:
  web:
    image: ghcr.io/chriopter/solocooker:main
    ports:
      - "3333:80"
    environment:
      DISABLE_SSL: "1"  # or use SSL_DOMAIN: chat.example.com
    volumes:
      - ./data/storage:/rails/storage
    restart: unless-stopped
```

```bash
docker compose up -d
```

Secrets are auto-generated on first run and stored in `./data/storage/`.
