"""
3D Avatar Animation and Sign Language Translation Service.
Indexes authentic SiGML assets, performs text-to-sign tokenization, and compiles Three.js sequences.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import structlog

from app.core.config import settings
from app.schemas.avatar import (
    AvatarLanguageInfo,
    AvatarVocabularyItem,
    AvatarVocabularyResponse,
    TranslateTextResponse,
    SignSequenceToken,
    AnimationSequenceResponse,
    SignAnimationPayload
)
from app.services.avatar.sigml_parser import SiGMLParser

logger = structlog.get_logger(__name__)


class AvatarService:
    """Central service managing 3D human avatar animations and sign compilation."""

    _instance: Optional["AvatarService"] = None

    def __init__(self, sigml_dir: Optional[Path] = None):
        self.sigml_dir = sigml_dir or settings.resolved_sigml_dir
        self.gloss_to_file: Dict[str, str] = {}
        self.file_to_gloss: Dict[str, str] = {}
        self._index_sigml_files()

    @classmethod
    def get_instance(cls) -> "AvatarService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _index_sigml_files(self) -> None:
        """Indexes all available .sigml files in the registry."""
        if not self.sigml_dir.exists():
            logger.warning("sigml_directory_missing", path=str(self.sigml_dir))
            return

        count = 0
        for f in self.sigml_dir.glob("*.sigml"):
            stem = f.stem.strip()
            gloss = stem.upper()
            self.gloss_to_file[gloss] = f.name
            self.file_to_gloss[f.name] = gloss
            count += 1

        logger.info("indexed_sigml_animations", total=count, directory=str(self.sigml_dir))

    def get_supported_languages(self) -> List[AvatarLanguageInfo]:
        return [
            AvatarLanguageInfo(
                code="ISL",
                name="Indian Sign Language",
                is_primary=True,
                total_animations=len(self.gloss_to_file),
                status="operational"
            ),
            AvatarLanguageInfo(
                code="ASL",
                name="American Sign Language",
                is_primary=False,
                total_animations=0,
                status="planned_future_release"
            ),
            AvatarLanguageInfo(
                code="BSL",
                name="British Sign Language",
                is_primary=False,
                total_animations=0,
                status="planned_future_release"
            )
        ]

    def get_vocabulary(self, limit: int = 1000) -> AvatarVocabularyResponse:
        signs: List[AvatarVocabularyItem] = []
        for gloss, fname in sorted(self.gloss_to_file.items())[:limit]:
            category = "digit" if gloss.isdigit() else ("alphabet" if len(gloss) == 1 else "general")
            signs.append(AvatarVocabularyItem(
                gloss=gloss,
                filename=fname,
                category=category,
                has_sigml=True,
                has_hamnosys=True
            ))

        return AvatarVocabularyResponse(
            total_signs=len(self.gloss_to_file),
            language="ISL",
            signs=signs
        )

    def get_animation_by_sign_id(self, sign_id: str) -> Optional[SignAnimationPayload]:
        lookup = sign_id.strip().upper()
        if not lookup.endswith(".SIGML") and lookup in self.gloss_to_file:
            fname = self.gloss_to_file[lookup]
        elif lookup.endswith(".SIGML") and lookup.lower() in [f.lower() for f in self.file_to_gloss.keys()]:
            fname = lookup
        else:
            fname = f"{lookup}.sigml"

        file_path = self.sigml_dir / fname
        if not file_path.exists():
            return None

        return SiGMLParser.parse_file(file_path)

    def translate_text(
        self,
        text: str,
        target_language: str = "ISL",
        fingerspell_unknown: bool = True
    ) -> TranslateTextResponse:
        """
        Translates text string into an ordered sequence of sign tokens.
        If a word is not in the SiGML lexicon and fingerspell_unknown=True,
        it breaks the word into recognized single-character alphabets.
        """
        clean_text = re.sub(r"[^\w\s]", "", text).strip()
        words = clean_text.split()

        sequence: List[SignSequenceToken] = []
        found_count = 0
        total_duration = 0

        for word in words:
            upper_word = word.upper()
            # 1. Direct word match in SiGML registry
            if upper_word in self.gloss_to_file:
                fname = self.gloss_to_file[upper_word]
                duration = 1300
                sequence.append(SignSequenceToken(
                    token=upper_word,
                    is_fingerspelled=False,
                    sigml_file=fname,
                    found=True,
                    duration_ms=duration
                ))
                found_count += 1
                total_duration += duration

            # 2. Fingerspell letter-by-letter
            elif fingerspell_unknown:
                for char in upper_word:
                    char_file = self.gloss_to_file.get(char)
                    has_char = char_file is not None
                    duration = 900
                    sequence.append(SignSequenceToken(
                        token=char,
                        is_fingerspelled=True,
                        sigml_file=char_file,
                        found=has_char,
                        duration_ms=duration
                    ))
                    if has_char:
                        found_count += 1
                    total_duration += duration

            # 3. Missing word without fingerspelling
            else:
                sequence.append(SignSequenceToken(
                    token=upper_word,
                    is_fingerspelled=False,
                    sigml_file=None,
                    found=False,
                    duration_ms=500
                ))
                total_duration += 500

        total_tokens = len(sequence)
        coverage = round((found_count / total_tokens * 100.0), 1) if total_tokens > 0 else 0.0

        return TranslateTextResponse(
            original_text=text,
            language=target_language,
            sequence=sequence,
            total_duration_ms=total_duration,
            coverage_percentage=coverage
        )

    def compile_sequence(self, glosses: List[str], fps: int = 30) -> AnimationSequenceResponse:
        """Compiles a list of glosses into full Three.js-ready keyframe payloads."""
        animations: List[SignAnimationPayload] = []
        total_duration = 0

        for g in glosses:
            anim = self.get_animation_by_sign_id(g)
            if anim:
                animations.append(anim)
                total_duration += anim.duration_ms
            else:
                # Stub animation payload for unknown sign
                animations.append(SignAnimationPayload(
                    gloss=g.upper(),
                    sigml_filename="",
                    raw_sigml="",
                    hamnosys_symbols=[],
                    mouth_picture=None,
                    duration_ms=800,
                    threejs_bones=[]
                ))
                total_duration += 800

        return AnimationSequenceResponse(
            total_signs=len(animations),
            total_duration_ms=total_duration,
            animations=animations
        )

