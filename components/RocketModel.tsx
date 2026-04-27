"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { useMemo, useRef, useState, Suspense } from "react";
import {
  Box3,
  Mesh,
  MeshStandardMaterial,
  Vector2,
  Vector3,
  type Group,
} from "three";
import type { ShapeSpec } from "@/lib/rocketShape";

const TARGET_HEIGHT = 4.2;
const GROUND_Y = -TARGET_HEIGHT / 2;

interface CommonProps {
  length?: number | null;
  diameter?: number | null;
  accentColor?: string;
  shape?: ShapeSpec;
  gltfUrl?: string;
  /** Allow scroll-wheel zoom on OrbitControls. Default false. */
  enableZoom?: boolean;
}

function bodyColor(shape?: ShapeSpec): string {
  return shape?.bodyColor ?? "#e5e7eb";
}

// ===== Hover-aware part wrapper with tooltip =====
function Part({
  name,
  position,
  children,
}: {
  name: string;
  position: [number, number, number];
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {hovered && (
        <Html
          center
          distanceFactor={5.5}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div className="px-2.5 py-1 rounded-md bg-zinc-900/95 text-sky-100 text-[11px] font-mono uppercase tracking-wider whitespace-nowrap shadow-xl shadow-black/60 ring-1 ring-sky-400/60">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ===== Curved engine bell via lathe =====
function bellPoints(throatR: number, exitR: number, height: number, segments = 14): Vector2[] {
  // Profile: starts narrow (throat), expands with bell curve to exit radius.
  // y goes from 0 (top of bell, throat) downward to -height (exit).
  const pts: Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Power-curve gives a real-rocket-bell silhouette
    const r = throatR + (exitR - throatR) * Math.pow(t, 0.55);
    const y = -height * t;
    pts.push(new Vector2(r, y));
  }
  return pts;
}

function EngineBell({
  exitR,
  height,
  color = "#0a0a0c",
}: {
  exitR: number;
  height: number;
  color?: string;
}) {
  const points = useMemo(
    () => bellPoints(exitR * 0.42, exitR, height),
    [exitR, height]
  );
  return (
    <mesh>
      <latheGeometry args={[points, 22]} />
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.55}
        side={2}
      />
    </mesh>
  );
}

// ===== Engine cluster layouts =====
function clusterPositions(count: number, totalR: number): [number, number, number][] {
  if (count <= 1) return [[0, 0, 0]];
  if (count <= 9) {
    // Octaweb: 1 center + (count-1) ring (Falcon 9 = 9)
    const arr: [number, number, number][] = [[0, 0, 0]];
    const ringCount = count - 1;
    const ringR = totalR * 0.68;
    for (let i = 0; i < ringCount; i++) {
      const a = (i / ringCount) * Math.PI * 2;
      arr.push([Math.cos(a) * ringR, 0, Math.sin(a) * ringR]);
    }
    return arr;
  }
  if (count >= 27) {
    // Starship Super Heavy 33: 3 center + 10 inner + 20 outer
    const arr: [number, number, number][] = [];
    const center = Math.min(3, count);
    for (let i = 0; i < center; i++) {
      const a = (i / center) * Math.PI * 2 + Math.PI / 6;
      arr.push([Math.cos(a) * totalR * 0.16, 0, Math.sin(a) * totalR * 0.16]);
    }
    let remaining = count - center;
    const inner = Math.min(10, remaining);
    for (let i = 0; i < inner; i++) {
      const a = (i / inner) * Math.PI * 2;
      arr.push([Math.cos(a) * totalR * 0.48, 0, Math.sin(a) * totalR * 0.48]);
    }
    remaining -= inner;
    const outer = remaining;
    for (let i = 0; i < outer; i++) {
      const a = (i / outer) * Math.PI * 2 + Math.PI / outer;
      arr.push([Math.cos(a) * totalR * 0.83, 0, Math.sin(a) * totalR * 0.83]);
    }
    return arr;
  }
  // Generic single ring
  const arr: [number, number, number][] = [];
  const rR = totalR * 0.72;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    arr.push([Math.cos(a) * rR, 0, Math.sin(a) * rR]);
  }
  return arr;
}

function EngineCluster({
  count,
  totalR,
  bellHeight,
}: {
  count: number;
  totalR: number;
  bellHeight: number;
}) {
  const positions = useMemo(
    () => clusterPositions(count, totalR),
    [count, totalR]
  );
  // Bell radius scales down with count to fit
  const bellR = useMemo(() => {
    if (count <= 1) return totalR * 0.7;
    if (count <= 9) return totalR * 0.22;
    if (count >= 27) return totalR * 0.085;
    return totalR * (0.6 / Math.sqrt(count));
  }, [count, totalR]);

  return (
    <>
      {/* Engine block / heat shield (the housing the bells stick out of) */}
      <mesh position={[0, bellHeight * 0.05, 0]}>
        <cylinderGeometry args={[totalR, totalR * 1.04, bellHeight * 0.18, 48]} />
        <meshStandardMaterial color="#1a1a1d" metalness={0.85} roughness={0.42} />
      </mesh>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <EngineBell exitR={bellR} height={bellHeight} />
        </group>
      ))}
    </>
  );
}

