import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { SOLVED_STATE } from '../../utils/cube';

// Face colors map matching the reference images
const FACE_COLORS = {
  U: '#FFD500', // Vibrant Electric Yellow
  D: '#FFFFFF', // Clean Crisp White
  L: '#FF5900', // Vibrant Warm Orange
  F: '#00A638', // Vibrant Emerald Green
  R: '#DC2626', // Vibrant Crimson Red
  B: '#0045FF', // Vibrant Royal Blue
  internal: '#121316', // Dark internal plastic
  body: '#0E1015' // Deep matte/satin black cubie body & bevels
};

// Map a 3D coordinate and a face direction to the stickers array index
const getStickerIndex = (x, y, z, face) => {
  if (face === 'U' && y === 1) {
    const r = z + 1;
    const c = x + 1;
    return r * 3 + c;
  }
  if (face === 'D' && y === -1) {
    const r = 1 - z;
    const c = x + 1;
    return 45 + r * 3 + c;
  }
  if (face === 'L' && x === -1) {
    const r = 1 - y;
    const c = z + 1;
    return 9 + r * 3 + c;
  }
  if (face === 'R' && x === 1) {
    const r = 1 - y;
    const c = 1 - z;
    return 27 + r * 3 + c;
  }
  if (face === 'F' && z === 1) {
    const r = 1 - y;
    const c = x + 1;
    return 18 + r * 3 + c;
  }
  if (face === 'B' && z === -1) {
    const r = 1 - y;
    const c = 1 - x;
    return 36 + r * 3 + c;
  }
  return null;
};

// Generate list of 27 positions for the cubies
const CUBIE_POSITIONS = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      CUBIE_POSITIONS.push({ x, y, z });
    }
  }
}

// Map a base move to its axis, layer condition, and rotation angle
const getMoveParams = (move, isReverse = false) => {
  const base = move.replace("'", "").replace("2", "");
  const isPrime = move.includes("'");
  const isDouble = move.includes("2");

  let mult = isReverse ? -1 : 1;
  if (isPrime) mult *= -1;

  let axis = 'y';
  let layerCondition = () => false;
  let angle = 0;

  switch (base) {
    case 'R':
      axis = 'x';
      layerCondition = (x) => x === 1;
      angle = isDouble ? Math.PI : (-Math.PI / 2) * mult;
      break;
    case 'L':
      axis = 'x';
      layerCondition = (x) => x === -1;
      angle = isDouble ? Math.PI : (Math.PI / 2) * mult;
      break;
    case 'U':
      axis = 'y';
      layerCondition = (x, y) => y === 1;
      angle = isDouble ? Math.PI : (-Math.PI / 2) * mult;
      break;
    case 'D':
      axis = 'y';
      layerCondition = (x, y) => y === -1;
      angle = isDouble ? Math.PI : (Math.PI / 2) * mult;
      break;
    case 'F':
      axis = 'z';
      layerCondition = (x, y, z) => z === 1;
      angle = isDouble ? Math.PI : (-Math.PI / 2) * mult;
      break;
    case 'B':
      axis = 'z';
      layerCondition = (x, y, z) => z === -1;
      angle = isDouble ? Math.PI : (Math.PI / 2) * mult;
      break;
  }

  return { axis, layerCondition, angle };
};

// Helper: Create rounded rectangle shape for sticker tiles
const createRoundedSquareShape = (size, radius) => {
  const shape = new THREE.Shape();
  const x = -size / 2;
  const y = -size / 2;
  const w = size;
  const h = size;
  const r = radius;

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
};

// Single Cubie Component with black body and rounded sticker tiles
const Cubie = React.forwardRef(({ position, stickersState, stickerGeometry, materials }, ref) => {
  const { x, y, z } = position;

  // Identify which outer faces exist for this cubie
  const faces = [];
  if (x === 1) faces.push({ face: 'R', pos: [0.49, 0, 0], rot: [0, Math.PI / 2, 0] });
  if (x === -1) faces.push({ face: 'L', pos: [-0.49, 0, 0], rot: [0, -Math.PI / 2, 0] });
  if (y === 1) faces.push({ face: 'U', pos: [0, 0.49, 0], rot: [-Math.PI / 2, 0, 0] });
  if (y === -1) faces.push({ face: 'D', pos: [0, -0.49, 0], rot: [Math.PI / 2, 0, 0] });
  if (z === 1) faces.push({ face: 'F', pos: [0, 0, 0.49], rot: [0, 0, 0] });
  if (z === -1) faces.push({ face: 'B', pos: [0, 0, -0.49], rot: [0, Math.PI, 0] });

  return (
    <group ref={ref} position={[x, y, z]}>
      {/* Dark beveled plastic body */}
      <RoundedBox
        args={[0.96, 0.96, 0.96]}
        radius={0.04}
        smoothness={4}
        material={materials.body}
      />

      {/* Rounded sticker tiles on exposed outer faces */}
      {faces.map(({ face, pos, rot }) => {
        const idx = getStickerIndex(x, y, z, face);
        const colorChar = idx !== null ? stickersState[idx] : 'internal';
        const mat = materials[colorChar] || materials.internal;

        return (
          <mesh
            key={face}
            geometry={stickerGeometry}
            material={mat}
            position={pos}
            rotation={rot}
          />
        );
      })}
    </group>
  );
});

Cubie.displayName = 'Cubie';

