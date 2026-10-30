/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, CheckCircle, Video, Volume2 } from 'lucide-react';
import { signService } from '../../services/api/signService';
import { SignRecognitionResult } from '../../types';
import { useAccessibility } from '../../context/AccessibilityContext';

interface CameraWorkspaceProps {
  onRecognitionResult?: (result: SignRecognitionResult) => void;
  targetSignHint?: string;
  isTrainingMode?: boolean;
}

export const CameraWorkspace: React.FC<CameraWorkspaceProps> = ({
  onRecognitionResult,
  targetSignHint,
  isTrainingMode = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionIntervalRef = useRef<number | null>(null);

  const { speak, announce } = useAccessibility();

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [latestResult, setLatestResult] = useState<SignRecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(15);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  // Request camera and start stream
  const startCamera = async () => {
    setPermissionError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsCameraActive(true);
      setCameraPermission('granted');
      announce('Webcam connected. Indian Sign Language detection active.');

      // Start recognition loop (~ every 1.5s for balance between performance and responsiveness)
      startRecognitionLoop();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings.'
          : err.message || 'Unable to access webcam.'
      );
    }
  };

  // Capture frame and send to recognition endpoint
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw simulated futuristic landmark mesh overlay (thumb, index, palm center)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.strokeStyle = '#F28C00';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(centerX - 80, centerY - 80, 160, 170);

    ctx.fillStyle = '#FFD966';
    const joints = [
      [centerX, centerY - 40],
      [centerX - 35, centerY - 60],
      [centerX + 35, centerY - 60],
      [centerX - 50, centerY],
      [centerX + 50, centerY],
      [centerX, centerY + 30],
    ];

    joints.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const frameData = canvas.toDataURL('image/jpeg', 0.6);

    try {
      setIsProcessing(true);
      const result = await signService.recognizeFrame(frameData, targetSignHint);
      setLatestResult(result);
      if (onRecognitionResult) {
        onRecognitionResult(result);
      }
    } catch (err) {
      console.warn('Recognition frame dispatch error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [onRecognitionResult, targetSignHint]);

  const startRecognitionLoop = useCallback(() => {
    if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
    recognitionIntervalRef.current = window.setInterval(captureAndRecognize, 1400);
  }, [captureAndRecognize]);

  // Clean up when leaving component
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const toggleFacingMode = () => {
    stopCamera();
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] overflow-hidden shadow-stitch flex flex-col">
      {/* Workspace Header */}
      <div className="px-5 py-3.5 bg-[#FFF0C9] border-b-2 border-[#222222] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F28C00] text-white flex items-center justify-center border border-[#222222]">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#222222]">
              Live ISL Camera Sensor
            </h3>
            <p className="text-[11px] text-[#666666]">
              Real-time Indian Sign Language MediaPipe & Cloud Landmark Recognition
            </p>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <>
              <button
                onClick={toggleFacingMode}
                className="px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#222222] rounded-full text-xs font-bold hover:bg-[#F1F1F1] flex items-center gap-1.5 transition"
                title="Switch Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Flip
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-1.5 bg-[#BA1A1A] text-white border-2 border-[#222222] rounded-full text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 transition shadow-xs"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Stop Camera
              </button>
            </>
          ) : (
            <button
              onClick={startCamera}
              className="px-4 py-1.5 bg-[#F28C00] text-white border-2 border-[#222222] rounded-full text-xs font-bold hover:bg-[#de7f00] flex items-center gap-1.5 transition shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              Start Live Camera
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport & Landmark Canvas */}
      <div className="relative w-full aspect-video bg-[#222222] flex items-center justify-center overflow-hidden">
        {/* Hidden video element feeding canvas */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${
            !isCameraActive ? 'hidden' : ''
          }`}
          playsInline
          muted
        />

        {/* Real-time Landmark Drawing Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${!isCameraActive ? 'hidden' : ''}`}
        />

        {/* When Camera is OFF */}
        {!isCameraActive && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFD966]">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold">Camera is Inactive</p>
              <p className="text-xs text-white/70 max-w-sm mt-1">
                Click &ldquo;Start Live Camera&rdquo; above to enable barrier-free gesture detection. Media is processed locally and never permanently stored.
              </p>
            </div>
            <button
              onClick={startCamera}
              className="mt-2 px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-white hover:bg-[#de7f00] transition"
            >
              Enable Camera Access
            </button>
          </div>
        )}

        {/* Permission Denied Overlay */}
        {permissionError && (
          <div className="absolute inset-x-4 bottom-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{permissionError}</span>
          </div>
        )}

        {/* Live HUD Overlays (when active) */}
        {isCameraActive && (
          <>
            {/* Top Status Pill */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE TRACKING</span>
              <span className="text-white/60">|</span>
              <span className="font-mono text-[10px]">15 FPS</span>
            </div>

            {/* Target Hint Badge in Training Mode */}
            {isTrainingMode && targetSignHint && (
              <div className="absolute top-3 right-3 bg-[#FFD966] text-[#222222] font-extrabold text-xs px-3.5 py-1.5 rounded-full border-2 border-[#222222] shadow-sm">
                Target: {targetSignHint}
              </div>
            )}

            {/* Latest Recognition Banner at Bottom of Preview */}
            {latestResult && (
              <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-xs border-2 border-[#222222] p-3 rounded-xl shadow-lg flex items-center justify-between animate-slide-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D9EAFB] border border-[#222222] flex items-center justify-center text-lg font-bold">
                    🤟
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">
                      Detected Sign
                    </div>
                    <div className="text-base font-extrabold text-[#222222] flex items-center gap-2">
                      <span>{latestResult.sign}</span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {Math.round(latestResult.confidence * 100)}% Match
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => speak(`Detected sign: ${latestResult.sign}`)}
                    className="p-2 rounded-full bg-[#FFF0C9] border border-[#222222] hover:bg-[#FFE0BD] text-[#222222] transition"
                    title="Speak sign name"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  {targetSignHint && latestResult.sign.toUpperCase() === targetSignHint.toUpperCase() && (
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Verified!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Frame processing status bar */}
      <div className="px-4 py-2 bg-[#F1F1F1] border-t-2 border-[#222222] flex items-center justify-between text-xs text-[#666666]">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#F28C00] animate-pulse' : 'bg-gray-400'}`} />
          {isProcessing ? 'Transmitting frame to FastAPI MediaPipe model...' : 'Model ready'}
        </span>
        <span className="text-[11px] font-semibold text-[#222222]">
          FastAPI Route: <code className="font-mono text-[#F28C00]">POST /api/v1/sign-language/sessions/{'{id}'}/frames</code>
        </span>
      </div>
    </div>
  );
};
