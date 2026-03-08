import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

/* ---- Atmosphere halo ---- */
function Atmosphere() {
  const meshRef = useRef<THREE.Mesh>(null);

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

  return <Sphere ref={meshRef} args={[1.18, 64, 64]} material={material} />;
}

/* ---- Globe mesh ---- */
function EarthGlobe({ activeLayer }: { activeLayer: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  // Layer colors mapped to overlay tint
  const layerColors: Record<string, THREE.Color> = {
    "forest": new THREE.Color(0.1, 0.7, 0.2),
    "ocean":  new THREE.Color(0.0, 0.5, 1.0),
    "ice":    new THREE.Color(0.7, 0.9, 1.0),
    "co2":    new THREE.Color(0.9, 0.5, 0.1),
    "heat":   new THREE.Color(1.0, 0.2, 0.1),
    "soil":   new THREE.Color(0.6, 0.4, 0.1),
    "none":   new THREE.Color(0.08, 0.45, 0.6),
  };

  const globeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time:        { value: 0 },
        layerColor:  { value: layerColors[activeLayer] || layerColors["none"] },
        layerIntensity: { value: activeLayer !== "none" ? 0.35 : 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 layerColor;
        uniform float layerIntensity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                     mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
        }

        void main() {
          // Base ocean deep blue
          vec3 oceanColor = vec3(0.02, 0.18, 0.35);
          // Land continents
          vec3 landColor  = vec3(0.12, 0.32, 0.18);
          // Poles
          vec3 iceColor   = vec3(0.80, 0.92, 0.98);

          // Simple procedural continent mask
          float n1 = noise(vUv * 5.0 + vec2(time * 0.005));
          float n2 = noise(vUv * 12.0 + vec2(0.3));
          float land = smoothstep(0.42, 0.56, n1 * 0.7 + n2 * 0.3);

          // Pole fade
          float pole = smoothstep(0.7, 0.95, abs(vUv.y - 0.5) * 2.0);

          vec3 col = mix(oceanColor, landColor, land);
          col = mix(col, iceColor, pole);

          // Ocean shimmer
          float shimmer = noise(vUv * 30.0 + vec2(time * 0.02)) * 0.05 * (1.0 - land);
          col += shimmer;

          // Layer overlay tint
          col = mix(col, layerColor, layerIntensity * (0.5 + 0.5 * noise(vUv * 8.0)));

          // Rim lighting
          float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.5);
          col += vec3(0.02, 0.25, 0.35) * rim * 0.6;

          // Specular on ocean
          float spec = pow(max(dot(vNormal, normalize(vec3(0.5, 0.8, 1.0))), 0.0), 32.0);
          col += vec3(0.1, 0.4, 0.6) * spec * (1.0 - land) * 0.5;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.06;
      (globeMaterial.uniforms.time as THREE.IUniform).value = clock.getElapsedTime();
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });

  const cloudMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
          float noise(vec2 p){
            vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
          }
          void main(){
            float n = noise(vUv*6.0 + vec2(time*0.01,0));
            float n2 = noise(vUv*14.0 + vec2(time*0.008));
            float clouds = smoothstep(0.52,0.72, n*0.6+n2*0.4);
            gl_FragColor = vec4(0.9,0.95,1.0, clouds * 0.55);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    (cloudMaterial.uniforms.time as THREE.IUniform).value = clock.getElapsedTime();
  });

  return (
    <group>
      <Sphere ref={meshRef} args={[1, 96, 96]} material={globeMaterial} />
      <Sphere ref={cloudRef} args={[1.02, 64, 64]} material={cloudMaterial} />
      <Atmosphere />
    </group>
  );
}

/* ---- Grid rings (orbital decorations) ---- */
function OrbitalRings() {
  const ringRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.03;
      ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
    }
  });

  return (
    <group ref={ringRef}>
      {[1.55, 1.75, 1.95].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, 0, 0]}>
          <torusGeometry args={[r, 0.002, 4, 128]} />
          <meshBasicMaterial color={new THREE.Color(0.05, 0.5, 0.6)} transparent opacity={0.3 - i * 0.08} />
        </mesh>
      ))}
    </group>
  );
}

/* ---- Main export ---- */
interface PlanetaryGlobeProps {
  activeLayer: string;
}

export default function PlanetaryGlobe({ activeLayer }: PlanetaryGlobeProps) {
  return (
    <div className="relative w-full h-full">
      {/* Background glow */}
      <div className="absolute inset-0 bg-globe-glow" />

      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#b0e8ff" />
        <directionalLight position={[-5, -3, -2]} intensity={0.3} color="#001a2e" />

        <Stars radius={120} depth={60} count={3000} factor={3} saturation={0.1} fade />
        <EarthGlobe activeLayer={activeLayer} />
        <OrbitalRings />
      </Canvas>

      {/* Corner decorations */}
      <div className="absolute top-3 left-3 font-data text-[10px] text-primary/40 tracking-widest">
        LAT 00°00′N · LON 000°00′E
      </div>
      <div className="absolute top-3 right-3 font-data text-[10px] text-primary/40 tracking-widest">
        ALT 36,000 KM
      </div>
      <div className="absolute bottom-3 left-3 font-data text-[10px] text-primary/40 tracking-widest">
        PROJ: ORTHOGRAPHIC
      </div>
      <div className="absolute bottom-3 right-3 font-data text-[10px] text-primary/40 tracking-widest animate-pulse-dot">
        ● LIVE FEED
      </div>
    </div>
  );
}
