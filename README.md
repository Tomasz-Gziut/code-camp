# Code Camp
## Autorzy
- Tomasz Gziut  
- Wojciech Sowa  
- Aleksy Szłapa  
- Volodymyr Kot 
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

## Detekcja firmy z artykułu

Backend ma endpoint do mapowania artykułu na firmę z bazy na podstawie
`full_name` i aliasów:

```bash
curl -X POST "http://localhost:8000/articles/detect-company" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Kontrola KNF w PKO BP\",\"content\":\"KNF wszczela kontrole procedur kredytowych w PKO Banku Polskim.\"}"
```

To nie jest czysty NER. Endpoint dopasowuje tekst do znanych spółek i zwraca
`best_match` oraz listę `candidates` z punktacją.
