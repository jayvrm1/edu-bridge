/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { signService, SignAnimationData } from '../../services/api/signService';

interface ThreeAvatarProps {
  activeSignToken?: string;
  signTokens?: string[];
  autoPlay?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

export const VERIFIED_ISL_SIGNS: Record<string, { label: string; description: string }> = {
  HELLO: { label: 'Hello', description: 'Open palm forward sweep greeting' },
  NAMASTE: { label: 'Namaste', description: 'Two palms pressed together at mid-chest in reverent prayer' },
  'THANK YOU': { label: 'Thank You', description: 'Fingertips touch chin, sweep forward toward recipient' },
  THANKYOU: { label: 'Thank You', description: 'Fingertips touch chin, sweep forward toward recipient' },
  YES: { label: 'Yes', description: 'Closed fist nodding up and down at the wrist' },
  NO: { label: 'No', description: 'Index and middle fingers snap downward onto thumb' },
  HELP: { label: 'Help', description: 'Right thumbs-up fist lifted upward by open left support palm' },
  'HELP-ME': { label: 'Help Me', description: 'Right thumbs-up fist lifted upward by open left support palm' },
  GOOD: { label: 'Good', description: 'Fingertips touch chin, drop into open upturned left palm' },
  LEARN: { label: 'Learn', description: 'Gathering knowledge from flat book palm to forehead' },
  SIGN: { label: 'Sign', description: 'Alternating circling index fingers at chest level' },
  WELCOME: { label: 'Welcome', description: 'Both open hands sweeping inward toward chest' },
  PLEASE: { label: 'Please', description: 'Open flat palm gently circling over center of chest' },
  AGREE: { label: 'Agree', description: 'Both fists nodding forward in unison' },
  ALL: { label: 'All', description: 'Both hands sweeping outward in inclusive semi-circle' },
  ACCEPT: { label: 'Accept', description: 'Both hands opening and drawing inward toward chest' },
  WATER: { label: 'Water', description: 'Three fingers in W-shape tapping chin lightly' },
  FOOD: { label: 'Food', description: 'Gathered fingertips tapping near mouth twice' },
  A: { label: 'Letter A', description: 'Fist with thumb resting alongside index finger' },
  B: { label: 'Letter B', description: 'Four fingers upright together, thumb folded across palm' },
  C: { label: 'Letter C', description: 'Curved C-shape arc formed with fingers and thumb' },
  D: { label: 'Letter D', description: 'Index finger upright, middle/ring touching thumb' },
  E: { label: 'Letter E', description: 'Fingers curled tight down against thumb' },
  '0': { label: 'Number 0', description: 'Fingers curved meeting thumb in an O circle' },
  '1': { label: 'Number 1', description: 'Index finger pointing upright, thumb over curled fingers' },
  '2': { label: 'Number 2', description: 'Index and middle fingers extended in a crisp V' },
  '3': { label: 'Number 3', description: 'Thumb, index, and middle fingers extended upright' },
  '4': { label: 'Number 4', description: 'Four fingers upright together, thumb folded across lower palm' },
  '5': { label: 'Number 5', description: 'All five fingers spread wide upright' },
};

interface FingerState {
  thumbX: number;
  thumbY: number;
  thumbZ: number;
  indexX: number;
  indexZ: number;
  middleX: number;
  middleZ: number;
  ringPinkyX: number;
}

const DEFAULT_FINGERS: FingerState = {
  thumbX: 0.2,
  thumbY: 0,
  thumbZ: 0,
  indexX: 0.2,
  indexZ: 0,
  middleX: 0.25,
  middleZ: 0,
  ringPinkyX: 0.3,
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
  const [backendAnimData, setBackendAnimData] = useState<SignAnimationData | null>(null);
  const [isAnimationMissing, setIsAnimationMissing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [hasBackendKeyframes, setHasBackendKeyframes] = useState<boolean>(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Body parts references
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headRef = useRef<THREE.Group | null>(null);
  const chestLightRef = useRef<THREE.Mesh | null>(null);

  // Right arm hierarchy
  const rightArmRef = useRef<THREE.Group | null>(null);
  const rightForearmRef = useRef<THREE.Group | null>(null);
  const rightWristRef = useRef<THREE.Group | null>(null);
  const rightHandRef = useRef<THREE.Group | null>(null);
  const rightThumbRef = useRef<THREE.Group | null>(null);
  const rightIndexRef = useRef<THREE.Group | null>(null);
  const rightMiddleRef = useRef<THREE.Group | null>(null);
  const rightRingPinkyRef = useRef<THREE.Group | null>(null);

  // Left arm hierarchy
  const leftArmRef = useRef<THREE.Group | null>(null);
  const leftForearmRef = useRef<THREE.Group | null>(null);
  const leftWristRef = useRef<THREE.Group | null>(null);
  const leftHandRef = useRef<THREE.Group | null>(null);
  const leftThumbRef = useRef<THREE.Group | null>(null);
  const leftIndexRef = useRef<THREE.Group | null>(null);
  const leftMiddleRef = useRef<THREE.Group | null>(null);
  const leftRingPinkyRef = useRef<THREE.Group | null>(null);

  // Animation timeline state
  const animTimeRef = useRef<number>(0);
  const currentTokenIndexRef = useRef<number>(0);
  const backendAnimRef = useRef<SignAnimationData | null>(null);

  // Keep ref synchronized with state for 60fps render loop
  useEffect(() => {
    backendAnimRef.current = backendAnimData;
  }, [backendAnimData]);

  // Fetch backend animation keyframes or fallback to verified pose catalog
  useEffect(() => {
    let isCancelled = false;
    if (!activeSignToken) return;

    const upper = activeSignToken.toUpperCase().trim();
    setCurrentSign(upper);
    animTimeRef.current = 0;

    signService
      .getAnimationData(upper)
      .then((data) => {
        if (isCancelled) return;
        setBackendAnimData(data);
        const hasKeyframes = Boolean(data?.threejs_bones && data.threejs_bones.length > 0);
        const isPreset = Boolean(VERIFIED_ISL_SIGNS[upper]);
        setHasBackendKeyframes(hasKeyframes);
        setIsAnimationMissing(!hasKeyframes && !isPreset);
      })
      .catch(() => {
        if (isCancelled) return;
        setBackendAnimData(null);
        setHasBackendKeyframes(false);
        const isPreset = Boolean(VERIFIED_ISL_SIGNS[upper]);
        setIsAnimationMissing(!isPreset);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSignToken]);

  // Initialize Three.js scene and articulated avatar rig
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xfff0c9);

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

    const rimLight = new THREE.DirectionalLight(0xf28c00, 0.6);
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

    // Head mesh
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

    // Shared geometries for arms and fingers
    const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.32, 12);
    upperArmGeo.translate(0, -0.16, 0);

    const forearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.28, 12);
    forearmGeo.translate(0, -0.14, 0);

    const palmGeo = new THREE.BoxGeometry(0.08, 0.08, 0.025);
    palmGeo.translate(0, -0.04, 0);

    // ---- RIGHT ARM & WRIST & FINGERS ----
    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 1.32, 0);
    rightArmRef.current = rightArm;
    avatarGroup.add(rightArm);

    const rightUpper = new THREE.Mesh(upperArmGeo, charcoalMat);
    rightArm.add(rightUpper);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.32, 0);
    rightForearmRef.current = rightForearm;
    rightArm.add(rightForearm);

