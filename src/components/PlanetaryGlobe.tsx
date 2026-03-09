import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { GlobeTouchRaycaster, GlobeRegionPopup } from "./GlobeTouchPopup";

/* ---- Atmosphere halo ---- */
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(0.05, 0.85, 0.95, 1.0) * intensity;
          }
        `,
        side: THREE.FrontSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[1.18, 64, 64]} />
    </mesh>
  );
}

/* ---- Pulsing highlight ring at a lat/lon ---- */
function RegionHighlight({ lat, lon }: { lat: number; lon: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringMat = useRef(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.1, 1.0, 0.3),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    })
  );

  // Convert lat/lon to 3D position on globe surface
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = 1.02;
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1.0 + 0.4 * Math.sin(t * 3.0);
      groupRef.current.scale.setScalar(scale);
      ringMat.current.opacity = 0.5 + 0.3 * Math.sin(t * 3.0);
    }
  });

  // Orient ring to face outward from globe center
  const normal   = new THREE.Vector3(x, y, z).normalize();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

  return (
    <group ref={groupRef} position={[x, y, z]} quaternion={quaternion}>
      <mesh material={ringMat.current}>
        <torusGeometry args={[0.06, 0.008, 8, 64]} />
      </mesh>
      {/* Inner dot */}
      <mesh>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color={new THREE.Color(0.2, 1.0, 0.4)} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/* ---- Camera zoom controller ---- */
function CameraController({ focusLat, focusLon }: { focusLat: number | null; focusLon: number | null }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 3));

  useEffect(() => {
    if (focusLat === null || focusLon === null) {
      targetRef.current.set(0, 0, 3);
    } else {
      const phi   = (90 - focusLat) * (Math.PI / 180);
      const theta = (focusLon + 180) * (Math.PI / 180);
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      // Position camera 2.4 units away in that direction
      targetRef.current.set(x * 2.4, y * 2.4, z * 2.4);
    }
  }, [focusLat, focusLon]);

  useFrame(() => {
    // Smooth lerp
    (camera as THREE.PerspectiveCamera).position.lerp(targetRef.current, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ---- Globe mesh ---- */
function EarthGlobe({
  activeLayer,
  yearOffset,
  focusLat,
  focusLon,
}: {
  activeLayer: string;
  yearOffset: number;
  focusLat: number | null;
  focusLon: number | null;
}) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const timeRef  = useRef(0);

  const layerColors: Record<string, THREE.Vector3> = {
    forest: new THREE.Vector3(0.1, 0.7, 0.2),
    ocean:  new THREE.Vector3(0.0, 0.5, 1.0),
    ice:    new THREE.Vector3(0.7, 0.9, 1.0),
    co2:    new THREE.Vector3(0.9, 0.5, 0.1),
    heat:   new THREE.Vector3(1.0, 0.2, 0.1),
    soil:   new THREE.Vector3(0.6, 0.4, 0.1),
    impact:  new THREE.Vector3(0.8, 0.3, 0.9),
    regen:   new THREE.Vector3(0.1, 0.9, 0.4),
    none:   new THREE.Vector3(0.08, 0.45, 0.6),
  };

  const isImpact = activeLayer === "impact";
  const isRegen  = activeLayer === "regen";
  const layerVec = layerColors[activeLayer] ?? layerColors["none"];

  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.layerColor.value     = layerVec;
    matRef.current.uniforms.layerIntensity.value = activeLayer !== "none" ? 0.38 : 0.0;
    matRef.current.uniforms.isImpact.value       = isImpact ? 1.0 : 0.0;
    matRef.current.uniforms.isRegen.value        = isRegen  ? 1.0 : 0.0;
    matRef.current.uniforms.yearOffset.value     = yearOffset;
  }, [activeLayer, yearOffset, layerVec, isImpact, isRegen]);

  const globeMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        time:           { value: 0 },
        layerColor:     { value: layerVec },
        layerIntensity: { value: activeLayer !== "none" ? 0.38 : 0.0 },
        isImpact:       { value: isImpact ? 1.0 : 0.0 },
        isRegen:        { value: isRegen  ? 1.0 : 0.0 },
        yearOffset:     { value: yearOffset },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float yearOffset;
        uniform vec3  layerColor;
        uniform float layerIntensity;
        uniform float isImpact;
        uniform float isRegen;
        varying vec2 vUv;
        varying vec3 vNormal;

        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
        float noise(vec2 p){
          vec2 i=floor(p); vec2 f=fract(p);
          f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                     mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }

        void main(){
          vec3 oceanColor = vec3(0.02,0.18,0.35);
          vec3 landColor  = vec3(0.12,0.32,0.18);
          vec3 iceColor   = vec3(0.80,0.92,0.98);

          float n1   = noise(vUv*5.0  + vec2(time*0.004));
          float n2   = noise(vUv*12.0 + vec2(0.3));
          float land = smoothstep(0.42,0.56, n1*0.7+n2*0.3);

          float iceExtent = 1.0 - yearOffset * 0.43;
          float pole = smoothstep(0.7*iceExtent, 0.95*iceExtent, abs(vUv.y-0.5)*2.0);

          float forestVitality = mix(1.0, 0.6, yearOffset);
          vec3 forestLand = mix(landColor, vec3(0.08,0.20,0.08), (1.0-forestVitality)*0.5);

          vec3 col = mix(oceanColor, forestLand, land);
          col      = mix(col, iceColor, pole);

          col = mix(col, vec3(0.45,0.35,0.10), yearOffset*0.05*(1.0-land));
          col += noise(vUv*30.0+vec2(time*0.02))*0.05*(1.0-land);

          float layerNoise = noise(vUv*8.0);
          col = mix(col, layerColor, layerIntensity*(0.5+0.5*layerNoise));

          if(isImpact > 0.5){
            float pulse  = 0.5+0.5*sin(time*2.0);
            float city   = smoothstep(0.62,0.72, noise(vUv*18.0+vec2(0.7)));
            float defor  = smoothstep(0.55,0.65, noise(vUv*9.0 +vec2(1.3)))*land;
            float mining = smoothstep(0.70,0.78, noise(vUv*22.0+vec2(2.1)))*land;
            float restore= smoothstep(0.75,0.82, noise(vUv*14.0+vec2(3.5)))*land;
            col = mix(col, vec3(1.0,0.4,0.05), city*0.5*pulse);
            col = mix(col, vec3(0.7,0.2,0.0),  defor*0.55);
            col = mix(col, vec3(0.5,0.4,0.1),  mining*0.45);
            col = mix(col, vec3(0.1,0.9,0.3),  restore*0.5*pulse);
          }

          if(isRegen > 0.5){
            float slowPulse = 0.5+0.5*sin(time*0.8);
            float fastPulse = 0.5+0.5*sin(time*3.0);
            float cap1 = smoothstep(0.72,0.80, noise(vUv*20.0+vec2(4.1)))*land;
            float cap2 = smoothstep(0.75,0.82, noise(vUv*25.0+vec2(5.3)))*land;
            float cap3 = smoothstep(0.78,0.85, noise(vUv*17.0+vec2(6.7)))*land;
            col = mix(col, vec3(1.0,0.85,0.0), cap1*0.7*fastPulse);
            col = mix(col, vec3(0.9,0.6,0.1),  cap2*0.5*fastPulse);
            col = mix(col, vec3(1.0,0.75,0.2), cap3*0.4*fastPulse);
            float rec1 = smoothstep(0.55,0.68, noise(vUv*11.0+vec2(4.1)))*land;
            float rec2 = smoothstep(0.58,0.70, noise(vUv*8.0 +vec2(5.3)))*land;
            float rec3 = smoothstep(0.60,0.72, noise(vUv*13.0+vec2(6.7)))*land;
            col = mix(col, vec3(0.05,0.95,0.35), rec1*0.65*slowPulse);
            col = mix(col, vec3(0.1, 0.80,0.4),  rec2*0.55*slowPulse);
            col = mix(col, vec3(0.2, 0.70,0.5),  rec3*0.45*slowPulse);
            float stress = smoothstep(0.62,0.70, noise(vUv*9.0+vec2(2.5)))*land;
            col = mix(col, vec3(0.55,0.1,0.0), stress*0.25*(1.0-slowPulse*0.5));
            float coastal = smoothstep(0.65,0.73, noise(vUv*16.0+vec2(7.9)))*(1.0-land);
            col = mix(col, vec3(0.0,0.9,0.7), coastal*0.5*slowPulse);
          }

          float rim = pow(1.0-max(dot(vNormal,vec3(0,0,1)),0.0),3.5);
          col += vec3(0.02,0.25,0.35)*rim*0.6;

          float spec = pow(max(dot(vNormal,normalize(vec3(0.5,0.8,1.0))),0.0),32.0);
          col += vec3(0.1,0.4,0.6)*spec*(1.0-land)*0.5;

          gl_FragColor = vec4(col,1.0);
        }
      `,
    });
    matRef.current = mat;
    return mat;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer]);

  const cloudMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform float time; varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
          float noise(vec2 p){
            vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
          }
          void main(){
            float n=noise(vUv*6.0+vec2(time*0.01,0));
            float n2=noise(vUv*14.0+vec2(time*0.008));
            float clouds=smoothstep(0.52,0.72,n*0.6+n2*0.4);
            gl_FragColor=vec4(0.9,0.95,1.0,clouds*0.45);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = timeRef.current * 0.06;
      (globeMaterial.uniforms.time as THREE.IUniform).value = timeRef.current;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = timeRef.current * 0.04;
      (cloudMaterial.uniforms.time as THREE.IUniform).value = timeRef.current;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} material={globeMaterial}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      <mesh ref={cloudRef} material={cloudMaterial}>
        <sphereGeometry args={[1.02, 64, 64]} />
      </mesh>
      <Atmosphere />
      {/* Region highlight ring */}
      {focusLat !== null && focusLon !== null && (
        <RegionHighlight lat={focusLat} lon={focusLon} />
      )}
    </group>
  );
}

