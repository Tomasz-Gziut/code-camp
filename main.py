import requests
import json

url = "https://api.gdeltproject.org/api/v2/doc/doc"

params = {
    "query": "Orlen",
    "mode": "ArtList",
    "format": "json",
    "maxrecords": 10,
    "sort": "HybridRel"
}

response = requests.get(url, params=params)
data = response.json()

# zapis do pliku JSON
with open("orlen_news.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("Zapisano do orlen_news.json")