    const rightLower = new THREE.Mesh(forearmGeo, bodyYellowMat);
    rightForearm.add(rightLower);

    const rightWrist = new THREE.Group();
    rightWrist.position.set(0, -0.28, 0);
    rightWristRef.current = rightWrist;
    rightForearm.add(rightWrist);

    const rightHand = new THREE.Group();
    rightHandRef.current = rightHand;
    rightWrist.add(rightHand);

    const rightPalm = new THREE.Mesh(palmGeo, orangeMat);
    rightHand.add(rightPalm);

    // Articulated Right Fingers
    const rThumb = new THREE.Group();
    rThumb.position.set(0.042, -0.02, 0.005);
    const rThumbGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.04, 8);
    rThumbGeo.translate(0, -0.02, 0);
    rThumb.add(new THREE.Mesh(rThumbGeo, bodyYellowMat));
    rightHand.add(rThumb);
    rightThumbRef.current = rThumb;

    const rIndex = new THREE.Group();
    rIndex.position.set(0.026, -0.08, 0);
    const rIndexGeo = new THREE.CylinderGeometry(0.01, 0.009, 0.045, 8);
    rIndexGeo.translate(0, -0.022, 0);
    rIndex.add(new THREE.Mesh(rIndexGeo, bodyYellowMat));
    rightHand.add(rIndex);
    rightIndexRef.current = rIndex;

    const rMiddle = new THREE.Group();
    rMiddle.position.set(0.008, -0.08, 0);
    const rMiddleGeo = new THREE.CylinderGeometry(0.01, 0.009, 0.048, 8);
    rMiddleGeo.translate(0, -0.024, 0);
    rMiddle.add(new THREE.Mesh(rMiddleGeo, bodyYellowMat));
    rightHand.add(rMiddle);
    rightMiddleRef.current = rMiddle;

    const rRingPinky = new THREE.Group();
    rRingPinky.position.set(-0.018, -0.08, 0);
    const rRingGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.042, 8);
    rRingGeo.translate(0, -0.021, 0);
    rRingPinky.add(new THREE.Mesh(rRingGeo, bodyYellowMat));
    rightHand.add(rRingPinky);
    rightRingPinkyRef.current = rRingPinky;

    // ---- LEFT ARM & WRIST & FINGERS ----
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

    const leftWrist = new THREE.Group();
    leftWrist.position.set(0, -0.28, 0);
    leftWristRef.current = leftWrist;
    leftForearm.add(leftWrist);

    const leftHand = new THREE.Group();
    leftHandRef.current = leftHand;
    leftWrist.add(leftHand);

    const leftPalm = new THREE.Mesh(palmGeo, orangeMat);
    leftHand.add(leftPalm);

    // Articulated Left Fingers
    const lThumb = new THREE.Group();
    lThumb.position.set(-0.042, -0.02, 0.005);
    const lThumbGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.04, 8);
    lThumbGeo.translate(0, -0.02, 0);
    lThumb.add(new THREE.Mesh(lThumbGeo, bodyYellowMat));
    leftHand.add(lThumb);
    leftThumbRef.current = lThumb;

    const lIndex = new THREE.Group();
    lIndex.position.set(-0.026, -0.08, 0);
    const lIndexGeo = new THREE.CylinderGeometry(0.01, 0.009, 0.045, 8);
    lIndexGeo.translate(0, -0.022, 0);
    lIndex.add(new THREE.Mesh(lIndexGeo, bodyYellowMat));
    leftHand.add(lIndex);
    leftIndexRef.current = lIndex;

    const lMiddle = new THREE.Group();
    lMiddle.position.set(-0.008, -0.08, 0);
    const lMiddleGeo = new THREE.CylinderGeometry(0.01, 0.009, 0.048, 8);
    lMiddleGeo.translate(0, -0.024, 0);
    lMiddle.add(new THREE.Mesh(lMiddleGeo, bodyYellowMat));
    leftHand.add(lMiddle);
    leftMiddleRef.current = lMiddle;

    const lRingPinky = new THREE.Group();
    lRingPinky.position.set(0.018, -0.08, 0);
    const lRingGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.042, 8);
    lRingGeo.translate(0, -0.021, 0);
    lRingPinky.add(new THREE.Mesh(lRingGeo, bodyYellowMat));
    leftHand.add(lRingPinky);
    leftRingPinkyRef.current = lRingPinky;

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

  // Kinematic Sign & Finger Pose Solver
  const updateSignPose = useCallback(
    (sign: string, phase: number, delta: number) => {
      const head = headRef.current;
      const rightArm = rightArmRef.current;
      const rightForearm = rightForearmRef.current;
      const rightWrist = rightWristRef.current;
      const rightHand = rightHandRef.current;
      const leftArm = leftArmRef.current;
      const leftForearm = leftForearmRef.current;
      const leftWrist = leftWristRef.current;
      const leftHand = leftHandRef.current;
      const avatar = avatarGroupRef.current;

      const rThumb = rightThumbRef.current;
      const rIndex = rightIndexRef.current;
      const rMiddle = rightMiddleRef.current;
      const rRing = rightRingPinkyRef.current;

      const lThumb = leftThumbRef.current;
      const lIndex = leftIndexRef.current;
      const lMiddle = leftMiddleRef.current;
      const lRing = leftRingPinkyRef.current;

      if (!head || !rightArm || !rightForearm || !rightWrist || !rightHand || !leftArm || !leftForearm || !leftWrist || !leftHand || !avatar) {
        return;
      }

      // Natural idle breathing & sway
      const idleSway = Math.sin(phase * 2) * 0.03;
      avatar.position.y = idleSway * 0.3;
      head.rotation.x = Math.sin(phase * 1.5) * 0.04;
      head.rotation.y = Math.sin(phase * 0.8) * 0.05;

      // Default resting arm positions
      let targetRArmX = 0.2;
      let targetRArmY = 0;
      let targetRArmZ = 0.1;
      let targetRForearmX = -0.3;
      let targetRForearmY = 0;
      let targetRForearmZ = 0;
      let targetRWristX = 0;
      let targetRWristY = 0;
      let targetRWristZ = 0;

      let targetLArmX = 0.2;
      let targetLArmY = 0;
      let targetLArmZ = -0.1;
      let targetLForearmX = -0.3;
      let targetLForearmY = 0;
      let targetLForearmZ = 0;
      let targetLWristX = 0;
      let targetLWristY = 0;
      let targetLWristZ = 0;

      let targetRFingers: FingerState = { ...DEFAULT_FINGERS };
      let targetLFingers: FingerState = { ...DEFAULT_FINGERS };

      const upper = sign.toUpperCase().trim();
      const currentBackendData = backendAnimRef.current;

      // 1. If real backend quaternion keyframes exist, apply them directly
      let usedBackendKeyframes = false;
      if (currentBackendData?.threejs_bones && currentBackendData.threejs_bones.length > 0) {
        usedBackendKeyframes = true;
        const durSec = Math.max((currentBackendData.duration_ms || 1000) / 1000, 0.6);
        const t = (phase % durSec);

        for (const track of currentBackendData.threejs_bones) {
          const { bone_name, times, values } = track;
          if (!times || times.length < 2 || !values || values.length < 8) continue;

          let idx = 0;
          while (idx < times.length - 1 && times[idx + 1] <= t) {
            idx++;
          }
          const t0 = times[idx];
          const t1 = times[Math.min(idx + 1, times.length - 1)];
          const alpha = t1 > t0 ? Math.min(Math.max((t - t0) / (t1 - t0), 0), 1) : 0;

          const q0 = new THREE.Quaternion(values[idx * 4], values[idx * 4 + 1], values[idx * 4 + 2], values[idx * 4 + 3]);
          const q1 = new THREE.Quaternion(
            values[Math.min(idx + 1, times.length - 1) * 4],
            values[Math.min(idx + 1, times.length - 1) * 4 + 1],
            values[Math.min(idx + 1, times.length - 1) * 4 + 2],
            values[Math.min(idx + 1, times.length - 1) * 4 + 3]
          );
          const targetQ = q0.slerp(q1, alpha);

          const boneLerp = Math.min(delta * 10 * playbackSpeed, 0.4);
          if (bone_name === 'RightArm') {
            rightArm.quaternion.slerp(targetQ, boneLerp);
          } else if (bone_name === 'RightForeArm') {
            rightForearm.quaternion.slerp(targetQ, boneLerp);
          } else if (bone_name === 'RightHand') {
            rightHand.quaternion.slerp(targetQ, boneLerp);
          } else if (bone_name === 'LeftArm') {
            leftArm.quaternion.slerp(targetQ, boneLerp);
          } else if (bone_name === 'LeftForeArm') {
            leftForearm.quaternion.slerp(targetQ, boneLerp);
          } else if (bone_name === 'LeftHand') {
            leftHand.quaternion.slerp(targetQ, boneLerp);
          }
        }

        // Check for HamNoSys handshape tags
        const symbols = currentBackendData.hamnosys_symbols || [];
        if (symbols.some((s) => s.includes('fist'))) {
          targetRFingers = { thumbX: 1.1, thumbY: -0.3, thumbZ: 0.2, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (symbols.some((s) => s.includes('flathand'))) {
          targetRFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
        } else if (symbols.some((s) => s.includes('finger23'))) {
          targetRFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0.16, middleX: 0, middleZ: -0.16, ringPinkyX: 1.5 };
        } else if (symbols.some((s) => s.includes('finger2'))) {
          targetRFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (symbols.some((s) => s.includes('cee'))) {
          targetRFingers = { thumbX: 0.7, thumbY: 0.3, thumbZ: 0, indexX: 0.75, indexZ: 0, middleX: 0.75, middleZ: 0, ringPinkyX: 0.75 };
        }

        // Symmetric left arm if indicated
        if (symbols.some((s) => s.includes('symmlr'))) {
          targetLFingers = { ...targetRFingers };
          leftArm.quaternion.set(rightArm.quaternion.x, -rightArm.quaternion.y, -rightArm.quaternion.z, rightArm.quaternion.w);
          leftForearm.quaternion.set(rightForearm.quaternion.x, -rightForearm.quaternion.y, -rightForearm.quaternion.z, rightForearm.quaternion.w);
        }
      }

      // 2. High-fidelity Kinematic Solver for Verified Signs
      if (!usedBackendKeyframes) {
        if (upper === 'HELLO') {
          // Right arm raised, palm open, friendly forward-right waving motion
          const wave = Math.sin(phase * 6) * 0.25;
          targetRArmX = -1.2;
          targetRArmZ = -0.4;
          targetRForearmX = -1.1;
          targetRForearmY = -0.3;
          targetRWristX = wave;
          targetRWristZ = 0.2;
          targetRFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
          head.rotation.x = 0.12;
        } else if (upper === 'NAMASTE') {
          // Authentic Indian Sign Language Greeting:
          // Both arms lift to mid-chest, forearms angled inward, palms pressed flat together (Anjali Mudra)
          targetRArmX = -0.85;
          targetRArmY = 0.35;
          targetRArmZ = -0.55;
          targetRForearmX = -1.45;
          targetRForearmY = -0.65;
          targetRWristX = 0.2;
          targetRWristZ = 0.3;

          targetLArmX = -0.85;
          targetLArmY = -0.35;
          targetLArmZ = 0.55;
          targetLForearmX = -1.45;
          targetLForearmY = 0.65;
          targetLWristX = 0.2;
          targetLWristZ = -0.3;

          // Straight fingers pressed together
          targetRFingers = { thumbX: 0, thumbY: 0.1, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
          targetLFingers = { thumbX: 0, thumbY: 0.1, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };

          // Reverent bow of head
          const bowCycle = (Math.sin(phase * 3) + 1) / 2;
          head.rotation.x = THREE.MathUtils.lerp(0.1, 0.28, bowCycle);
        } else if (upper === 'THANK YOU' || upper === 'THANKYOU') {
          // Hand touches chin, then sweeps gracefully outward towards the viewer
          const cycle = (Math.sin(phase * 3) + 1) / 2;
          targetRArmX = THREE.MathUtils.lerp(-1.45, -0.65, cycle);
          targetRArmZ = THREE.MathUtils.lerp(-0.25, 0.35, cycle);
          targetRForearmX = THREE.MathUtils.lerp(-1.55, -0.5, cycle);
          targetRWristX = THREE.MathUtils.lerp(-0.3, 0.45, cycle);
          targetRFingers = { thumbX: 0, thumbY: 0.1, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
          head.rotation.x = 0.1;
        } else if (upper === 'YES') {
          // Right fist elevated at shoulder, wrist nodding up and down
          const nod = Math.sin(phase * 7) * 0.35;
          targetRArmX = -0.95;
          targetRArmZ = -0.2;
          targetRForearmX = -1.25;
          targetRWristX = nod;
          targetRFingers = { thumbX: 1.1, thumbY: -0.3, thumbZ: 0.2, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
          head.rotation.x = nod * 0.25;
        } else if (upper === 'NO') {
          // Index and middle fingers extended, snapping down onto thumb
          const snap = Math.sin(phase * 6) > 0 ? 0 : 1.2;
          targetRArmX = -1.0;
          targetRArmZ = -0.25;
          targetRForearmX = -1.2;
          targetRWristX = 0.1;
          targetRFingers = {
            thumbX: 0.5,
            thumbY: 0,
            thumbZ: 0,
            indexX: snap,
            indexZ: 0.1,
            middleX: snap,
            middleZ: -0.1,
            ringPinkyX: 1.5,
          };
          head.rotation.y = Math.sin(phase * 6) * 0.1;
        } else if (upper === 'HELP' || upper === 'HELP-ME') {
          // Left palm flat platform at mid-chest, right thumbs-up fist lifted upward
          const lift = (Math.sin(phase * 4) + 1) / 2;
          targetLArmX = THREE.MathUtils.lerp(-0.8, -1.0, lift);
          targetLArmZ = 0.4;
          targetLForearmX = -1.25;
          targetLFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };

          targetRArmX = THREE.MathUtils.lerp(-0.85, -1.05, lift);
          targetRArmZ = -0.3;
          targetRForearmX = -1.2;
          // Thumbs up pose
          targetRFingers = { thumbX: -0.6, thumbY: 0, thumbZ: 0, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (upper === 'GOOD') {
          // Right fingertips touch chin, then drop into flat left palm
          const step = (Math.sin(phase * 3.5) + 1) / 2;
          targetLArmX = -0.7;
          targetLArmZ = 0.35;
          targetLForearmX = -1.15;
          targetLFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };

          targetRArmX = THREE.MathUtils.lerp(-1.35, -0.75, step);
          targetRForearmX = THREE.MathUtils.lerp(-1.45, -1.05, step);
          targetRFingers = { thumbX: 0, thumbY: 0.1, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
        } else if (upper === 'LEARN') {
          // Left hand open book; right hand draws knowledge from left palm to forehead
          const grasp = (Math.sin(phase * 3) + 1) / 2;
          targetLArmX = -0.75;
          targetLArmZ = 0.35;
          targetLForearmX = -1.2;
          targetLFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };

          targetRArmX = THREE.MathUtils.lerp(-0.8, -1.4, grasp);
          targetRForearmX = THREE.MathUtils.lerp(-1.1, -1.5, grasp);
          const fingerCurl = THREE.MathUtils.lerp(0, 1.2, grasp);
          targetRFingers = { thumbX: fingerCurl, thumbY: 0, thumbZ: 0, indexX: fingerCurl, indexZ: 0, middleX: fingerCurl, middleZ: 0, ringPinkyX: fingerCurl };
        } else if (upper === 'SIGN') {
          // Alternating circling index fingers at chest level
          const rCircle = phase * 5;
          const lCircle = phase * 5 + Math.PI;
          targetRArmX = -0.85 + Math.sin(rCircle) * 0.15;
          targetRArmZ = -0.25 + Math.cos(rCircle) * 0.15;
          targetRForearmX = -1.2;
          targetRWristX = Math.sin(rCircle) * 0.2;
          targetRFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };

          targetLArmX = -0.85 + Math.sin(lCircle) * 0.15;
          targetLArmZ = 0.25 + Math.cos(lCircle) * 0.15;
          targetLForearmX = -1.2;
          targetLWristX = Math.sin(lCircle) * 0.2;
          targetLFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (upper === 'WELCOME' || upper === 'PLEASE') {
          // Both open hands sweeping inward toward chest
          const sweep = (Math.sin(phase * 3.5) + 1) / 2;
          targetRArmX = -0.7;
          targetRArmZ = THREE.MathUtils.lerp(-0.4, -0.15, sweep);
          targetRForearmX = -1.1;
          targetRWristX = 0.2;
          targetRFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };

          targetLArmX = -0.7;
          targetLArmZ = THREE.MathUtils.lerp(0.4, 0.15, sweep);
          targetLForearmX = -1.1;
          targetLWristX = 0.2;
          targetLFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
        } else if (upper === 'AGREE') {
          // Both fists nodding forward in unison
          const nod = Math.sin(phase * 6) * 0.25;
          targetRArmX = -0.85;
          targetRArmZ = -0.2;
          targetRForearmX = -1.15;
          targetRWristX = nod;
          targetRFingers = { thumbX: 1.1, thumbY: -0.3, thumbZ: 0.2, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };

          targetLArmX = -0.85;
          targetLArmZ = 0.2;
          targetLForearmX = -1.15;
          targetLWristX = nod;
          targetLFingers = { thumbX: 1.1, thumbY: -0.3, thumbZ: 0.2, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (upper === 'WATER') {
          // W-shape tapping chin
          const tap = Math.sin(phase * 6) * 0.15;
          targetRArmX = -1.35 + tap;
          targetRArmZ = -0.2;
          targetRForearmX = -1.45;
          targetRFingers = { thumbX: 0, thumbY: 0.2, thumbZ: 0, indexX: 0, indexZ: 0.12, middleX: 0, middleZ: -0.12, ringPinkyX: 1.5 };
        } else if (upper === 'FOOD') {
          // Pinched fingers to mouth
          const tap = Math.sin(phase * 6) * 0.15;
          targetRArmX = -1.35 + tap;
          targetRArmZ = -0.15;
          targetRForearmX = -1.45;
          targetRFingers = { thumbX: 0.8, thumbY: 0.2, thumbZ: 0, indexX: 0.8, indexZ: 0, middleX: 0.8, middleZ: 0, ringPinkyX: 0.8 };
        } else if (upper === '1') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (upper === '2') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 1.0, thumbY: -0.3, thumbZ: 0.2, indexX: 0, indexZ: 0.18, middleX: 0, middleZ: -0.18, ringPinkyX: 1.5 };
        } else if (upper === '3') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 0, thumbY: 0.3, thumbZ: 0, indexX: 0, indexZ: 0.15, middleX: 0, middleZ: -0.15, ringPinkyX: 1.5 };
        } else if (upper === '4') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 1.2, thumbY: -0.4, thumbZ: 0.2, indexX: 0, indexZ: 0.08, middleX: 0, middleZ: 0, ringPinkyX: 0 };
        } else if (upper === '5' || upper === 'B') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 0, thumbY: 0.3, thumbZ: 0, indexX: 0, indexZ: 0, middleX: 0, middleZ: 0, ringPinkyX: 0 };
        } else if (upper === 'A') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 0.3, thumbY: -0.2, thumbZ: 0, indexX: 1.5, indexZ: 0, middleX: 1.5, middleZ: 0, ringPinkyX: 1.5 };
        } else if (upper === 'C') {
          targetRArmX = -1.0;
          targetRArmZ = -0.3;
          targetRForearmX = -1.25;
          targetRFingers = { thumbX: 0.7, thumbY: 0.25, thumbZ: 0, indexX: 0.75, indexZ: 0, middleX: 0.75, middleZ: 0, ringPinkyX: 0.75 };
        }
      }

      // Smooth kinematic lerp for natural arm articulation
      const lerpSpeed = Math.min(delta * 8 * playbackSpeed, 0.35);

      if (!usedBackendKeyframes) {
        rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, targetRArmX, lerpSpeed);
        rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, targetRArmY, lerpSpeed);
        rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, targetRArmZ, lerpSpeed);

        rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, targetRForearmX, lerpSpeed);
        rightForearm.rotation.y = THREE.MathUtils.lerp(rightForearm.rotation.y, targetRForearmY, lerpSpeed);
        rightForearm.rotation.z = THREE.MathUtils.lerp(rightForearm.rotation.z, targetRForearmZ, lerpSpeed);

        rightWrist.rotation.x = THREE.MathUtils.lerp(rightWrist.rotation.x, targetRWristX, lerpSpeed);
        rightWrist.rotation.y = THREE.MathUtils.lerp(rightWrist.rotation.y, targetRWristY, lerpSpeed);
        rightWrist.rotation.z = THREE.MathUtils.lerp(rightWrist.rotation.z, targetRWristZ, lerpSpeed);

        leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, targetLArmX, lerpSpeed);
        leftArm.rotation.y = THREE.MathUtils.lerp(leftArm.rotation.y, targetLArmY, lerpSpeed);
        leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, targetLArmZ, lerpSpeed);

        leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, targetLForearmX, lerpSpeed);
        leftForearm.rotation.y = THREE.MathUtils.lerp(leftForearm.rotation.y, targetLForearmY, lerpSpeed);
        leftForearm.rotation.z = THREE.MathUtils.lerp(leftForearm.rotation.z, targetLForearmZ, lerpSpeed);

        leftWrist.rotation.x = THREE.MathUtils.lerp(leftWrist.rotation.x, targetLWristX, lerpSpeed);
        leftWrist.rotation.y = THREE.MathUtils.lerp(leftWrist.rotation.y, targetLWristY, lerpSpeed);
        leftWrist.rotation.z = THREE.MathUtils.lerp(leftWrist.rotation.z, targetLWristZ, lerpSpeed);
      }

      // Smooth kinematic lerp for fingers
      if (rThumb) {
        rThumb.rotation.x = THREE.MathUtils.lerp(rThumb.rotation.x, targetRFingers.thumbX, lerpSpeed);
        rThumb.rotation.y = THREE.MathUtils.lerp(rThumb.rotation.y, targetRFingers.thumbY, lerpSpeed);
        rThumb.rotation.z = THREE.MathUtils.lerp(rThumb.rotation.z, targetRFingers.thumbZ, lerpSpeed);
      }
      if (rIndex) {
        rIndex.rotation.x = THREE.MathUtils.lerp(rIndex.rotation.x, targetRFingers.indexX, lerpSpeed);
        rIndex.rotation.z = THREE.MathUtils.lerp(rIndex.rotation.z, targetRFingers.indexZ, lerpSpeed);
      }
      if (rMiddle) {
        rMiddle.rotation.x = THREE.MathUtils.lerp(rMiddle.rotation.x, targetRFingers.middleX, lerpSpeed);
        rMiddle.rotation.z = THREE.MathUtils.lerp(rMiddle.rotation.z, targetRFingers.middleZ, lerpSpeed);
      }
      if (rRing) {
        rRing.rotation.x = THREE.MathUtils.lerp(rRing.rotation.x, targetRFingers.ringPinkyX, lerpSpeed);
      }

      if (lThumb) {
        lThumb.rotation.x = THREE.MathUtils.lerp(lThumb.rotation.x, targetLFingers.thumbX, lerpSpeed);
        lThumb.rotation.y = THREE.MathUtils.lerp(lThumb.rotation.y, targetLFingers.thumbY, lerpSpeed);
        lThumb.rotation.z = THREE.MathUtils.lerp(lThumb.rotation.z, targetLFingers.thumbZ, lerpSpeed);
      }
      if (lIndex) {
        lIndex.rotation.x = THREE.MathUtils.lerp(lIndex.rotation.x, targetLFingers.indexX, lerpSpeed);
        lIndex.rotation.z = THREE.MathUtils.lerp(lIndex.rotation.z, targetLFingers.indexZ, lerpSpeed);
      }
      if (lMiddle) {
        lMiddle.rotation.x = THREE.MathUtils.lerp(lMiddle.rotation.x, targetLFingers.middleX, lerpSpeed);
        lMiddle.rotation.z = THREE.MathUtils.lerp(lMiddle.rotation.z, targetLFingers.middleZ, lerpSpeed);
      }
      if (lRing) {
        lRing.rotation.x = THREE.MathUtils.lerp(lRing.rotation.x, targetLFingers.ringPinkyX, lerpSpeed);
      }
    },
    [playbackSpeed]
  );

  // Main Render Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (isPlaying) {
        animTimeRef.current += delta * playbackSpeed;
        const currentData = backendAnimRef.current;
        const cycleDuration = currentData?.duration_ms ? currentData.duration_ms / 1000 : 3.0;
        const normalized = (animTimeRef.current % cycleDuration) / cycleDuration;
        setProgress(Math.round(normalized * 100));

        // Advance multi-token phrase sequence if provided
        if (signTokens && signTokens.length > 1) {
          const tokenIndex = Math.floor(animTimeRef.current / cycleDuration) % signTokens.length;
          if (tokenIndex !== currentTokenIndexRef.current) {
            currentTokenIndexRef.current = tokenIndex;
            const nextToken = signTokens[tokenIndex];
            const upper = nextToken.toUpperCase().trim();
            setCurrentSign(upper);
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

  const currentMetadata = VERIFIED_ISL_SIGNS[currentSign] || {
    label: currentSign,
    description: hasBackendKeyframes ? 'Backend ISL verified motion capture asset' : 'Indian Sign Language Token',
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
            {hasBackendKeyframes ? 'Verified MoCap' : 'Kinematic 3D'}
          </span>
        </div>
      </div>

      {/* 3D Canvas Display Area */}
      <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-[#FFF0C9]/40 to-[#FFE0BD]/20 flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Missing Animation Notice */}
        {isAnimationMissing && (
          <div className="absolute inset-x-4 top-4 p-3 bg-white/95 backdrop-blur-xs border-2 border-[#222222] rounded-xl shadow-md text-xs text-[#222222] flex items-start gap-2.5 z-10 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-[#F28C00] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold flex items-center gap-1.5">
                Sign Asset Pending Verification
                <span className="text-[10px] bg-[#FFE0BD] px-1.5 py-0.2 rounded border border-[#222222]/30">
                  Linguist Review
                </span>
              </p>
              <p className="text-[#666666] text-[11px] mt-0.5">
                Avatar is in neutral holding position for &ldquo;{currentSign}&rdquo;. To ensure linguistic accuracy, EduBridge does not invent unverified motions.
              </p>
            </div>
          </div>
        )}

        {/* Current Active Sign Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#FFFFFF]/95 backdrop-blur-xs border-2 border-[#222222] px-3 py-1.5 rounded-xl shadow-sm pointer-events-none max-w-[240px]">
          <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[#666666] tracking-wider">
            {hasBackendKeyframes ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
            ) : isAnimationMissing ? (
              <ShieldAlert className="w-3 h-3 text-amber-600 inline" />
            ) : (
              <Sparkles className="w-3 h-3 text-[#F28C00] inline" />
            )}
            Active ISL Token
          </div>
          <div className="text-sm font-extrabold text-[#222222] flex items-center gap-1.5 truncate">
            {currentMetadata.label}
          </div>
          <div className="text-[10px] text-[#666666] truncate">
            {currentMetadata.description}
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

      {/* Animation Playback Controls */}
      <div className="p-3 bg-[#FFFFFF] border-t-2 border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Play / Pause & Replay */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pause 3D avatar' : 'Play 3D avatar'}
            className="w-8 h-8 rounded-full bg-[#F28C00] text-white border-2 border-[#222222] flex items-center justify-center hover:bg-[#de7f00] transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
          </button>
          <button
            onClick={handleReplay}
            aria-label="Replay sign gesture"
            className="w-8 h-8 rounded-full bg-[#FFFFFF] text-[#222222] border-2 border-[#222222] flex items-center justify-center hover:bg-[#FFE0BD] transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Sign Presets Selector - Authentic Verified Signs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-[220px] sm:max-w-none">
          {['HELLO', 'NAMASTE', 'THANK YOU', 'YES', 'NO', 'HELP', 'GOOD', 'LEARN', 'SIGN'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setCurrentSign(s);
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