/* ---- Orbital rings ---- */
function OrbitalRings() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.03;
      groupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
    }
  });
  return (
    <group ref={groupRef}>
      {[1.55, 1.75, 1.95].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, 0, 0]}>
          <torusGeometry args={[r, 0.002, 4, 128]} />
          <meshBasicMaterial color={new THREE.Color(0.05, 0.5, 0.6)} transparent opacity={0.3 - i * 0.08} />
        </mesh>
      ))}
    </group>
  );
}

interface PlanetaryGlobeProps {
  activeLayer: string;
  yearOffset?: number;
  focusLat?: number | null;
  focusLon?: number | null;
  focusLabel?: string | null;
}

export default function PlanetaryGlobe({
  activeLayer,
  yearOffset = 1,
  focusLat = null,
  focusLon = null,
  focusLabel = null,
}: PlanetaryGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchRegion, setTouchRegion] = useState<import("./GlobeTouchPopup").RegionData | null>(null);
  const [popupX, setPopupX] = useState(0);
  const [popupY, setPopupY] = useState(0);

  const handleGlobeHit = useCallback((region: import("./GlobeTouchPopup").RegionData, sx: number, sy: number) => {
    setTouchRegion(region);
    setPopupX(sx);
    setPopupY(sy);
  }, []);

  const handleGlobeMiss = useCallback(() => {
    setTouchRegion(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="absolute inset-0 bg-globe-glow" />
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        onPointerMissed={handleGlobeMiss}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]}   intensity={1.2} color="#b0e8ff" />
        <directionalLight position={[-5, -3, -2]} intensity={0.3} color="#001a2e" />
        <Stars radius={120} depth={60} count={3000} factor={3} saturation={0.1} fade />
        <EarthGlobe activeLayer={activeLayer} yearOffset={yearOffset} focusLat={focusLat} focusLon={focusLon} />
        <OrbitalRings />
        <CameraController focusLat={focusLat} focusLon={focusLon} />
        <GlobeTouchRaycaster onHit={handleGlobeHit} onMiss={handleGlobeMiss} />
      </Canvas>

      <div className="absolute top-3 left-3 font-data text-[10px] text-primary/40 tracking-widest">LAT 00°00′N · LON 000°00′E</div>
      <div className="absolute top-3 right-3 font-data text-[10px] text-primary/40 tracking-widest">ALT 36,000 KM</div>
      <div className="absolute bottom-3 left-3 font-data text-[10px] text-primary/40 tracking-widest">PROJ: ORTHOGRAPHIC</div>
      <div className="absolute bottom-3 right-3 font-data text-[10px] text-primary/40 tracking-widest animate-pulse-dot">● LIVE FEED</div>

      {/* Tap hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-data text-[8px] text-primary/20 tracking-widest pointer-events-none hidden md:block">
        CLICK GLOBE TO INSPECT REGION
      </div>

      {/* Region focus badge */}
      {focusLabel && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 font-data text-[9px] tracking-widest bg-healthy/15 border border-healthy/30 text-healthy rounded-sm px-3 py-1 pointer-events-none">
          ● FOCUS: {focusLabel.toUpperCase()}
        </div>
      )}

      {/* Human impact legend */}
      {activeLayer === "impact" && (
        <div className="absolute bottom-8 left-3 flex flex-col gap-1 bg-background/70 rounded px-2 py-2 border border-border/30">
          {[
            { color: "bg-orange-500",  label: "Urban Heat / Cities" },
            { color: "bg-red-700",     label: "Deforestation" },
            { color: "bg-yellow-800",  label: "Mining Zones" },
            { color: "bg-green-400",   label: "Restoration Projects" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-data text-[8px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Regenerative Finance legend */}
      {activeLayer === "regen" && (
        <div className="absolute bottom-8 left-3 flex flex-col gap-1 bg-background/70 rounded px-2 py-2 border border-border/30">
          {[
            { color: "bg-yellow-400",  label: "Capital Injection" },
            { color: "bg-amber-500",   label: "Fund Deployment" },
            { color: "bg-green-400",   label: "Forest Recovery" },
            { color: "bg-emerald-400", label: "Wetland Restoration" },
            { color: "bg-cyan-400",    label: "Blue Carbon (Ocean)" },
            { color: "bg-red-800",     label: "Residual Stress" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-data text-[8px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Touch/Click region popup */}
      <GlobeRegionPopup
        region={touchRegion}
        screenX={popupX}
        screenY={popupY}
        onClose={() => setTouchRegion(null)}
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
      />
    </div>
  );
}
