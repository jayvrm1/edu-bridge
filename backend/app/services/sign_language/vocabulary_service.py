"""
Vocabulary and lexicon service for Indian Sign Language (ISL).
Exposes supported characters, numbers, gestures, and performance guidelines.
"""

from typing import List, Dict
from app.schemas.sign_language import (
    SignVocabularyItem,
    SignVocabularyResponse
)


SINGLE_HAND_LETTERS = {
    "C": "Form a curved C shape using fingers and thumb of one hand.",
    "I": "Extend pinky finger upright while folding thumb and other fingers.",
    "L": "Extend thumb and index finger at a 90-degree angle forming an 'L'.",
    "O": "Touch fingertips and thumb together into a circular 'O' shape.",
    "U": "Extend index and middle fingers together upright, other fingers folded.",
    "V": "Extend index and middle fingers spread apart forming a 'V' sign."
}

TWO_HAND_LETTERS = {
    "A": "Touch index finger of dominant hand to thumb tip of non-dominant open hand.",
    "B": "Place both open hands together or form double loops with thumbs and fingers.",
    "D": "Form a circle with thumb and index of dominant hand against index of non-dominant hand.",
    "E": "Touch index finger of dominant hand to index finger tip of non-dominant open hand.",
    "F": "Cross index fingers of both hands horizontally.",
    "G": "Clench both fists and place one fist on top of the other.",
    "H": "Slide flat palm of dominant hand across flat palm of non-dominant hand.",
    "J": "Draw a 'J' curve in the air using index finger onto non-dominant palm.",
    "K": "Hook crooked index finger of dominant hand against extended index of non-dominant hand.",
    "M": "Place three fingers (index, middle, ring) of dominant hand onto non-dominant palm.",
    "N": "Place two fingers (index, middle) of dominant hand onto non-dominant palm.",
    "P": "Form an inverted P loop using dominant hand against upright non-dominant index finger.",
    "Q": "Hook index finger of dominant hand into circle formed by non-dominant hand.",
    "R": "Cross index and middle finger of dominant hand resting on non-dominant palm.",
    "S": "Hook pinky finger of dominant hand around pinky of non-dominant hand.",
    "T": "Touch dominant index finger tip to the base/edge of non-dominant palm.",
    "W": "Interlock or spread fingers of both open hands facing each other.",
    "X": "Cross index fingers of both hands diagonally into an 'X'.",
    "Y": "Extend thumb and pinky of dominant hand (shaka) against non-dominant palm.",
    "Z": "Hold open non-dominant hand facing sideways and touch fingertips of dominant hand to it."
}

DIGITS = {
    "0": "Form an oval/circle with fingers and thumb touching (zero shape).",
    "1": "Extend index finger upright, other fingers closed in a fist.",
    "2": "Extend index and middle fingers upright, thumb holding ring and pinky.",
    "3": "Extend thumb, index, and middle fingers upright.",
    "4": "Extend all four fingers upright with thumb folded across palm.",
    "5": "Open hand with all five fingers extended and spread.",
    "6": "Extend thumb and pinky upright with middle three fingers folded.",
    "7": "Extend index, middle, and ring fingers upright with thumb across pinky.",
    "8": "Touch middle finger to thumb, other fingers extended upright.",
    "9": "Touch index finger to thumb (pinch) with remaining three fingers upright."
}

GESTURES = {
    "SPACE": "Brief pause with open flat palm facing forward.",
    "BACKSPACE": "Quick horizontal wave of single hand to the left.",
    "CLEAR": "Both palms open moving downward to clear current line."
}


class SignVocabularyService:
    """Provides vocabulary metadata and lexicon specifications for ISL."""

    @classmethod
    def get_vocabulary(cls) -> SignVocabularyResponse:
        items: List[SignVocabularyItem] = []

        for symbol, desc in SINGLE_HAND_LETTERS.items():
            items.append(SignVocabularyItem(
                symbol=symbol,
                category="alphabet",
                hand_count=1,
                description=desc
            ))

        for symbol, desc in TWO_HAND_LETTERS.items():
            items.append(SignVocabularyItem(
                symbol=symbol,
                category="alphabet",
                hand_count=2,
                description=desc
            ))

        for symbol, desc in DIGITS.items():
            items.append(SignVocabularyItem(
                symbol=symbol,
                category="digit",
                hand_count=1,
                description=desc
            ))

        for symbol, desc in GESTURES.items():
            items.append(SignVocabularyItem(
                symbol=symbol,
                category="control_gesture",
                hand_count=1 if symbol != "CLEAR" else 2,
                description=desc
            ))

        categories = {
            "single_hand_alphabets": sorted(list(SINGLE_HAND_LETTERS.keys())),
            "two_hand_alphabets": sorted(list(TWO_HAND_LETTERS.keys())),
            "all_alphabets": sorted(list(SINGLE_HAND_LETTERS.keys()) + list(TWO_HAND_LETTERS.keys())),
            "digits": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
            "control_gestures": list(GESTURES.keys())
        }

        return SignVocabularyResponse(
            total_items=len(items),
            categories=categories,
            items=items
        )

