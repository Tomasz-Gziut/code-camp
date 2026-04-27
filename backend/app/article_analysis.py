from dataclasses import dataclass

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

POSITIVE_KEYWORDS = [
    "sukces",
    "wzrost",
    "rozszerza",
    "partnerstwo",
    "wygralo",
    "nagroda",
    "laureat",
    "najlepszy",
    "rekord",
    "rozwoj",
    "zysk",
    "innowacja",
]

NEGATIVE_KEYWORDS = [
    "wyciek",
    "atak",
    "naruszenie",
    "pozew",
    "sledztwo",
    "kara",
    "zarzuty",
    "oskarzenie",
    "kontrola",
    "luka",
    "kryzys",
    "spadek",
    "problem",
]


@dataclass
class ArticleAnalysisResult:
    event_type_name: str | None
    sentiment: float


def _count_keywords(text: str, keywords: list[str]) -> int:
    score = 0
    for keyword in keywords:
        score += text.count(normalize_text(keyword))
    return score


def analyze_article(title: str = "", content: str = "") -> ArticleAnalysisResult:
    normalized_title = normalize_text(title)
    normalized_content = normalize_text(content)
    normalized_text = " ".join(part for part in [normalized_title, normalized_content] if part).strip()

    if not normalized_text:
        return ArticleAnalysisResult(event_type_name=None, sentiment=0.0)

    best_event_type_name: str | None = None
    best_event_score = 0.0

    for event_type_name, definition in EVENT_TYPE_DEFINITIONS.items():
        title_hits = _count_keywords(normalized_title, definition["keywords"])
        content_hits = _count_keywords(normalized_content, definition["keywords"])
        weighted_score = title_hits * 2.5 + content_hits

        if weighted_score > best_event_score:
            best_event_score = weighted_score
            best_event_type_name = event_type_name

    positive_hits = _count_keywords(normalized_text, POSITIVE_KEYWORDS)
    negative_hits = _count_keywords(normalized_text, NEGATIVE_KEYWORDS)
    sentiment = (positive_hits - negative_hits) / max(positive_hits + negative_hits, 1)

    if best_event_type_name:
        sentiment += EVENT_TYPE_DEFINITIONS[best_event_type_name]["sentiment_bias"]

    sentiment = max(-1.0, min(1.0, round(sentiment, 4)))
    return ArticleAnalysisResult(
        event_type_name=best_event_type_name if best_event_score > 0 else None,
        sentiment=sentiment,
    )
