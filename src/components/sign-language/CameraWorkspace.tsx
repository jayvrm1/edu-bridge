/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, AlertCircle, CheckCircle, Video, Volume2, Sliders, Zap } from 'lucide-react';
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
  const fpsMeasurementCallbackIdRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Recognition in-flight guard ref to guarantee at most one request is in-flight
  const inFlightRef = useRef<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(performance.now());

  const { speak, announce } = useAccessibility();

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [latestResult, setLatestResult] = useState<SignRecognitionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Camera Settings
  const [targetFps, setTargetFps] = useState<30 | 60>(30);
  const [measuredPreviewFps, setMeasuredPreviewFps] = useState<number>(0);
  const [recognitionIntervalMs, setRecognitionIntervalMs] = useState<number>(800);

  // Stop camera tracks and timers cleanly
  const stopCamera = useCallback(() => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }

    if (videoRef.current && typeof (videoRef.current as any).cancelVideoFrameCallback === 'function' && fpsMeasurementCallbackIdRef.current !== null) {
      try {
        (videoRef.current as any).cancelVideoFrameCallback(fpsMeasurementCallbackIdRef.current);
      } catch {
        // ignore
      }
      fpsMeasurementCallbackIdRef.current = null;
    }

    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    inFlightRef.current = false;
    setIsProcessing(false);
    setIsCameraActive(false);
    setMeasuredPreviewFps(0);
  }, []);

  /**
   * Request MediaStream with progressive fallback:
   * 1. Try selected target FPS (30 or 60).
   * 2. If unsupported/rejected, fall back to 30 FPS.
   * 3. If still unsupported, fall back to browser defaults.
   */
  const acquireMediaStream = async (facing: 'user' | 'environment', desiredFps: number): Promise<MediaStream> => {
    // Attempt 1: Desired target FPS
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: desiredFps },
        },
        audio: false,
      });
    } catch (err: any) {
      console.warn(`[Camera] Could not acquire stream at ${desiredFps} FPS:`, err);
    }

    // Attempt 2: Fallback to 30 FPS if user requested 60 FPS
    if (desiredFps !== 30) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });
      } catch (err: any) {
        console.warn('[Camera] Fallback to 30 FPS failed:', err);
      }
    }

    // Attempt 3: Browser defaults without frameRate constraints
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facing,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
  };

  // Start frame rate measurement loop
  const startFpsMeasurement = useCallback((videoEl: HTMLVideoElement, stream: MediaStream) => {
    // Inspect track settings first
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    if (settings?.frameRate && settings.frameRate > 0) {
      setMeasuredPreviewFps(Math.round(settings.frameRate));
    }

    // Use requestVideoFrameCallback if supported by the browser (Chrome, Edge, Brave, Opera)
    if (typeof (videoEl as any).requestVideoFrameCallback === 'function') {
      frameCountRef.current = 0;
      lastFpsTimestampRef.current = performance.now();

      const onFrame = () => {
        frameCountRef.current += 1;
        const now = performance.now();
        const elapsed = now - lastFpsTimestampRef.current;

        if (elapsed >= 1000) {
          const calculated = Math.round((frameCountRef.current * 1000) / elapsed);
          setMeasuredPreviewFps(calculated);
          frameCountRef.current = 0;
          lastFpsTimestampRef.current = now;
        }

        if (videoRef.current) {
          fpsMeasurementCallbackIdRef.current = (videoRef.current as any).requestVideoFrameCallback(onFrame);
        }
      };

      fpsMeasurementCallbackIdRef.current = (videoEl as any).requestVideoFrameCallback(onFrame);
    } else {
      // Fallback measurement using requestAnimationFrame
      frameCountRef.current = 0;
      lastFpsTimestampRef.current = performance.now();

      const measureRaf = () => {
        frameCountRef.current += 1;
        const now = performance.now();
        const elapsed = now - lastFpsTimestampRef.current;

        if (elapsed >= 1000) {
          const calculated = Math.round((frameCountRef.current * 1000) / elapsed);
          setMeasuredPreviewFps(calculated);
          frameCountRef.current = 0;
          lastFpsTimestampRef.current = now;
        }

        animFrameIdRef.current = requestAnimationFrame(measureRaf);
      };

      animFrameIdRef.current = requestAnimationFrame(measureRaf);
    }
  }, []);

  // Request camera and start stream
  const startCamera = async (customFps?: 30 | 60) => {
    setPermissionError(null);
    const chosenFps = customFps || targetFps;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser environment.');
      }

      const stream = await acquireMediaStream(facingMode, chosenFps);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('[Camera] Autoplay was prevented or interrupted:', playErr);
        }
        startFpsMeasurement(videoRef.current, stream);
      }

      setIsCameraActive(true);
      setCameraPermission('granted');
      announce(`Webcam connected. Preview running with ${chosenFps} FPS target.`);

      // Start recognition loop with single-in-flight guarantee
      startRecognitionLoop();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to access webcam.'
      );
    }
  };

  // Switch between 30 and 60 FPS
  const handleFpsChange = async (newFps: 30 | 60) => {
    setTargetFps(newFps);
    if (!isCameraActive || !streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
      try {
        await videoTrack.applyConstraints({ frameRate: { ideal: newFps } });
        const settings = videoTrack.getSettings();
        if (settings.frameRate) {
          setMeasuredPreviewFps(Math.round(settings.frameRate));
        }
        return;
      } catch (err) {
        console.warn(`[Camera] Could not apply ${newFps} FPS via applyConstraints, re-initializing stream:`, err);
      }
    }

    // If applyConstraints is unsupported or rejected, cleanly restart stream
    stopCamera();
    await startCamera(newFps);
  };

  // Capture frame and send to recognition endpoint (At most ONE in-flight request)
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    // SINGLE-FLIGHT LOCK: Prevent requests from piling up and overloading the backend
    if (inFlightRef.current) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw landmark mesh overlay for user posture feedback
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

    const frameData = canvas.toDataURL('image/jpeg', 0.65);

    inFlightRef.current = true;
    setIsProcessing(true);

    try {
      // Calculate recognition sampling rate consistent with session client_fps
      const samplingFps = +(1000 / recognitionIntervalMs).toFixed(1);
      const result = await signService.recognizeFrame(frameData, targetSignHint, samplingFps);
      setLatestResult(result);
      if (onRecognitionResult) {
        onRecognitionResult(result);
      }
    } catch (err) {
      console.warn('[Camera] Recognition frame dispatch error:', err);
    } finally {
      setIsProcessing(false);
      inFlightRef.current = false;
    }
  }, [onRecognitionResult, targetSignHint, recognitionIntervalMs]);

  const startRecognitionLoop = useCallback(() => {
    if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
    recognitionIntervalRef.current = window.setInterval(captureAndRecognize, recognitionIntervalMs);
  }, [captureAndRecognize, recognitionIntervalMs]);

  // Restart recognition loop when interval setting changes
  useEffect(() => {
    if (isCameraActive) {
      startRecognitionLoop();
    }
  }, [isCameraActive, startRecognitionLoop]);

  // Clean up when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const toggleFacingMode = async () => {
    stopCamera();
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] overflow-hidden shadow-stitch flex flex-col">
      {/* Workspace Header */}
      <div className="px-5 py-3.5 bg-[#FFF0C9] border-b-2 border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#F28C00] text-white flex items-center justify-center border border-[#222222]">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#222222]">
              Live ISL Camera Sensor
            </h3>
            <p className="text-[11px] text-[#666666]">
              Real-time Indian Sign Language MediaPipe & Gesture Model Recognition
            </p>
          </div>
        </div>

        {/* Camera Controls & Settings */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Frame Rate Setting: 30 FPS vs 60 FPS */}
          <div className="flex items-center bg-[#FFFFFF] rounded-full border-2 border-[#222222] p-0.5">
            <span className="text-[10px] font-extrabold uppercase px-2 text-[#666666] flex items-center gap-1">
              <Sliders className="w-3 h-3 text-[#F28C00]" /> FPS:
            </span>
            <button
              onClick={() => handleFpsChange(30)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition ${
                targetFps === 30
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
              title="Target 30 FPS (Default, recommended for standard webcams)"
            >
              30
            </button>
            <button
              onClick={() => handleFpsChange(60)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition ${
                targetFps === 60
                  ? 'bg-[#F28C00] text-white shadow-xs'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
              title="Target 60 FPS (High-frame-rate capture for compatible cameras)"
            >
              60
            </button>
          </div>

          {/* Recognition Rate Dropdown */}
          <div className="flex items-center bg-[#FFFFFF] rounded-full border-2 border-[#222222] p-0.5">
            <span className="text-[10px] font-extrabold uppercase px-2 text-[#666666] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#F28C00]" /> Sample:
            </span>
            {[
              { label: '500ms', ms: 500, title: 'Fast (2 req/s)' },
              { label: '800ms', ms: 800, title: 'Balanced (1.25 req/s)' },
              { label: '1200ms', ms: 1200, title: 'Gentle (0.8 req/s)' },
            ].map((opt) => (
              <button
                key={opt.ms}
                onClick={() => setRecognitionIntervalMs(opt.ms)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition ${
                  recognitionIntervalMs === opt.ms
                    ? 'bg-[#FFD966] text-[#222222] shadow-xs'
                    : 'text-[#666666] hover:text-[#222222]'
                }`}
                title={opt.title}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isCameraActive ? (
            <>
              <button
                onClick={toggleFacingMode}
                className="px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#222222] rounded-full text-xs font-bold hover:bg-[#F1F1F1] flex items-center gap-1.5 transition"
                title="Switch Camera Orientation"
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
              onClick={() => startCamera()}
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
              onClick={() => startCamera()}
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
            {/* Top Status Pill: Discloses Actual Measured Camera Preview FPS */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE SENSOR</span>
              <span className="text-white/40">|</span>
              <span className="font-mono text-[10px] text-[#FFD966]" title="Actual rendered frames per second from active camera preview">
                Camera Preview: {measuredPreviewFps > 0 ? `${measuredPreviewFps} FPS` : `${targetFps} FPS (measuring)`}
              </span>
              <span className="text-white/40">|</span>
              <span className="text-[10px] text-white/80">
                Recog: {(1000 / recognitionIntervalMs).toFixed(1)}/s
              </span>
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

      {/* Frame processing status bar with single in-flight lock feedback */}
      <div className="px-4 py-2 bg-[#F1F1F1] border-t-2 border-[#222222] flex items-center justify-between text-xs text-[#666666]">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-[#F28C00] animate-pulse' : 'bg-emerald-500'}`} />
          {isProcessing ? 'Transmitting frame to FastAPI MediaPipe model (1 in flight)...' : 'Model sensor ready (single-flight queue idle)'}
        </span>
        <span className="text-[11px] font-semibold text-[#222222]">
          FastAPI Route: <code className="font-mono text-[#F28C00]">POST /api/v1/sign-language/sessions/{'{id}'}/frames</code>
        </span>
      </div>
    </div>
  );
};
