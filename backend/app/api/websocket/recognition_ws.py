"""
WebSocket endpoint for real-time bidirectional sign language recognition streaming.
Clients send video frames or extracted landmarks and receive real-time predictions.
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
import structlog

from app.services.sign_language.recognition_session import SessionManager
from app.services.sign_language.landmark_extractor import MediaPipeLandmarkExtractor

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/ws/v1/sign-language", tags=["Sign Language WebSocket"])

landmark_extractor = MediaPipeLandmarkExtractor()


@router.websocket("/stream/{session_id}")
async def websocket_sign_stream(websocket: WebSocket, session_id: str):
    """
    Bi-directional streaming WebSocket for real-time sign language recognition.
    Protocol:
        Client -> Server:
            - {"type": "frame", "frame_base64": "<base64_jpeg_or_png>"}
            - {"type": "landmarks", "hands": [[[x, y, z], ...]]}
            - {"type": "command", "action": "space" | "backspace" | "clear"}
            - {"type": "ping"}
        Server -> Client:
            - {"type": "connected", "session_id": "...", "mode": "..."}
            - {"type": "prediction", "prediction": {...}, "current_text": "...", "frame_count": ...}
            - {"type": "text_updated", "current_text": "...", "action": "..."}
            - {"type": "pong"}
            - {"type": "error", "message": "..."}
    """
    manager = SessionManager.get_instance()
    session = manager.get_session(session_id)

    # If session doesn't exist yet, automatically auto-provision it for convenient WebSocket streaming
    if not session:
        session = manager.create_session(user_id=None, mode="auto", language="ISL")
        session_id = session.session_id

    await websocket.accept()
    logger.info("sign_websocket_connected", session_id=session_id)

    try:
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "mode": session.mode,
            "language": session.language,
            "current_text": session.confirmed_text
        })

        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON format"})
                continue

            msg_type = msg.get("type", "").lower()

            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            elif msg_type == "frame":
                frame_b64 = msg.get("frame_base64")
                if not frame_b64:
                    await websocket.send_json({"type": "error", "message": "Missing 'frame_base64' in payload"})
                    continue

                try:
                    landmarks_list, _, _ = landmark_extractor.extract_from_base64(frame_b64)
                    pred = session.process_landmarks(landmarks_list)
                    await websocket.send_json({
                        "type": "prediction",
                        "prediction": pred.model_dump(),
                        "current_text": session.confirmed_text,
                        "frame_count": session.frame_count
                    })
                except Exception as e:
                    await websocket.send_json({"type": "error", "message": f"Frame extraction error: {str(e)}"})

            elif msg_type == "landmarks":
                hands_data = msg.get("hands", [])
                pred = session.process_landmarks(hands_data)
                await websocket.send_json({
                    "type": "prediction",
                    "prediction": pred.model_dump(),
                    "current_text": session.confirmed_text,
                    "frame_count": session.frame_count
                })

            elif msg_type == "command":
                action = msg.get("action", "").lower()
                if action == "space":
                    text = session.add_space()
                elif action == "backspace":
                    text = session.backspace()
                elif action == "clear":
                    text = session.clear_text()
                elif action == "append":
                    ch = msg.get("character", "")
                    text = session.append_character(ch)
                else:
                    await websocket.send_json({"type": "error", "message": f"Unknown command action '{action}'"})
                    continue

                await websocket.send_json({
                    "type": "text_updated",
                    "action": action,
                    "current_text": text
                })

            else:
                await websocket.send_json({"type": "error", "message": f"Unsupported message type: '{msg_type}'"})

    except WebSocketDisconnect:
        logger.info("sign_websocket_disconnected", session_id=session_id)
    except Exception as exc:
        logger.error("sign_websocket_error", session_id=session_id, error=str(exc))
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except Exception:
            pass