// Inner 3D Render Engine component
const RubiksCube3DRenderer = ({
  stickers,
  solution,
  currentStep,
  speed,
  reducedMotion
}) => {
  const [renderedStickers, setRenderedStickers] = useState(stickers);
  const [animating, setAnimating] = useState(false);

  const cubiesRefs = useRef([]);
  const prevStep = useRef(currentStep);
  const animStart = useRef(0);
  const animDuration = useRef(300);
  const animAngle = useRef(0);
  const animAxis = useRef('y');
  const activeLayerCondition = useRef(() => false);
  const targetStickers = useRef(stickers);

  targetStickers.current = stickers;

  // Memoize shared sticker geometry with chamfered rounded bevels
  const stickerGeometry = useMemo(() => {
    const shape = createRoundedSquareShape(0.82, 0.12);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    geom.center();
    return geom;
  }, []);

  // Memoize materials with smooth semi-gloss reflections
  const materials = useMemo(() => {
    const mats = {};
    Object.entries(FACE_COLORS).forEach(([key, color]) => {
      mats[key] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.18,
        metalness: 0.03,
      });
    });
    mats.body = new THREE.MeshStandardMaterial({
      color: new THREE.Color(FACE_COLORS.body),
      roughness: 0.35,
      metalness: 0.08,
    });
    return mats;
  }, []);

  useEffect(() => {
    const stepDiff = currentStep - prevStep.current;
    
    if (reducedMotion || Math.abs(stepDiff) !== 1 || !solution || solution.length === 0) {
      // Instant snap state
      setAnimating(false);
      setRenderedStickers(stickers);
      // Reset rotations of all cubies
      cubiesRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const { x, y, z } = CUBIE_POSITIONS[idx];
        ref.rotation.set(0, 0, 0);
        ref.position.set(x, y, z);
      });
    } else {
      // Setup turn animation
      const isReverse = stepDiff < 0;
      const moveIndex = isReverse ? currentStep : prevStep.current;
      const activeMove = solution[moveIndex];

      if (activeMove) {
        const { axis, layerCondition, angle } = getMoveParams(activeMove, isReverse);
        animAxis.current = axis;
        activeLayerCondition.current = layerCondition;
        animAngle.current = angle;
        animDuration.current = Math.min(300 / speed, (1000 / speed) * 0.85);
        animStart.current = performance.now();
        setAnimating(true);
      } else {
        setRenderedStickers(stickers);
      }
    }

    prevStep.current = currentStep;
  }, [currentStep, stickers, solution, speed, reducedMotion]);

  useFrame(() => {
    if (animating) {
      const now = performance.now();
      const elapsed = now - animStart.current;
      const progress = Math.min(elapsed / animDuration.current, 1);

      const currentAngle = animAngle.current * progress;
      const layerCondition = activeLayerCondition.current;

      cubiesRefs.current.forEach((ref, idx) => {
        if (!ref) return;
        const { x, y, z } = CUBIE_POSITIONS[idx];
        
        if (layerCondition(x, y, z)) {
          ref.rotation.set(0, 0, 0);
          if (animAxis.current === 'x') ref.rotation.x = currentAngle;
          if (animAxis.current === 'y') ref.rotation.y = currentAngle;
          if (animAxis.current === 'z') ref.rotation.z = currentAngle;

          // Rotate position vector around core origin
          const theta = currentAngle;
          let rx = x, ry = y, rz = z;
          if (animAxis.current === 'x') {
            ry = y * Math.cos(theta) - z * Math.sin(theta);
            rz = y * Math.sin(theta) + z * Math.cos(theta);
          } else if (animAxis.current === 'y') {
            rx = x * Math.cos(theta) + z * Math.sin(theta);
            rz = -x * Math.sin(theta) + z * Math.cos(theta);
          } else if (animAxis.current === 'z') {
            rx = x * Math.cos(theta) - y * Math.sin(theta);
            ry = x * Math.sin(theta) + y * Math.cos(theta);
            rz = z;
          }
          ref.position.set(rx, ry, rz);
        } else {
          ref.rotation.set(0, 0, 0);
          ref.position.set(x, y, z);
        }
      });

      if (progress >= 1) {
        setAnimating(false);
        setRenderedStickers(targetStickers.current);
        cubiesRefs.current.forEach((ref, idx) => {
          if (!ref) return;
          const { x, y, z } = CUBIE_POSITIONS[idx];
          ref.rotation.set(0, 0, 0);
          ref.position.set(x, y, z);
        });
      }
    }
  });

  return (
    <group>
      {CUBIE_POSITIONS.map((pos, idx) => (
        <Cubie
          key={idx}
          ref={(el) => (cubiesRefs.current[idx] = el)}
          position={pos}
          stickersState={renderedStickers}
          stickerGeometry={stickerGeometry}
          materials={materials}
        />
      ))}
    </group>
  );
};

// Root Exported Component containing Canvas and orbital camera config
const Cube3D = ({
  stickers = SOLVED_STATE,
  solution = [],
  currentStep = 0,
  speed = 1,
  className = ''
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return (
    <div
      className={`w-full h-[280px] sm:h-[350px] rounded-card overflow-hidden shadow-2xl border border-slate-800/80 ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #20242c 0%, #111317 60%, #08090c 100%)'
      }}
    >
      <Canvas camera={{ position: [3.8, 3.4, 4.6], fov: 40 }}>
        {/* Studio Lighting Setup */}
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[7, 10, 8]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-8, -6, -5]} intensity={0.6} color="#cdd5df" />
        <directionalLight position={[-5, 8, -6]} intensity={0.45} color="#e2e8f0" />
        <pointLight position={[3, 4, 4.5]} intensity={0.4} distance={12} color="#ffffff" />
        
        <RubiksCube3DRenderer
          stickers={stickers}
          solution={solution}
          currentStep={currentStep}
          speed={speed}
          reducedMotion={reducedMotion}
        />

        <OrbitControls
          enableZoom={true}
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={2.5}
          maxDistance={8.5}
        />
      </Canvas>
    </div>
  );
};

export default Cube3D;
