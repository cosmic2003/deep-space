"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useState, useMemo, Suspense } from "react";
import type { Group } from "three";
import type { ShapeSpec } from "@/lib/rocketShape";

interface CommonProps {
  length?: number | null;
  diameter?: number | null;
  accentColor?: string;
  shape?: ShapeSpec;
}

// ===== Materials (memoized would be nice but JSX in react-three-fiber re-creates each render is fine for simple meshes) =====

function bodyColor(shape?: ShapeSpec): string {
  return shape?.bodyColor ?? "#e5e7eb";
}

// ===== Shape: Single stick (default) =====
function SingleStick({ r, totalH, accentColor, body }: { r: number; totalH: number; accentColor: string; body: string }) {
  const sH = {
    engine: totalH * 0.04,
    firstStage: totalH * 0.55,
    interstage: totalH * 0.025,
    upperStage: totalH * 0.22,
    fairing: totalH * 0.10,
    nose: totalH * 0.065,
  };
  const rUpper = r * 0.85;
  let y = -totalH / 2;
  const place = (h: number) => { const c = y + h / 2; y += h; return c; };
  const yEng = place(sH.engine);
  const yFirst = place(sH.firstStage);
  const yInter = place(sH.interstage);
  const yUpper = place(sH.upperStage);
  const yFair = place(sH.fairing);
  const yNose = place(sH.nose);

  return (
    <group>
      <mesh position={[0, yEng, 0]}>
        <cylinderGeometry args={[r, r * 1.1, sH.engine, 32]} />
        <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, yEng - sH.engine * 0.6, 0]}>
        <coneGeometry args={[r * 0.7, sH.engine * 0.9, 24, 1, true]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.4} roughness={0.7} side={2} />
      </mesh>
      <mesh position={[0, yFirst, 0]}>
        <cylinderGeometry args={[r, r, sH.firstStage, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, yFirst + sH.firstStage * 0.32, 0]}>
        <cylinderGeometry args={[r * 1.003, r * 1.003, sH.firstStage * 0.06, 48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.45} metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Grid fins (4) */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const fW = r * 0.85;
        const fH = sH.firstStage * 0.1;
        const fT = r * 0.05;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * (r + fW / 2 - 0.01), yFirst - sH.firstStage * 0.43, Math.sin(angle) * (r + fW / 2 - 0.01)]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[fW, fH, fT]} />
            <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, yInter, 0]}>
        <cylinderGeometry args={[rUpper, r, sH.interstage, 48]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, yUpper, 0]}>
        <cylinderGeometry args={[rUpper, rUpper, sH.upperStage, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, yFair, 0]}>
        <cylinderGeometry args={[rUpper * 0.45, rUpper, sH.fairing, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0, yNose, 0]}>
        <coneGeometry args={[rUpper * 0.45, sH.nose, 32]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

// ===== Shape: Soyuz-style (4 conical strap-ons + central core) =====
function SoyuzShape({ r, totalH, accentColor, body, srbCount = 4 }: { r: number; totalH: number; accentColor: string; body: string; srbCount?: number }) {
  // Soyuz visual: short, wider, taper at base. Boosters end ~30-35% of total H, conical to a point at top.
  const coreR = r * 0.85;
  const boosterR = r * 0.55;
  const boosterH = totalH * 0.36;

  const yBase = -totalH / 2;
  const sH = {
    engine: totalH * 0.04,
    firstStage: totalH * 0.55,
    interstage: totalH * 0.02,
    upperStage: totalH * 0.22,
    fairing: totalH * 0.10,
    nose: totalH * 0.07,
  };
  let y = yBase;
  const place = (h: number) => { const c = y + h / 2; y += h; return c; };
  const yEng = place(sH.engine);
  const yFirst = place(sH.firstStage);
  const yInter = place(sH.interstage);
  const yUpper = place(sH.upperStage);
  const yFair = place(sH.fairing);
  const yNose = place(sH.nose);

  return (
    <group>
      {/* Strap-on boosters */}
      {Array.from({ length: srbCount }).map((_, i) => {
        const angle = (i / srbCount) * Math.PI * 2;
        const dist = coreR + boosterR + 0.005;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const boosterCenterY = yBase + boosterH / 2;
        return (
          <group key={i} position={[x, boosterCenterY, z]}>
            {/* booster body — taper from full diameter at bottom to ~30% at top */}
            <mesh>
              <cylinderGeometry args={[boosterR * 0.3, boosterR, boosterH * 0.78, 24]} />
              <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
            </mesh>
            {/* booster nose tip */}
            <mesh position={[0, boosterH * 0.5, 0]}>
              <coneGeometry args={[boosterR * 0.3, boosterH * 0.22, 20]} />
              <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
            </mesh>
            {/* engine bell at base */}
            <mesh position={[0, -boosterH * 0.42, 0]}>
              <cylinderGeometry args={[boosterR * 0.95, boosterR * 1.05, boosterH * 0.06, 20]} />
              <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
      {/* Central core engine */}
      <mesh position={[0, yEng, 0]}>
        <cylinderGeometry args={[coreR, coreR * 1.05, sH.engine, 32]} />
        <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Central first stage */}
      <mesh position={[0, yFirst, 0]}>
        <cylinderGeometry args={[coreR, coreR, sH.firstStage, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Accent stripe */}
      <mesh position={[0, yFirst + sH.firstStage * 0.4, 0]}>
        <cylinderGeometry args={[coreR * 1.003, coreR * 1.003, sH.firstStage * 0.05, 48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.45} />
      </mesh>
      {/* Interstage */}
      <mesh position={[0, yInter, 0]}>
        <cylinderGeometry args={[coreR * 0.85, coreR, sH.interstage, 48]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Upper stage */}
      <mesh position={[0, yUpper, 0]}>
        <cylinderGeometry args={[coreR * 0.85, coreR * 0.85, sH.upperStage, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Fairing */}
      <mesh position={[0, yFair, 0]}>
        <cylinderGeometry args={[coreR * 0.4, coreR * 0.85, sH.fairing, 48]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Nose */}
      <mesh position={[0, yNose, 0]}>
        <coneGeometry args={[coreR * 0.4, sH.nose, 32]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

// ===== Shape: SRB (Atlas V, Ariane 6, SLS, H3 — solid rocket boosters strapped on) =====
function SrbShape({ r, totalH, accentColor, body, srbCount = 0 }: { r: number; totalH: number; accentColor: string; body: string; srbCount?: number }) {
  if (srbCount === 0) {
    // No SRBs, fall back to single stick
    return <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} />;
  }
  const srbR = r * 0.45;
  const srbH = totalH * 0.55; // SRBs reach ~55% of total height
  const srbColor = "#d4d4d8";

  return (
    <group>
      {/* Solid rocket boosters around base */}
      {Array.from({ length: srbCount }).map((_, i) => {
        const angle = (i / srbCount) * Math.PI * 2 + Math.PI / srbCount; // offset to avoid clashing with fins
        const dist = r + srbR + 0.005;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const baseY = -totalH / 2 + srbH / 2;
        return (
          <group key={i} position={[x, baseY, z]}>
            {/* SRB cylinder body */}
            <mesh>
              <cylinderGeometry args={[srbR, srbR, srbH * 0.88, 24]} />
              <meshStandardMaterial color={srbColor} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* SRB nose cone */}
            <mesh position={[0, srbH * 0.55, 0]}>
              <coneGeometry args={[srbR, srbH * 0.18, 20]} />
              <meshStandardMaterial color={srbColor} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* SRB engine bell */}
            <mesh position={[0, -srbH * 0.46, 0]}>
              <cylinderGeometry args={[srbR * 0.85, srbR * 0.95, srbH * 0.05, 20]} />
              <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
      {/* Core stack */}
      <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} />
    </group>
  );
}

// ===== Shape: Starship/Super Heavy =====
function StarshipShape({ r, totalH, accentColor }: { r: number; totalH: number; accentColor: string }) {
  // Starship: super fat tube. Booster ~70% height, hot stage ring, then ship ~30% height with fins
  // Make r slightly larger to look fat
  const wide = r * 1.6;
  const sH = {
    engine: totalH * 0.04,
    booster: totalH * 0.55,
    hotStage: totalH * 0.025,
    ship: totalH * 0.32,
    nose: totalH * 0.065,
  };
  let y = -totalH / 2;
  const place = (h: number) => { const c = y + h / 2; y += h; return c; };
  const yEng = place(sH.engine);
  const yBoost = place(sH.booster);
  const yHot = place(sH.hotStage);
  const yShip = place(sH.ship);
  const yNose = place(sH.nose);

  const stainless = "#cbd5e1";

  return (
    <group>
      {/* Engine cluster (33 engines suggestion) */}
      <mesh position={[0, yEng, 0]}>
        <cylinderGeometry args={[wide, wide * 1.05, sH.engine, 32]} />
        <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Super Heavy booster */}
      <mesh position={[0, yBoost, 0]}>
        <cylinderGeometry args={[wide, wide, sH.booster, 48]} />
        <meshStandardMaterial color={stainless} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Accent ring */}
      <mesh position={[0, yBoost + sH.booster * 0.45, 0]}>
        <cylinderGeometry args={[wide * 1.005, wide * 1.005, sH.booster * 0.04, 48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>
      {/* Grid fins on booster (4) */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const fW = wide * 0.55;
        const fH = sH.booster * 0.07;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * (wide + fW / 2 - 0.01), yBoost + sH.booster * 0.4, Math.sin(angle) * (wide + fW / 2 - 0.01)]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[fW, fH, wide * 0.04]} />
            <meshStandardMaterial color="#1f1f23" metalness={0.6} roughness={0.4} />
          </mesh>
        );
      })}
      {/* Hot stage ring */}
      <mesh position={[0, yHot, 0]}>
        <cylinderGeometry args={[wide, wide, sH.hotStage, 48]} />
        <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Starship body */}
      <mesh position={[0, yShip, 0]}>
        <cylinderGeometry args={[wide, wide, sH.ship, 48]} />
        <meshStandardMaterial color={stainless} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Starship nose (rounded curve) */}
      <mesh position={[0, yNose, 0]}>
        <coneGeometry args={[wide, sH.nose * 1.4, 32]} />
        <meshStandardMaterial color={stainless} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Starship flaps (4: 2 forward, 2 aft) */}
      {[0, Math.PI].map((angle, i) => (
        <mesh
          key={`fwd-${i}`}
          position={[Math.cos(angle) * (wide + 0.05), yShip + sH.ship * 0.35, Math.sin(angle) * (wide + 0.05)]}
          rotation={[0, angle, Math.PI / 12]}
        >
          <boxGeometry args={[wide * 0.7, sH.ship * 0.18, wide * 0.05]} />
          <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[0, Math.PI].map((angle, i) => (
        <mesh
          key={`aft-${i}`}
          position={[Math.cos(angle) * (wide + 0.05), yShip - sH.ship * 0.35, Math.sin(angle) * (wide + 0.05)]}
          rotation={[0, angle, -Math.PI / 12]}
        >
          <boxGeometry args={[wide * 0.85, sH.ship * 0.22, wide * 0.05]} />
          <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Shape: Falcon Heavy (3 cores side by side) =====
function FalconHeavyShape({ r, totalH, accentColor, body }: { r: number; totalH: number; accentColor: string; body: string }) {
  const sideR = r * 0.7; // side cores slightly smaller relative scale visually
  const sideHRatio = 0.62; // side cores reach ~62% of total height (no upper stage)

  return (
    <group>
      {/* Side core left */}
      <group position={[-(r + sideR) * 0.95, -totalH * 0.5 * (1 - sideHRatio), 0]} scale={[1, sideHRatio, 1]}>
        <SingleStick r={sideR} totalH={totalH} accentColor={accentColor} body={body} />
      </group>
      {/* Side core right */}
      <group position={[(r + sideR) * 0.95, -totalH * 0.5 * (1 - sideHRatio), 0]} scale={[1, sideHRatio, 1]}>
        <SingleStick r={sideR} totalH={totalH} accentColor={accentColor} body={body} />
      </group>
      {/* Center core (full) */}
      <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} />
    </group>
  );
}

// ===== Dispatcher =====
function Rocket({ length, diameter, accentColor = "#38bdf8", shape }: CommonProps) {
  const { r, totalH } = useMemo(() => {
    const TARGET_HEIGHT = 4.2;
    const safeLen = length && length > 0 ? length : 60;
    const safeDia = diameter && diameter > 0 ? diameter : 3.5;
    const ratio = Math.min(0.18, Math.max(0.035, safeDia / safeLen));
    return {
      r: (TARGET_HEIGHT * ratio) / 2,
      totalH: TARGET_HEIGHT,
    };
  }, [length, diameter]);

  const body = bodyColor(shape);
  const type = shape?.type ?? "single";

  switch (type) {
    case "soyuz":
      return <SoyuzShape r={r} totalH={totalH} accentColor={accentColor} body={body} srbCount={shape?.srbCount} />;
    case "srb":
      return <SrbShape r={r} totalH={totalH} accentColor={accentColor} body={body} srbCount={shape?.srbCount} />;
    case "starship":
      return <StarshipShape r={r} totalH={totalH} accentColor={accentColor} />;
    case "falcon-heavy":
      return <FalconHeavyShape r={r} totalH={totalH} accentColor={accentColor} body={body} />;
    default:
      return <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} />;
  }
}

// ===== Scene wrapper with auto-rotate =====
function SceneContent(props: CommonProps & { isHovering: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current && !props.isHovering) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });
  return (
    <group ref={groupRef}>
      <Rocket {...props} />
    </group>
  );
}

// ===== Public component =====
export interface RocketModelProps extends CommonProps {
  className?: string;
}

export function RocketModel({
  length,
  diameter,
  accentColor = "#38bdf8",
  shape,
  className = "",
}: RocketModelProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={className}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
    >
      <Canvas
        camera={{ position: [3.6, 0.8, 3.6], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[6, 8, 4]} intensity={1.2} />
          <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#7dd3fc" />
          <SceneContent
            length={length}
            diameter={diameter}
            accentColor={accentColor}
            shape={shape}
            isHovering={isHovering}
          />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.85}
            rotateSpeed={0.6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
