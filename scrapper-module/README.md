# Code Camp — System Monitorowania Reputacji Firm

## Wymagania

- Python 3.10+
- Git

Sprawdź wersję Pythona:

```bash
python --version
```

---

## Krok 1 — Sklonuj repo i wejdź do folderu

```bash
git clone <url-repo>
cd code-camp
```

---

## Krok 2 — Utwórz i aktywuj środowisko wirtualne (venv)

**Windows (PowerShell / CMD):**

```bash
python -m venv venv
venv\Scripts\activate
```

**Windows (Git Bash):**

```bash
python -m venv venv
source venv/Scripts/activate
```

**macOS / Linux:**

```bash
python -m venv venv
source venv/bin/activate
```

Po aktywacji na początku linii terminala pojawi się `(venv)`:

```
(venv) C:\...\code-camp>
```

---

## Krok 3 — Zainstaluj zależności

```bash
pip install -r requirements.txt
playwright install chromium
```

---

## Krok 4 — Uruchom kolektor (Krok 1: Google News RSS)

```bash
python scrapper-module/collector/google_news.py
```

Zobaczysz coś takiego:

```
============================================================
  Firma: PKN Orlen
============================================================
  Znaleziono: 23 artykułów

  [1] Orlen zawiesza dostawy do rafinerii...
      Źródło:    Rzeczpospolita
      Data:      Sun, 27 Apr 2026 08:14:00 GMT
      URL:       https://...
```

---

## Jak dodać własne firmy

Edytuj listę `COMPANIES` na dole pliku `collector/google_news.py`:

```python
COMPANIES = [
    {
        "name": "Twoja Firma S.A.",
        "aliases": ["Skrót", "Poprzednia nazwa"],
    },
]
```

---

## Struktura projektu

```
code-camp/
├── collector/
│   └── google_news.py   # Krok 1: zbieranie artykułów z Google News RSS
├── requirements.txt
└── README.md
```

---

## Dezaktywacja venv (gdy skończyłeś pracę)

```bash
deactivate
```
