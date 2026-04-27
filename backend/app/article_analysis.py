import re
from dataclasses import dataclass, field

from app.company_matcher import normalize_text


EVENT_TYPE_DEFINITIONS = {
    "naruszenie danych": {
        "score": -30,
        "keywords": [
            "wyciek",
            "naruszenie danych",
            "atak hakerski",
            "cyberatak",
            "haker",
            "ransomware",
            "okup",
            "luka",
            "wykradl",
            "wykradli",
            "breach",
            "hack",
        ],
        "sentiment_bias": -0.65,
    },
    "partnerstwa i wzrost": {
        "score": 22,
        "keywords": [
            "partnerstwo",
            "wspolpraca",
            "umowa",
            "kontrakt",
            "akwizycja",
            "przejecie",
            "przejmuje",
            "otwiera",
            "ekspansja",
            "rozszerza",
            "inwestycja",
            "finansowanie",
            "pozyskal",
            "wzrost",
        ],
        "sentiment_bias": 0.45,
    },
    "postepowania prawne": {
        "score": -50,
        "keywords": [
            "pozew",
            "pozwanie",
            "sad",
            "prokuratura",
            "sledztwo",
            "zarzuty",
            "oskarzenie",
            "oskarzony",
            "wyrok",
            "kara",
            "postepowanie prawne",
            "spor",
        ],
        "sentiment_bias": -0.75,
    },
    "nagrody i reputacja": {
        "score": 15,
        "keywords": [
            "nagroda",
            "laureat",
            "wyroznienie",
            "ranking",
            "certyfikat",
            "lider",
            "najlepszy",
            "reputacja",
            "doceniony",
            "award",
        ],
        "sentiment_bias": 0.55,
    },
    "nadzor regulacyjny": {
        "score": -20,
        "keywords": [
            "knf",
            "uokik",
            "regulator",
            "kontrola",
            "nadzor",
            "compliance",
            "audyt",
            "inspekcja",
            "urzad",
            "postepowanie administracyjne",
        ],
        "sentiment_bias": -0.35,
    },
}

# Słowa do bazowego obliczania sentimentu — celowo nie pokrywają się z event keywords
POSITIVE_KEYWORDS = [
    "sukces",
    "rekord",
    "rozwoj",
    "zysk",
    "innowacja",
    "przychod",
    "poprawa",
    "lepsza",
]

NEGATIVE_KEYWORDS = [
    "kryzys",
    "spadek",
    "problem",
    "strata",
    "bankructwo",
    "upadlosc",
    "awaria",
    "skandal",
]


@dataclass
class ArticleAnalysisResult:
    event_type_names: list[str] = field(default_factory=list)
    sentiment: float = 0.0


def _count_keywords(text: str, keywords: list[str]) -> int:
    score = 0
    for keyword in keywords:
        norm = normalize_text(keyword)
        if not norm:
            continue
        pattern = rf"(?<![a-z0-9]){re.escape(norm)}(?![a-z0-9])"
        score += len(re.findall(pattern, text))
    return score


def analyze_article(title: str = "", content: str = "") -> ArticleAnalysisResult:
    normalized_title = normalize_text(title)
    normalized_content = normalize_text(content)
    normalized_text = " ".join(part for part in [normalized_title, normalized_content] if part).strip()

    if not normalized_text:
        return ArticleAnalysisResult()

    # Wykryj WSZYSTKIE pasujące typy zdarzeń (nie tylko najlepszy)
    detected_events: list[tuple[str, float]] = []  # (name, sentiment_bias)
    for event_type_name, definition in EVENT_TYPE_DEFINITIONS.items():
        title_hits = _count_keywords(normalized_title, definition["keywords"])
        content_hits = _count_keywords(normalized_content, definition["keywords"])
        weighted_score = title_hits * 2.5 + content_hits
        if weighted_score > 0:
            detected_events.append((event_type_name, definition["sentiment_bias"]))

    # Bazowy sentiment z neutralnych słów kluczowych
    positive_hits = _count_keywords(normalized_text, POSITIVE_KEYWORDS)
    negative_hits = _count_keywords(normalized_text, NEGATIVE_KEYWORDS)
    sentiment = (positive_hits - negative_hits) / max(positive_hits + negative_hits, 1)

    # Dodaj biasy ze wszystkich wykrytych eventów (suma, nie średnia — wiele złych eventów = silniejszy sygnał)
    for _, bias in detected_events:
        sentiment += bias

    sentiment = max(-1.0, min(1.0, round(sentiment, 4)))
    return ArticleAnalysisResult(
        event_type_names=[name for name, _ in detected_events],
        sentiment=sentiment,
    )
