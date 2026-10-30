/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, AlertTriangle, Sparkles, Sliders } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface ThreeAvatarProps {
  activeSignToken?: string;
  signTokens?: string[];
  autoPlay?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

const SUPPORTED_SIGNS: Record<string, string> = {
  HELLO: 'Indian Sign Language Greeting: Open palm gentle forward sweep',
  NAMASTE: 'Two-hand palms pressed reverently at chest level',
  'THANK YOU': 'Fingers touch chin, sweep forward with open palm',
  YES: 'Fist nods up and down at wrist',
  NO: 'Index and middle fingers snap down against thumb',
  HELP: 'Right fist with thumb up lifted by flat left base palm',
  GOOD: 'Fingers touch chin, drop into open left palm',
  LEARN: 'Sweeping knowledge from open book palm to forehead',
  SIGN: 'Alternating circling hands with index fingers extended',
  A: 'Fingers curled into fist with thumb resting beside index finger',
  B: 'Four fingers upright together, thumb folded across lower palm',
  C: 'Fingers curved into a crescent "C" shape',
};

export const ThreeAvatar: React.FC<ThreeAvatarProps> = ({
  activeSignToken = 'HELLO',
  signTokens = ['HELLO'],
  autoPlay = true,
  className = '',
  onAnimationComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences } = useAccessibility();

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(preferences.avatarSpeed || 1.0);
  const [currentSign, setCurrentSign] = useState<string>(activeSignToken);
  const [isAnimationMissing, setIsAnimationMissing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Body parts references
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const rightForearmRef = useRef<THREE.Group | null>(null);
  const rightHandRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const leftForearmRef = useRef<THREE.Group | null>(null);
  const leftHandRef = useRef<THREE.Group | null>(null);
  const chestLightRef = useRef<THREE.Mesh | null>(null);

  // Animation timeline state
  const animTimeRef = useRef<number>(0);
  const currentTokenIndexRef = useRef<number>(0);

  // Update current sign when prop changes
  useEffect(() => {
    if (activeSignToken) {
      const upper = activeSignToken.toUpperCase().trim();
      setCurrentSign(upper);
      setIsAnimationMissing(!SUPPORTED_SIGNS[upper]);
      animTimeRef.current = 0;
      setIsPlaying(true);
    }
  }, [activeSignToken]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xfff0c9); // Light cream Stitch background

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.45, 3.4);
    camera.lookAt(0, 1.25, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(2, 4, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf28c00, 0.6); // Warm orange rim light
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 5. Build Articulated Avatar Mesh
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // Ground platform
    const platformGeo = new THREE.CylinderGeometry(0.9, 0.95, 0.08, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xffd966,
      roughness: 0.4,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.04;
    platform.receiveShadow = true;
    avatarGroup.add(platform);

    // Materials
    const bodyYellowMat = new THREE.MeshStandardMaterial({ color: 0xffd966, roughness: 0.35, metalness: 0.15 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf28c00, roughness: 0.3 });
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const eyeLightMat = new THREE.MeshBasicMaterial({ color: 0xffd966 });

    // Torso Base
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    const torso = new THREE.Mesh(torsoGeo, whiteMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    avatarGroup.add(torso);

    // Chest badge / screen
    const chestGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 24);
    chestGeo.rotateX(Math.PI / 2);
    const chest = new THREE.Mesh(chestGeo, orangeMat);
    chest.position.set(0, 1.15, 0.18);
    avatarGroup.add(chest);
    chestLightRef.current = chest;

    // Pelvis & Legs
    const waistGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.2, 16);
    const waist = new THREE.Mesh(waistGeo, charcoalMat);
    waist.position.y = 0.65;
    avatarGroup.add(waist);

    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16);
    const leftLeg = new THREE.Mesh(legGeo, bodyYellowMat);
    leftLeg.position.set(-0.16, 0.35, 0);
    avatarGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, bodyYellowMat);
    rightLeg.position.set(0.16, 0.35, 0);
    avatarGroup.add(rightLeg);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);
    headRef.current = headGroup;
    avatarGroup.add(headGroup);

    // Head base (rounded box)
    const headGeo = new THREE.BoxGeometry(0.48, 0.42, 0.4);
    const headMesh = new THREE.Mesh(headGeo, bodyYellowMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Visor screen
    const visorGeo = new THREE.BoxGeometry(0.42, 0.24, 0.04);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, 0.2);
    headGroup.add(visor);

    // Friendly digital eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const leftEye = new THREE.Mesh(eyeGeo, eyeLightMat);
    leftEye.position.set(-0.1, 0.03, 0.22);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeLightMat);
    rightEye.position.set(0.1, 0.03, 0.22);
    headGroup.add(rightEye);

    // Antenna
    const antStemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8);
    const antStem = new THREE.Mesh(antStemGeo, charcoalMat);
    antStem.position.set(0, 0.28, 0);
    headGroup.add(antStem);

    const antSphereGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const antSphere = new THREE.Mesh(antSphereGeo, orangeMat);
    antSphere.position.set(0, 0.35, 0);
    headGroup.add(antSphere);

    // ---- Arms and Articulated Joints ----
    // RIGHT ARM (Viewer Left)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 1.32, 0);
    rightArmRef.current = rightArm;
    avatarGroup.add(rightArm);

    const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.32, 12);
    upperArmGeo.translate(0, -0.16, 0);
    const rightUpper = new THREE.Mesh(upperArmGeo, charcoalMat);
    rightArm.add(rightUpper);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.32, 0);
    rightForearmRef.current = rightForearm;
    rightArm.add(rightForearm);

    const forearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 12);
    forearmGeo.translate(0, -0.14, 0);
    const rightLower = new THREE.Mesh(forearmGeo, bodyYellowMat);
    rightForearm.add(rightLower);

    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.28, 0);
    rightHandRef.current = rightHand;
    rightForearm.add(rightHand);

    // Articulated palm & fingers
    const palmGeo = new THREE.BoxGeometry(0.09, 0.08, 0.03);
    const rightPalm = new THREE.Mesh(palmGeo, orangeMat);
    rightHand.add(rightPalm);

    // LEFT ARM (Viewer Right)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 1.32, 0);
    leftArmRef.current = leftArm;
    avatarGroup.add(leftArm);

    const leftUpper = new THREE.Mesh(upperArmGeo, charcoalMat);
    leftArm.add(leftUpper);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.32, 0);
    leftForearmRef.current = leftForearm;
    leftArm.add(leftForearm);

    const leftLower = new THREE.Mesh(forearmGeo, bodyYellowMat);
    leftForearm.add(leftLower);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.28, 0);
    leftHandRef.current = leftHand;
    leftForearm.add(leftHand);

    const leftPalm = new THREE.Mesh(palmGeo, orangeMat);
    leftHand.add(leftPalm);

    setIsCanvasReady(true);

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Kinematic Sign Pose Solver
  const updateSignPose = useCallback(
    (sign: string, phase: number, delta: number) => {
      const head = headRef.current;
      const rightArm = rightArmRef.current;
      const rightForearm = rightForearmRef.current;
      const rightHand = rightHandRef.current;
      const leftArm = leftArmRef.current;
      const leftForearm = leftForearmRef.current;
      const leftHand = leftHandRef.current;
      const avatar = avatarGroupRef.current;

      if (!head || !rightArm || !rightForearm || !rightHand || !leftArm || !leftForearm || !leftHand || !avatar) {
        return;
      }

      // Idle natural breathing cycle
      const idleSway = Math.sin(phase * 2) * 0.03;
      avatar.position.y = idleSway * 0.3;
      head.rotation.x = Math.sin(phase * 1.5) * 0.04;
      head.rotation.y = Math.sin(phase * 0.8) * 0.05;

      // Default resting arm positions
      let targetRArmX = 0.2;
      let targetRArmZ = 0.1;
      let targetRForearmX = -0.3;
      let targetRForearmY = 0;
      let targetRHandX = 0;

      let targetLArmX = 0.2;
      let targetLArmZ = -0.1;
      let targetLForearmX = -0.3;
      let targetLForearmY = 0;
      let targetLHandX = 0;

      const upper = sign.toUpperCase().trim();

      if (upper === 'HELLO' || upper === 'NAMASTE') {
        // Raise right arm to head level, palm waving gently forward
        const wave = Math.sin(phase * 6) * 0.25;
        targetRArmX = -1.2;
        targetRArmZ = -0.4;
        targetRForearmX = -1.1;
        targetRForearmY = -0.3;
        targetRHandX = wave;
        head.rotation.x = 0.15; // respectful nod
      } else if (upper === 'THANK YOU') {
        // Hand touches chin, then sweeps outward towards viewer
        const cycle = (Math.sin(phase * 3) + 1) / 2; // 0 to 1
        targetRArmX = THREE.MathUtils.lerp(-1.4, -0.6, cycle);
        targetRArmZ = THREE.MathUtils.lerp(-0.2, 0.3, cycle);
        targetRForearmX = THREE.MathUtils.lerp(-1.5, -0.5, cycle);
        targetRHandX = THREE.MathUtils.lerp(-0.3, 0.4, cycle);
        head.rotation.x = 0.1;
      } else if (upper === 'YES') {
        // Right fist elevated, nodding up and down
        const nod = Math.sin(phase * 7) * 0.4;
        targetRArmX = -0.9;
        targetRArmZ = -0.2;
        targetRForearmX = -1.2;
        targetRHandX = nod;
        head.rotation.x = nod * 0.3;
      } else if (upper === 'HELP') {
        // Left palm flat platform, right fist on top lifted up
        const lift = (Math.sin(phase * 4) + 1) / 2;
        targetLArmX = -0.8;
        targetLArmZ = 0.4;
        targetLForearmX = -1.2;
        targetLArmX = THREE.MathUtils.lerp(-0.8, -1.0, lift);

        targetRArmX = -0.9;
        targetRArmZ = -0.3;
        targetRForearmX = -1.2;
        targetRArmX = THREE.MathUtils.lerp(-0.9, -1.1, lift);
      } else if (upper === 'GOOD') {
        // Touch chin then drop into open left palm
        const step = (Math.sin(phase * 3.5) + 1) / 2;
        targetLArmX = -0.7;
        targetLArmZ = 0.3;
        targetLForearmX = -1.1;

        targetRArmX = THREE.MathUtils.lerp(-1.3, -0.8, step);
        targetRForearmX = THREE.MathUtils.lerp(-1.4, -1.0, step);
      } else if (upper === 'A' || upper === 'B' || upper === 'C') {
        // Clear finger-spelling posture at chest/eye level
        targetRArmX = -1.0;
        targetRArmZ = -0.3;
        targetRForearmX = -1.2;
        targetRHandX = Math.sin(phase * 2) * 0.1;
      }

      // Smooth kinematic lerp for fluid motion
      const lerpSpeed = Math.min(delta * 8 * playbackSpeed, 0.35);

      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, targetRArmX, lerpSpeed);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, targetRArmZ, lerpSpeed);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, targetRForearmX, lerpSpeed);
      rightForearm.rotation.y = THREE.MathUtils.lerp(rightForearm.rotation.y, targetRForearmY, lerpSpeed);
      rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, targetRHandX, lerpSpeed);

      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, targetLArmX, lerpSpeed);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, targetLArmZ, lerpSpeed);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, targetLForearmX, lerpSpeed);
      leftForearm.rotation.y = THREE.MathUtils.lerp(leftForearm.rotation.y, targetLForearmY, lerpSpeed);
      leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, targetLHandX, lerpSpeed);
    },
    [playbackSpeed]
  );

  // Render loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        animTimeRef.current += delta * playbackSpeed;
        const cycleDuration = 3.5;
        const normalized = (animTimeRef.current % cycleDuration) / cycleDuration;
        setProgress(Math.round(normalized * 100));

        // Advance multi-token phrase sequence if provided
        if (signTokens && signTokens.length > 1) {
          const tokenIndex = Math.floor(animTimeRef.current / cycleDuration) % signTokens.length;
          if (tokenIndex !== currentTokenIndexRef.current) {
            currentTokenIndexRef.current = tokenIndex;
            const nextToken = signTokens[tokenIndex];
            setCurrentSign(nextToken.toUpperCase().trim());
            setIsAnimationMissing(!SUPPORTED_SIGNS[nextToken.toUpperCase().trim()]);
          }
        }
      }

      updateSignPose(currentSign, animTimeRef.current, delta);

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentSign, signTokens, updateSignPose]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    animTimeRef.current = 0;
    setIsPlaying(true);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  return (
    <div
      className={`relative flex flex-col bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] overflow-hidden shadow-stitch ${className}`}
    >
      {/* Top Bar with Language Tag & Status */}
      <div className="px-4 py-2.5 bg-[#FFF0C9] border-b-2 border-[#222222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-[#222222]" />
          <span className="text-xs font-bold text-[#222222] uppercase tracking-wide">
            3D Sign Avatar: BridgeBot
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-[#FFD966] text-[#222222] text-[11px] font-bold rounded-full border border-[#222222]">
            ISL (Indian Sign)
          </span>
          <span className="px-2 py-0.5 bg-[#D9EAFB] text-[#222222] text-[11px] font-semibold rounded-full border border-[#222222]">
            Real-Time 3D
          </span>
        </div>
      </div>

      {/* 3D Canvas Display Area */}
      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-[#FFF0C9]/40 to-[#FFE0BD]/20 flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Missing Animation Notice (Requirement 9) */}
        {isAnimationMissing && (
          <div className="absolute inset-x-4 top-4 p-3 bg-white/95 backdrop-blur-xs border-2 border-[#222222] rounded-xl shadow-md text-xs text-[#222222] flex items-start gap-2.5 z-10 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-[#F28C00] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sign Asset Pending Verification</p>
              <p className="text-[#666666] text-[11px]">
                Showing text translation for &ldquo;{currentSign}&rdquo;. Our certified ISL linguist pipeline is preparing this 3D motion track.
              </p>
            </div>
          </div>
        )}

        {/* Current Active Sign Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#FFFFFF]/90 backdrop-blur-xs border-2 border-[#222222] px-3 py-1.5 rounded-xl shadow-sm pointer-events-none">
          <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">Active Token</div>
          <div className="text-sm font-extrabold text-[#F28C00] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {currentSign}
          </div>
        </div>

        {/* Mini Progress Bar */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-[#F1F1F1]">
          <div
            className="h-full bg-[#F28C00] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Animation Playback Controls (Requirement 9) */}
      <div className="p-3 bg-[#FFFFFF] border-t-2 border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Play / Pause & Replay */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause 3D avatar' : 'Play 3D avatar'}
            className="w-8 h-8 rounded-full bg-[#F28C00] text-white border-2 border-[#222222] flex items-center justify-center hover:bg-[#de7f00] transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
          </button>
          <button
            onClick={handleReplay}
            aria-label="Replay sign gesture"
            className="w-8 h-8 rounded-full bg-[#FFFFFF] text-[#222222] border-2 border-[#222222] flex items-center justify-center hover:bg-[#FFE0BD] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Sign Presets Selector */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[190px] sm:max-w-none">
          {['HELLO', 'THANK YOU', 'YES', 'HELP', 'GOOD'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setCurrentSign(s);
                setIsAnimationMissing(!SUPPORTED_SIGNS[s]);
                animTimeRef.current = 0;
                setIsPlaying(true);
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                currentSign === s
                  ? 'bg-[#FFD966] text-[#222222] border-[#222222]'
                  : 'bg-[#F1F1F1] text-[#666666] border-transparent hover:border-[#222222]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Speed Controls (0.5x, 1x, 1.5x) */}
        <div className="flex items-center gap-1 bg-[#F1F1F1] p-0.5 rounded-lg border border-[#222222]/20">
          {[0.5, 1.0, 1.5].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                playbackSpeed === speed
                  ? 'bg-[#FFFFFF] text-[#222222] shadow-xs border border-[#222222]'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
