import re
from datetime import datetime, timezone


STOP_WORDS = {
    "a", "an", "the", "and", "or", "of", "in", "on", "at",
    "to", "for", "with", "near", "my", "is", "was", "were",
    "it", "this", "that", "has", "have", "had", "found",
    "lost", "item", "please",
}


def tokenize(text: str) -> set[str]:
    """Convert text into useful, normalized keywords."""
    words = re.findall(r"[a-z0-9]+", text.lower())

    return {
        word
        for word in words
        if word not in STOP_WORDS and len(word) > 1
    }


def keyword_similarity(first: str, second: str) -> float:
    """Compare two pieces of text using keyword overlap."""
    first_words = tokenize(first)
    second_words = tokenize(second)

    if not first_words or not second_words:
        return 0.0

    overlap = first_words & second_words

    # Overlap coefficient: useful when one description is
    # longer than the other.
    return len(overlap) / min(len(first_words), len(second_words))


def location_similarity(first: str, second: str) -> float:
    """Compare location names."""
    first_normalized = " ".join(first.lower().split())
    second_normalized = " ".join(second.lower().split())

    if first_normalized == second_normalized:
        return 1.0

    return keyword_similarity(first_normalized, second_normalized)


def date_score(first_date: datetime, second_date: datetime) -> int:
    """Give a small bonus to reports posted close together."""
    if first_date.tzinfo is None:
        first_date = first_date.replace(tzinfo=timezone.utc)

    if second_date.tzinfo is None:
        second_date = second_date.replace(tzinfo=timezone.utc)

    days_apart = abs((first_date - second_date).total_seconds()) / 86400

    if days_apart <= 7:
        return 5

    if days_apart <= 30:
        return 3

    if days_apart <= 90:
        return 1

    return 0


def calculate_match(lost_item, found_item) -> dict:
    """Calculate an explainable match score between two reports."""
    score = 0
    reasons = []

    # Category: maximum 25 points.
    if lost_item.category.strip().lower() == found_item.category.strip().lower():
        score += 25
        reasons.append("Same category")

    # Title: maximum 30 points.
    title_similarity = keyword_similarity(
        lost_item.title,
        found_item.title,
    )
    title_points = round(title_similarity * 30)
    score += title_points

    if title_points > 0:
        reasons.append("Similar item titles")

    # Description: maximum 20 points.
    description_similarity = keyword_similarity(
        lost_item.description,
        found_item.description,
    )
    description_points = round(description_similarity * 20)
    score += description_points

    if description_points > 0:
        reasons.append("Similar descriptions")

    # Location: maximum 20 points.
    location_match = location_similarity(
        lost_item.location,
        found_item.location,
    )
    location_points = round(location_match * 20)
    score += location_points

    if location_points == 20:
        reasons.append("Same location")
    elif location_points > 0:
        reasons.append("Similar location")

    # Posting date: maximum 5 points.
    posting_date_points = date_score(
        lost_item.created_at,
        found_item.created_at,
    )
    score += posting_date_points

    if posting_date_points > 0:
        reasons.append("Posted around the same time")

    return {
        "score": min(score, 100),
        "reasons": reasons,
    }