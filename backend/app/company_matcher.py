import re
import unicodedata
from dataclasses import dataclass

from app.models import Company


CORPORATE_SUFFIXES = (
    "sa",
    "s a",
    "s.a",
    "s.a.",
    "sp zoo",
    "sp z oo",
    "sp. z o.o",
    "sp. z o.o.",
    "spolka akcyjna",
)


@dataclass
class CompanyMatchCandidate:
    company: Company
    score: float
    matched_aliases: list[str]


def _strip_diacritics(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def normalize_text(value: str) -> str:
    value = _strip_diacritics(value.casefold())
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _collapse_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _strip_corporate_suffixes(name: str) -> str:
    stripped = name
    for suffix in CORPORATE_SUFFIXES:
        pattern = rf"(?:\s+|^){re.escape(suffix)}$"
        stripped = re.sub(pattern, "", stripped).strip()
    return _collapse_spaces(stripped)


def _company_aliases(company: Company) -> list[str]:
    aliases = {company.full_name}
    aliases.update(alias.name for alias in company.aliases)

    expanded_aliases: set[str] = set()
    for alias in aliases:
        normalized = normalize_text(alias)
        if len(normalized) < 2:
            continue

        expanded_aliases.add(normalized)
        stripped = _strip_corporate_suffixes(normalized)
        if stripped and stripped != normalized and len(stripped) >= 2:
            expanded_aliases.add(stripped)

    return sorted(expanded_aliases, key=len, reverse=True)


def _count_phrase_occurrences(text: str, phrase: str) -> int:
    if not text or not phrase:
        return 0

    pattern = rf"(?<![a-z0-9]){re.escape(phrase)}(?![a-z0-9])"
    return len(re.findall(pattern, text))


def match_companies_to_text(
    companies: list[Company],
    title: str = "",
    content: str = "",
    min_score: float = 1.0,
) -> list[CompanyMatchCandidate]:
    normalized_title = normalize_text(title)
    normalized_content = normalize_text(content)

    candidates: list[CompanyMatchCandidate] = []
    for company in companies:
        alias_hits: list[str] = []
        score = 0.0

        for alias in _company_aliases(company):
            title_hits = _count_phrase_occurrences(normalized_title, alias)
            content_hits = _count_phrase_occurrences(normalized_content, alias)
            if not title_hits and not content_hits:
                continue

            alias_hits.append(alias)

            # Tytuł jest zwykle bardziej diagnostyczny niż treść.
            score += title_hits * 4.0
            score += content_hits * 1.5

            # Dłuższe aliasy są mniej przypadkowe niż krótkie tickery.
            score += min(len(alias.split()) * 0.5, 2.0)
            score += min(len(alias) / 20.0, 1.5)

        if score >= min_score:
            candidates.append(
                CompanyMatchCandidate(
                    company=company,
                    score=round(score, 2),
                    matched_aliases=sorted(set(alias_hits), key=len, reverse=True),
                )
            )

    return sorted(candidates, key=lambda item: item.score, reverse=True)
