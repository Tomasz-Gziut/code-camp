# Code Camp

## Szybki start

W katalogu głównym projektu uruchom:

```bash
docker compose up --build
```

## Mockowe dane do bazy

Po starcie kontenerów załaduj dane:

```bash
docker compose exec backend python seed.py
```

Uwaga:

- seed działa tylko w `APP_ENV=development`
- seed czyści istniejące dane i wstawia je od nowa

## Adresy

- frontend: `http://localhost:5173`
- backend: `http://localhost:8000`
- swagger: `http://localhost:8000/docs`
- scraper: `http://localhost:8001`

## Przydatne komendy

Start w tle:

```bash
docker compose up -d --build
```

Zatrzymanie:

```bash
docker compose down
```

Reset bazy z usunięciem volume:

```bash
docker compose down -v
```

Po resecie bazy uruchom ponownie:

```bash
docker compose up --build
docker compose exec backend python seed.py
```

Logi:

```bash
docker compose logs -f
```

## Szybkie sprawdzenie

```bash
curl http://localhost:8000/health
curl http://localhost:8000/companies
```
