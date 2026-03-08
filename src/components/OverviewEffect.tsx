import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

/* ── Full-res Earth for the Overview Effect ── */
function OEGlobe() {
  const meshRef  = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0.3); // start small for zoom-in

  const material = useRef(
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; varying vec3 vNormal;
        void main(){
          vUv=uv; vNormal=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float time; varying vec2 vUv; varying vec3 vNormal;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        void main(){
          vec3 ocean=vec3(0.02,0.14,0.32);
          vec3 deep =vec3(0.01,0.08,0.22);
          vec3 land =vec3(0.08,0.28,0.15);
          vec3 desert=vec3(0.45,0.38,0.18);
          vec3 ice  =vec3(0.88,0.95,1.00);
          float n1=noise(vUv*5.0+vec2(time*0.002));
          float n2=noise(vUv*12.0);
          float n3=noise(vUv*22.0);
          float land_m=smoothstep(0.42,0.56,n1*0.7+n2*0.3);
          float desert_m=smoothstep(0.58,0.70,noise(vUv*7.0+vec2(2.3)))*land_m;
          float pole=smoothstep(0.72,0.96,abs(vUv.y-0.5)*2.0);
          float spec_n=noise(vUv*30.0+vec2(time*0.015));
          vec3 col=mix(mix(deep,ocean,spec_n*0.6),(land_m>0.5 ? mix(land,desert,desert_m) : ocean),land_m);
          col=mix(col,ice,pole);
          col+=spec_n*0.04*(1.0-land_m);
          // City lights in darkness
          float city=smoothstep(0.64,0.74,noise(vUv*20.0+vec2(0.9)))*land_m;
          col=mix(col,vec3(1.0,0.9,0.5),city*0.3);
          // Atmosphere rim
          float rim=pow(1.0-max(dot(vNormal,vec3(0,0,1)),0.0),3.5);
          col+=vec3(0.03,0.4,0.7)*rim*0.7;
          // Subtle CO2 haze over ocean
          col=mix(col,vec3(0.4,0.3,0.1),0.04*(1.0-land_m)*0.5);
          gl_FragColor=vec4(col,1.0);
        }
      `,
    })
  );

  const cloudMat = useRef(
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float time;varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          float n=noise(vUv*5.0+vec2(time*0.008,0));
          float n2=noise(vUv*12.0+vec2(time*0.005));
          float c=smoothstep(0.5,0.72,n*0.55+n2*0.45);
          gl_FragColor=vec4(0.92,0.96,1.0,c*0.5);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    material.current.uniforms.time.value = t;
    cloudMat.current.uniforms.time.value = t;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.04;
      // Slow zoom: scale from 0.3 → 1 over ~4s
      scaleRef.current = Math.min(1, scaleRef.current + 0.003);
      meshRef.current.scale.setScalar(scaleRef.current);
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = t * 0.025;
      cloudRef.current.scale.setScalar(scaleRef.current * 1.02);
    }
  });

  return (
    <group>
      {/* Deep space atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial color={new THREE.Color(0.02, 0.6, 0.85)} transparent opacity={0.07} side={THREE.FrontSide} />
      </mesh>
      <mesh ref={meshRef} material={material.current}>
        <sphereGeometry args={[1, 128, 128]} />
      </mesh>
      <mesh ref={cloudRef} material={cloudMat.current}>
        <sphereGeometry args={[1.02, 64, 64]} />
      </mesh>
    </group>
  );
}

/* ── Ambient particle field ── */
function AmbientParticles() {
  const ref = useRef<THREE.Points>(null);
  const geo = useRef((() => {
    const g = new THREE.BufferGeometry();
    const n = 200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 8;
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  })());

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.01;
  });

  return (
    <points ref={ref} geometry={geo.current}>
      <pointsMaterial size={0.015} color={new THREE.Color(0.2, 0.8, 1)} transparent opacity={0.5} />
    </points>
  );
}

interface OverviewEffectProps {
  active: boolean;
  onClose: () => void;
}

const QUOTES = [
  "\"From up here, you can't see any borders. You can't see any conflict. You see this beautiful, fragile oasis.\" — Ron Garan",
  "\"The Earth is a very small stage in a vast cosmic arena.\" — Carl Sagan",
  "\"We are the first generation to feel the impact of climate change and the last generation that can do something about it.\" — Barack Obama",
  "\"The Earth does not belong to us. We belong to the Earth.\" — Chief Seattle",
];

export default function OverviewEffect({ active, onClose }: OverviewEffectProps) {
  const quoteIdx = useRef(Math.floor(Math.random() * QUOTES.length));

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (active) {
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [active, handleKey]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[hsl(220_28%_3%)]"
        >
          {/* Full-screen Three.js canvas */}
          <Canvas
            camera={{ position: [0, 0, 3.2], fov: 50 }}
            gl={{ antialias: true, alpha: false }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.08} />
            <directionalLight position={[6, 4, 5]} intensity={1.4} color="#c8eeff" />
            <directionalLight position={[-4, -2, -3]} intensity={0.2} color="#001a2e" />
            <Stars radius={180} depth={80} count={6000} factor={3} saturation={0.05} fade />
            <AmbientParticles />
            <OEGlobe />
          </Canvas>

          {/* Overlay text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 1.5 }}
            className="absolute bottom-16 inset-x-0 flex flex-col items-center gap-4 px-8 pointer-events-none"
          >
            <p className="font-body text-base text-foreground/70 max-w-2xl text-center leading-relaxed italic">
              {QUOTES[quoteIdx.current]}
            </p>
            <div className="flex gap-6 font-data text-[9px] text-muted-foreground/40 tracking-widest">
              <span>TEMP ANOMALY +1.47°C</span>
              <span>CO₂ 424.5 PPM</span>
              <span>ARCTIC ICE −3.4 MKM²</span>
              <span>HEALTH INDEX 57/100</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1.2 }}
            className="absolute top-10 inset-x-0 flex flex-col items-center pointer-events-none"
          >
            <span className="font-display text-[11px] tracking-[0.4em] text-primary/60">PLANETARY PULSE · OVERVIEW EFFECT</span>
            <span className="font-data text-[9px] text-muted-foreground/30 tracking-widest mt-1">ONE PLANET · ONE SYSTEM · ONE CHANCE</span>
          </motion.div>

          {/* Escape hint */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.8 }}
            onClick={onClose}
            className="absolute top-4 right-4 font-data text-[9px] tracking-widest text-muted-foreground/40 hover:text-muted-foreground border border-muted/20 hover:border-muted/40 rounded-sm px-3 py-1.5 transition-colors bg-background/20 backdrop-blur-sm"
          >
            ESC · RETURN TO MISSION CONTROL
          </motion.button>

          {/* Scanline texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(185 100% 50%) 2px, hsl(185 100% 50%) 3px)",
              backgroundSize: "100% 3px",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
