import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

/* ── Deep-space globe for the intro ── */
function IntroGlobe() {
  const meshRef  = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  // zoom from far → close
  const zRef = useRef(8.0);

  const mat = useRef(
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
          vec3 ocean=vec3(0.02,0.12,0.30); vec3 land=vec3(0.07,0.26,0.14);
          vec3 ice=vec3(0.85,0.93,1.0);
          float n1=noise(vUv*5.0+vec2(time*0.002)); float n2=noise(vUv*12.0);
          float lm=smoothstep(0.42,0.56,n1*0.7+n2*0.3);
          float pole=smoothstep(0.72,0.96,abs(vUv.y-0.5)*2.0);
          vec3 col=mix(ocean,land,lm); col=mix(col,ice,pole);
          float city=smoothstep(0.65,0.74,noise(vUv*20.0+vec2(0.9)))*lm;
          col=mix(col,vec3(1.0,0.9,0.4),city*0.35);
          float rim=pow(1.0-max(dot(vNormal,vec3(0,0,1)),0.0),3.5);
          col+=vec3(0.02,0.35,0.65)*rim*0.8;
          gl_FragColor=vec4(col,1.0);
        }
      `,
    })
  );

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    mat.current.uniforms.time.value = t;
    if (meshRef.current) meshRef.current.rotation.y = t * 0.06;
    // Camera zoom-in: 8 → 2.8 over ~3.5s
    zRef.current = Math.max(2.8, zRef.current - 0.045);
    (camera as THREE.PerspectiveCamera).position.z = zRef.current;
  });

  return (
    <group ref={groupRef}>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[1.22, 64, 64]} />
        <meshBasicMaterial color={new THREE.Color(0.02, 0.55, 0.9)} transparent opacity={0.09} side={THREE.FrontSide} />
      </mesh>
      <mesh ref={meshRef} material={mat.current}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
    </group>
  );
}

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed = 38, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const startTimer = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [text, speed, startDelay]);

  return { displayed, done };
}

interface IntroSequenceProps {
  onComplete: () => void;
}

const STATUS_LINES = [
  "LOADING PLANETARY DATA STREAMS...",
  "CALIBRATING BIOSPHERE SENSORS...",
  "INITIALIZING TIPPING POINT DETECTOR...",
  "SYNCING REGENERATIVE CAPITAL FEEDS...",
  "ATLAS MISSION CONTROL ONLINE.",
];

export default function IntroSequence({ onComplete }: IntroSequenceProps) {
  const [visible, setVisible] = useState(true);
  const [lineIndex, setLineIndex] = useState(0);
  const [shownLines, setShownLines] = useState<string[]>([]);
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<number[]>([]);

  const skip = () => {
    timersRef.current.forEach(clearTimeout);
    setFadeOut(true);
    window.setTimeout(() => { setVisible(false); onComplete(); }, 350);
  };

  // Advance status lines on a schedule
  useEffect(() => {
    setShownLines([]);
    const delays = [400, 1000, 1600, 2200, 2700];
    const timers = delays.map((d, i) =>
      window.setTimeout(() => {
        setShownLines(prev => {
          if (prev.includes(STATUS_LINES[i])) return prev;
          return [...prev, STATUS_LINES[i]];
        });
        setLineIndex(i);
      }, d)
    );

    // Trigger fade-out at 3.6s → call onComplete at 4.4s
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 3600);
    const doneTimer = window.setTimeout(() => { setVisible(false); onComplete(); }, 4400);
    timersRef.current = [...timers, fadeTimer, doneTimer];

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  // Typewriter for the main header
  const { displayed: titleText } = useTypewriter(
    "INITIALIZING ATLAS MISSION CONTROL...",
    45,
    200
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          animate={{ opacity: fadeOut ? 0 : 1 }}
          transition={{ duration: fadeOut ? 0.8 : 0 }}
        >
          {/* Deep-space 3D globe */}
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0, 8], fov: 45 }}
              gl={{ antialias: true, alpha: false }}
              style={{ background: "hsl(220 28% 3%)" }}
            >
              <ambientLight intensity={0.06} />
              <directionalLight position={[6, 4, 5]} intensity={1.3} color="#c0e8ff" />
              <Stars radius={200} depth={100} count={5000} factor={3} saturation={0.05} fade />
              <IntroGlobe />
            </Canvas>
          </div>

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(185 100% 50%) 2px, hsl(185 100% 50%) 3px)",
              backgroundSize: "100% 3px",
            }}
          />

          {/* Main overlay content */}
          <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-2xl text-center pointer-events-none">

            {/* ATLAS logo fade-in */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="font-display text-4xl tracking-[0.4em] text-primary">ATLAS</span>
              <span className="font-data text-[9px] tracking-[0.6em] text-muted-foreground/50">PLANETARY PULSE · MISSION CONTROL</span>
            </motion.div>

            {/* Typewriter title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-data text-sm tracking-widest text-primary/70 min-h-[20px]"
            >
              {titleText}
              <span className="animate-pulse">█</span>
            </motion.div>

            {/* Status log */}
            <div className="w-full flex flex-col gap-1.5 bg-background/40 backdrop-blur-sm border border-border/20 rounded-sm p-4">
              {shownLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 font-data text-[9px] tracking-widest ${
                    i === shownLines.length - 1 && i === STATUS_LINES.length - 1
                      ? "text-healthy"
                      : i === shownLines.length - 1
                      ? "text-primary"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <span className={i === STATUS_LINES.length - 1 && i === shownLines.length - 1 ? "text-healthy" : "text-primary/40"}>
                    {i === STATUS_LINES.length - 1 && i === shownLines.length - 1 ? "●" : "›"}
                  </span>
                  {line}
                </motion.div>
              ))}
              {shownLines.length < STATUS_LINES.length && (
                <div className="font-data text-[9px] text-primary/30 animate-pulse tracking-widest">_</div>
              )}
            </div>

            {/* Planetary stats fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1 }}
              className="flex gap-6 font-data text-[8px] text-muted-foreground/30 tracking-widest"
            >
              <span>CO₂ 424 PPM</span>
              <span>TEMP +1.47°C</span>
              <span>ICE −3.4 MKM²</span>
              <span>HEALTH 58/100</span>
            </motion.div>
          </div>

          {/* Bottom-left date/time */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-6 left-6 font-data text-[8px] tracking-widest text-muted-foreground/30 pointer-events-none"
          >
            ATLAS · MARCH 2026 · v2.4.1
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
