"""
SiGML XML Parser and Three.js Bone Keyframe Generator for Avatar Rigging.
Parses HamNoSys manual and non-manual gestures from authentic SiGML files.
"""

import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Any, List, Optional
import structlog

from app.schemas.avatar import SignAnimationPayload, ThreeJsBoneTrack

logger = structlog.get_logger(__name__)


class SiGMLParser:
    """Parses SiGML XML into structured sign metadata and Three.js keyframes."""

    @staticmethod
    def parse_sigml_text(sigml_content: str, filename: str = "unknown.sigml") -> SignAnimationPayload:
        try:
            root = ET.fromstring(sigml_content)
        except Exception as e:
            logger.error("sigml_parse_xml_error", error=str(e), filename=filename)
            return SignAnimationPayload(
                gloss=Path(filename).stem.upper(),
                sigml_filename=filename,
                raw_sigml=sigml_content,
                hamnosys_symbols=[],
                mouth_picture=None,
                duration_ms=1000,
                threejs_bones=[]
            )

        sign_elem = root.find(".//hns_sign")
        gloss = sign_elem.attrib.get("gloss", Path(filename).stem) if sign_elem is not None else Path(filename).stem

        # Extract non-manual mouth picture
        mouth_elem = root.find(".//hnm_mouthpicture")
        mouth_pic = mouth_elem.attrib.get("picture") if mouth_elem is not None else None

        # Extract manual tags
        manual_elem = root.find(".//hamnosys_manual")
        ham_symbols = []
        if manual_elem is not None:
            for child in manual_elem.iter():
                if child.tag != "hamnosys_manual":
                    ham_symbols.append(child.tag)

        # Estimate duration based on number of movement and hold tags
        movement_count = sum(1 for tag in ham_symbols if "move" in tag or "cross" in tag or "circle" in tag)
        duration_ms = max(1000, 800 + movement_count * 350)
        duration_sec = duration_ms / 1000.0

        # Build Three.js standard humanoid bone keyframes
        bones = SiGMLParser._generate_threejs_bone_tracks(ham_symbols, duration_sec)

        return SignAnimationPayload(
            gloss=gloss.upper(),
            sigml_filename=filename,
            raw_sigml=sigml_content,
            hamnosys_symbols=ham_symbols,
            mouth_picture=mouth_pic,
            duration_ms=duration_ms,
            threejs_bones=bones
        )

    @classmethod
    def parse_file(cls, file_path: Path) -> Optional[SignAnimationPayload]:
        if not file_path.exists():
            return None
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return cls.parse_sigml_text(content, filename=file_path.name)
        except Exception as exc:
            logger.error("sigml_file_read_error", path=str(file_path), error=str(exc))
            return None

    @staticmethod
    def _generate_threejs_bone_tracks(ham_symbols: List[str], duration: float) -> List[ThreeJsBoneTrack]:
        """
        Synthesizes standard Three.js quaternion bone rotation keyframes
        matching humanoid rigs (Mixamo / ReadyPlayerMe conventions).
        """
        times = [0.0, round(duration * 0.3, 2), round(duration * 0.7, 2), round(duration, 2)]

        # Determine if sign is two-handed
        is_two_handed = any("parbegin" in s or "both" in s for s in ham_symbols)

        tracks = []

        # Right ForeArm / Hand (Dominant hand in ISL)
        # Default rest -> sign pose -> peak -> return to rest
        tracks.append(ThreeJsBoneTrack(
            bone_name="RightArm",
            times=times,
            values=[
                0.0, 0.0, 0.0, 1.0,         # t=0.0 rest
                0.2, 0.1, -0.4, 0.88,       # t=0.3 lift
                0.35, 0.15, -0.45, 0.81,    # t=0.7 peak gesture
                0.0, 0.0, 0.0, 1.0          # t=1.0 rest
            ]
        ))
        tracks.append(ThreeJsBoneTrack(
            bone_name="RightForeArm",
            times=times,
            values=[
                0.0, 0.0, 0.0, 1.0,
                0.5, 0.0, 0.0, 0.86,
                0.65, 0.05, 0.0, 0.75,
                0.0, 0.0, 0.0, 1.0
            ]
        ))
        tracks.append(ThreeJsBoneTrack(
            bone_name="RightHand",
            times=times,
            values=[
                0.0, 0.0, 0.0, 1.0,
                0.1, 0.2, 0.0, 0.97,
                0.15, 0.25, 0.0, 0.95,
                0.0, 0.0, 0.0, 1.0
            ]
        ))

        # Left hand if two-handed sign
        if is_two_handed:
            tracks.append(ThreeJsBoneTrack(
                bone_name="LeftArm",
                times=times,
                values=[
                    0.0, 0.0, 0.0, 1.0,
                    0.2, -0.1, 0.4, 0.88,
                    0.35, -0.15, 0.45, 0.81,
                    0.0, 0.0, 0.0, 1.0
                ]
            ))
            tracks.append(ThreeJsBoneTrack(
                bone_name="LeftForeArm",
                times=times,
                values=[
                    0.0, 0.0, 0.0, 1.0,
                    0.5, 0.0, 0.0, 0.86,
                    0.65, -0.05, 0.0, 0.75,
                    0.0, 0.0, 0.0, 1.0
                ]
            ))

        return tracks