// ===== Segmented cylinder with panel lines =====
function SegmentedCylinder({
  r,
  h,
  segments = 4,
  color,
  metalness = 0.78,
  roughness = 0.3,
}: {
  r: number;
  h: number;
  segments?: number;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  const segH = h / segments;
  const gap = Math.min(0.012, segH * 0.04);
  return (
    <group>
      {Array.from({ length: segments }).map((_, i) => {
        const yCenter = -h / 2 + segH * i + segH / 2;
        return (
          <mesh key={i} position={[0, yCenter, 0]}>
            <cylinderGeometry args={[r, r, segH - gap, 56]} />
            <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
          </mesh>
        );
      })}
      {/* Dark interstice rings */}
      {Array.from({ length: segments - 1 }).map((_, i) => {
        const y = -h / 2 + segH * (i + 1);
        return (
          <mesh key={`gap-${i}`} position={[0, y, 0]}>
            <cylinderGeometry args={[r * 1.001, r * 1.001, gap, 56]} />
            <meshStandardMaterial color="#18181b" metalness={0.4} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

// ===== Curved fairing (parabolic via lathe) =====
function CurvedFairing({
  baseR,
  topR,
  height,
  color,
  metalness = 0.78,
  roughness = 0.3,
}: {
  baseR: number;
  topR: number;
  height: number;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  const points = useMemo(() => {
    const pts: Vector2[] = [];
    const seg = 14;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      // Parabolic-ish: starts at baseR, narrows to topR with smooth curve
      const r = baseR - (baseR - topR) * Math.pow(t, 1.6);
      const y = -height / 2 + height * t;
      pts.push(new Vector2(r, y));
    }
    return pts;
  }, [baseR, topR, height]);
  return (
    <mesh>
      <latheGeometry args={[points, 48]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

// ===== Curved nose cone =====
function CurvedNose({
  baseR,
  height,
  color,
  metalness = 0.78,
  roughness = 0.3,
}: {
  baseR: number;
  height: number;
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  const points = useMemo(() => {
    const pts: Vector2[] = [];
    const seg = 14;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      // Ogive curve
      const r = baseR * Math.cos((t * Math.PI) / 2);
      const y = -height / 2 + height * t;
      pts.push(new Vector2(r, y));
    }
    return pts;
  }, [baseR, height]);
  return (
    <mesh>
      <latheGeometry args={[points, 48]} />
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

// ===== Shape: Single stick (Falcon 9 / Electron / Long March family) =====
function SingleStick({
  r,
  totalH,
  accentColor,
  body,
  engineCount = 9,
  partPrefix = "",
}: {
  r: number;
  totalH: number;
  accentColor: string;
  body: string;
  engineCount?: number;
  partPrefix?: string;
}) {
  const sH = {
    engine: totalH * 0.05,
    firstStage: totalH * 0.54,
    interstage: totalH * 0.025,
    upperStage: totalH * 0.21,
    fairing: totalH * 0.105,
    nose: totalH * 0.07,
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
  const yFins = yFirst - sH.firstStage * 0.43;

  const px = (s: string) => (partPrefix ? `${partPrefix} · ${s}` : s);
  const engineLabel = engineCount > 1 ? `${engineCount} × 엔진` : "엔진";

  return (
    <group>
      <Part name={px(engineLabel)} position={[0, yEng, 0]}>
        <EngineCluster count={engineCount} totalR={r} bellHeight={sH.engine * 0.95} />
      </Part>

      <Part name={px("1단")} position={[0, yFirst, 0]}>
        <SegmentedCylinder r={r} h={sH.firstStage} segments={5} color={body} />
        <mesh position={[0, sH.firstStage * 0.32, 0]}>
          <cylinderGeometry args={[r * 1.004, r * 1.004, sH.firstStage * 0.05, 56]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} metalness={0.2} roughness={0.4} />
        </mesh>
      </Part>

      <Part name={px("그리드 핀")} position={[0, yFins, 0]}>
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2;
          const fW = r * 0.85;
          const fH = sH.firstStage * 0.1;
          const fT = r * 0.05;
          const dist = r + fW / 2 - 0.01;
          return (
            <group key={i} position={[Math.cos(angle) * dist, 0, Math.sin(angle) * dist]} rotation={[0, angle, 0]}>
              <mesh>
                <boxGeometry args={[fW, fH, fT]} />
                <meshStandardMaterial color="#1a1a1d" metalness={0.7} roughness={0.4} />
              </mesh>
              {/* Inner grid lattice — purely visual cross pattern */}
              {[0.3, -0.3].map((ox, j) => (
                <mesh key={j} position={[ox * fW, 0, 0]}>
                  <boxGeometry args={[fT * 0.6, fH * 0.92, fT * 1.2]} />
                  <meshStandardMaterial color="#0a0a0c" metalness={0.6} roughness={0.5} />
                </mesh>
              ))}
            </group>
          );
        })}
      </Part>

      <Part name={px("인터스테이지")} position={[0, yInter, 0]}>
        <mesh>
          <cylinderGeometry args={[rUpper, r, sH.interstage, 48]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.7} roughness={0.42} />
        </mesh>
      </Part>

      <Part name={px("2단")} position={[0, yUpper, 0]}>
        <SegmentedCylinder r={rUpper} h={sH.upperStage} segments={3} color={body} />
      </Part>

      <Part name={px("페어링")} position={[0, yFair, 0]}>
        <CurvedFairing baseR={rUpper} topR={rUpper * 0.5} height={sH.fairing} color={body} />
      </Part>

      <Part name={px("노즈콘")} position={[0, yNose, 0]}>
        <CurvedNose baseR={rUpper * 0.5} height={sH.nose} color={body} />
      </Part>
    </group>
  );
}

// ===== Shape: Soyuz =====
function SoyuzShape({
  r, totalH, accentColor, body, srbCount = 4,
}: { r: number; totalH: number; accentColor: string; body: string; srbCount?: number }) {
  const coreR = r * 0.85;
  const boosterR = r * 0.55;
  const boosterH = totalH * 0.36;

  const yBase = -totalH / 2;
  const sH = {
    engine: totalH * 0.05,
    firstStage: totalH * 0.54,
    interstage: totalH * 0.02,
    upperStage: totalH * 0.21,
    fairing: totalH * 0.105,
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
      {Array.from({ length: srbCount }).map((_, i) => {
        const angle = (i / srbCount) * Math.PI * 2;
        const dist = coreR + boosterR + 0.005;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const boosterCenterY = yBase + boosterH / 2;
        return (
          <Part key={i} name="스트랩온 부스터" position={[x, boosterCenterY, z]}>
            {/* Tapered body */}
            <mesh>
              <cylinderGeometry args={[boosterR * 0.3, boosterR, boosterH * 0.78, 24]} />
              <meshStandardMaterial color={body} metalness={0.78} roughness={0.3} />
            </mesh>
            <mesh position={[0, boosterH * 0.5, 0]}>
              <coneGeometry args={[boosterR * 0.3, boosterH * 0.22, 20]} />
              <meshStandardMaterial color={body} metalness={0.78} roughness={0.3} />
            </mesh>
            {/* Single engine bell at base */}
            <group position={[0, -boosterH * 0.42, 0]}>
              <EngineBell exitR={boosterR * 0.7} height={boosterH * 0.09} />
            </group>
          </Part>
        );
      })}

      <Part name="코어 엔진 (1 × RD-108A)" position={[0, yEng, 0]}>
        <EngineCluster count={1} totalR={coreR} bellHeight={sH.engine * 0.95} />
      </Part>

      <Part name="코어 1단" position={[0, yFirst, 0]}>
        <SegmentedCylinder r={coreR} h={sH.firstStage} segments={5} color={body} />
        <mesh position={[0, sH.firstStage * 0.4, 0]}>
          <cylinderGeometry args={[coreR * 1.004, coreR * 1.004, sH.firstStage * 0.05, 56]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
        </mesh>
      </Part>

      <Part name="인터스테이지" position={[0, yInter, 0]}>
        <mesh>
          <cylinderGeometry args={[coreR * 0.85, coreR, sH.interstage, 48]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.7} roughness={0.42} />
        </mesh>
      </Part>

      <Part name="2단" position={[0, yUpper, 0]}>
        <SegmentedCylinder r={coreR * 0.85} h={sH.upperStage} segments={3} color={body} />
      </Part>

      <Part name="페어링" position={[0, yFair, 0]}>
        <CurvedFairing baseR={coreR * 0.85} topR={coreR * 0.45} height={sH.fairing} color={body} />
      </Part>

      <Part name="노즈콘" position={[0, yNose, 0]}>
        <CurvedNose baseR={coreR * 0.45} height={sH.nose} color={body} />
      </Part>
    </group>
  );
}

// ===== Shape: SRB strap-ons + core =====
function SrbShape({
  r, totalH, accentColor, body, srbCount = 0, engineCount = 1,
}: { r: number; totalH: number; accentColor: string; body: string; srbCount?: number; engineCount?: number }) {
  if (srbCount === 0) {
    return <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} engineCount={engineCount} />;
  }
  const srbR = r * 0.45;
  const srbH = totalH * 0.55;

  return (
    <group>
      {Array.from({ length: srbCount }).map((_, i) => {
        const angle = (i / srbCount) * Math.PI * 2 + Math.PI / srbCount;
        const dist = r + srbR + 0.005;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const baseY = -totalH / 2 + srbH / 2;
        return (
          <Part key={i} name="고체 부스터 (SRB)" position={[x, baseY, z]}>
            <SegmentedCylinder r={srbR} h={srbH * 0.88} segments={3} color="#d4d4d8" metalness={0.55} roughness={0.45} />
            <mesh position={[0, srbH * 0.55, 0]}>
              <coneGeometry args={[srbR, srbH * 0.18, 20]} />
              <meshStandardMaterial color="#d4d4d8" metalness={0.55} roughness={0.45} />
            </mesh>
            <group position={[0, -srbH * 0.46, 0]}>
              <EngineBell exitR={srbR * 0.85} height={srbH * 0.08} />
            </group>
          </Part>
        );
      })}
      <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} engineCount={engineCount} />
    </group>
  );
}

// ===== Shape: Starship/Super Heavy =====
function StarshipShape({
  r, totalH, accentColor, engineCount = 33,
}: { r: number; totalH: number; accentColor: string; engineCount?: number }) {
  const wide = r * 1.6;
  const sH = {
    engine: totalH * 0.05,
    booster: totalH * 0.52,
    hotStage: totalH * 0.025,
    ship: totalH * 0.32,
    nose: totalH * 0.085,
  };
  let y = -totalH / 2;
  const place = (h: number) => { const c = y + h / 2; y += h; return c; };
  const yEng = place(sH.engine);
  const yBoost = place(sH.booster);
  const yHot = place(sH.hotStage);
  const yShip = place(sH.ship);
  const yNose = place(sH.nose);
  const yFins = yBoost + sH.booster * 0.4;

  const stainless = "#cbd5e1";

  return (
    <group>
      <Part name={`${engineCount} × Raptor 엔진`} position={[0, yEng, 0]}>
        <EngineCluster count={engineCount} totalR={wide} bellHeight={sH.engine * 0.95} />
      </Part>

      <Part name="Super Heavy 부스터" position={[0, yBoost, 0]}>
        <SegmentedCylinder r={wide} h={sH.booster} segments={6} color={stainless} metalness={0.92} roughness={0.18} />
        <mesh position={[0, sH.booster * 0.45, 0]}>
          <cylinderGeometry args={[wide * 1.005, wide * 1.005, sH.booster * 0.04, 56]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.55} />
        </mesh>
      </Part>

      <Part name="그리드 핀" position={[0, yFins, 0]}>
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i / 4) * Math.PI * 2;
          const fW = wide * 0.55;
          const fH = sH.booster * 0.07;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * (wide + fW / 2 - 0.01), 0, Math.sin(angle) * (wide + fW / 2 - 0.01)]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[fW, fH, wide * 0.04]} />
              <meshStandardMaterial color="#1a1a1d" metalness={0.7} roughness={0.4} />
            </mesh>
          );
        })}
      </Part>

      <Part name="핫스테이지 링" position={[0, yHot, 0]}>
        <mesh>
          <cylinderGeometry args={[wide, wide, sH.hotStage, 48]} />
          <meshStandardMaterial color="#52525b" metalness={0.7} roughness={0.42} />
        </mesh>
      </Part>

      <Part name="Starship 본체" position={[0, yShip, 0]}>
        <SegmentedCylinder r={wide} h={sH.ship} segments={4} color={stainless} metalness={0.92} roughness={0.18} />
        {[0, Math.PI].map((angle, i) => (
          <mesh
            key={`fwd-${i}`}
            position={[Math.cos(angle) * (wide + 0.05), sH.ship * 0.35, Math.sin(angle) * (wide + 0.05)]}
            rotation={[0, angle, Math.PI / 12]}
          >
            <boxGeometry args={[wide * 0.7, sH.ship * 0.18, wide * 0.05]} />
            <meshStandardMaterial color="#52525b" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        {[0, Math.PI].map((angle, i) => (
          <mesh
            key={`aft-${i}`}
            position={[Math.cos(angle) * (wide + 0.05), -sH.ship * 0.35, Math.sin(angle) * (wide + 0.05)]}
            rotation={[0, angle, -Math.PI / 12]}
          >
            <boxGeometry args={[wide * 0.85, sH.ship * 0.22, wide * 0.05]} />
            <meshStandardMaterial color="#52525b" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
      </Part>

      <Part name="노즈콘" position={[0, yNose, 0]}>
        <CurvedNose baseR={wide} height={sH.nose * 1.4} color={stainless} metalness={0.92} roughness={0.18} />
      </Part>
    </group>
  );
}

// ===== Shape: Falcon Heavy =====
function FalconHeavyShape({
  r, totalH, accentColor, body,
}: { r: number; totalH: number; accentColor: string; body: string }) {
  const sideR = r * 0.7;
  const sideHRatio = 0.62;

  return (
    <group>
      <group position={[-(r + sideR) * 0.95, -totalH * 0.5 * (1 - sideHRatio), 0]} scale={[1, sideHRatio, 1]}>
        <SingleStick r={sideR} totalH={totalH} accentColor={accentColor} body={body} engineCount={9} partPrefix="좌측 부스터" />
      </group>
      <group position={[(r + sideR) * 0.95, -totalH * 0.5 * (1 - sideHRatio), 0]} scale={[1, sideHRatio, 1]}>
        <SingleStick r={sideR} totalH={totalH} accentColor={accentColor} body={body} engineCount={9} partPrefix="우측 부스터" />
      </group>
      <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} engineCount={9} partPrefix="센터 코어" />
    </group>
  );
}

// ===== GLTF loader =====
function GltfRocket({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const fitted = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((o) => {
      const mesh = o as Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material;
        const apply = (m: MeshStandardMaterial) => {
          m.metalness = Math.max(m.metalness ?? 0, 0.85);
          m.roughness = Math.min(m.roughness ?? 1, 0.28);
          m.envMapIntensity = 1.1;
        };
        if (Array.isArray(mat)) {
          mat.forEach((m) => { if (m instanceof MeshStandardMaterial) apply(m); });
        } else if (mat instanceof MeshStandardMaterial) {
          apply(mat);
        }
      }
    });
    const box = new Box3().setFromObject(cloned);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = TARGET_HEIGHT / Math.max(size.y, 0.0001);
    return { obj: cloned, scale, offset: center.multiplyScalar(-scale) };
  }, [scene]);

  return (
    <Part name="외부 모델" position={[0, 0, 0]}>
      <primitive
        object={fitted.obj}
        scale={fitted.scale}
        position={[fitted.offset.x, fitted.offset.y, fitted.offset.z]}
      />
    </Part>
  );
}

// ===== Dispatcher =====
function Rocket({ length, diameter, accentColor = "#38bdf8", shape, gltfUrl }: CommonProps) {
  const { r, totalH } = useMemo(() => {
    const safeLen = length && length > 0 ? length : 60;
    const safeDia = diameter && diameter > 0 ? diameter : 3.5;
    const ratio = Math.min(0.18, Math.max(0.035, safeDia / safeLen));
    return {
      r: (TARGET_HEIGHT * ratio) / 2,
      totalH: TARGET_HEIGHT,
    };
  }, [length, diameter]);

  if (gltfUrl) {
    return <GltfRocket url={gltfUrl} />;
  }

  const body = bodyColor(shape);
  const type = shape?.type ?? "single";
  const engineCount = shape?.engineCount;

  switch (type) {
    case "soyuz":
      return <SoyuzShape r={r} totalH={totalH} accentColor={accentColor} body={body} srbCount={shape?.srbCount} />;
    case "srb":
      return <SrbShape r={r} totalH={totalH} accentColor={accentColor} body={body} srbCount={shape?.srbCount} engineCount={engineCount ?? 1} />;
    case "starship":
      return <StarshipShape r={r} totalH={totalH} accentColor={accentColor} engineCount={engineCount ?? 33} />;
    case "falcon-heavy":
      return <FalconHeavyShape r={r} totalH={totalH} accentColor={accentColor} body={body} />;
    default:
      return <SingleStick r={r} totalH={totalH} accentColor={accentColor} body={body} engineCount={engineCount ?? 9} />;
  }
}

// ===== Scene with auto-rotate =====
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
  envPreset?: "apartment" | "city" | "dawn" | "forest" | "lobby" | "night" | "park" | "studio" | "sunset" | "warehouse";
}

export function RocketModel({
  length,
  diameter,
  accentColor = "#38bdf8",
  shape,
  gltfUrl,
  enableZoom = false,
  className = "",
  envPreset = "warehouse",
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
          <ambientLight intensity={0.18} />
          <directionalLight position={[6, 8, 4]} intensity={0.6} />
          <directionalLight position={[-4, 2, -3]} intensity={0.2} color="#7dd3fc" />

          <Environment preset={envPreset} background={false} environmentIntensity={0.85} />

          <SceneContent
            length={length}
            diameter={diameter}
            accentColor={accentColor}
            shape={shape}
            gltfUrl={gltfUrl}
            isHovering={isHovering}
          />

          <ContactShadows
            position={[0, GROUND_Y - 0.02, 0]}
            opacity={0.55}
            scale={6}
            blur={2.4}
            far={3}
            resolution={1024}
            color="#000000"
          />

          <OrbitControls
            enableZoom={enableZoom}
            enablePan={false}
            minDistance={2.2}
            maxDistance={12}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.85}
            rotateSpeed={0.6}
            zoomSpeed={0.8}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
