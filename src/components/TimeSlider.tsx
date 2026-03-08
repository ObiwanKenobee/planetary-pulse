import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Play, Pause, SkipBack, SplitSquareHorizontal, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const START_YEAR = 1980;
const END_YEAR   = 2024;

function getYearStats(year: number) {
  const t = (year - START_YEAR) / (END_YEAR - START_YEAR);
  return {
    co2:    (280 + t * 144).toFixed(1),
    temp:   (-0.1 + t * 1.57).toFixed(2),
    arctic: (7.9 - t * 3.4).toFixed(1),
    forest: (100 - t * 18).toFixed(1),
    sea:    (0 + t * 210).toFixed(0),
  };
}

/* ── Mini Globe for comparison ── */
function MiniGlobeScene({ year, activeLayer }: { year: number; activeLayer: string }) {
  const meshRef  = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);

  const t = (year - START_YEAR) / (END_YEAR - START_YEAR);

  const layerColors: Record<string, THREE.Vector3> = {
    forest: new THREE.Vector3(0.1, 0.7, 0.2),
    ocean:  new THREE.Vector3(0.0, 0.5, 1.0),
    ice:    new THREE.Vector3(0.7, 0.9, 1.0),
    co2:    new THREE.Vector3(0.9, 0.5, 0.1),
    heat:   new THREE.Vector3(1.0, 0.2, 0.1),
    soil:   new THREE.Vector3(0.6, 0.4, 0.1),
    impact: new THREE.Vector3(0.8, 0.3, 0.9),
    none:   new THREE.Vector3(0.08, 0.45, 0.6),
  };

  const layerVec = layerColors[activeLayer] ?? layerColors["none"];
  const iceExtent = 1.0 - t * 0.43; // shrinks from 1980→2024

  const globeMat = useRef(
    new THREE.ShaderMaterial({
      uniforms: {
        time:        { value: year * 0.1 },
        yearOffset:  { value: t },
        layerColor:  { value: layerVec },
        layerInt:    { value: activeLayer !== "none" ? 0.38 : 0.0 },
        iceExtent:   { value: iceExtent },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vNormal;
        void main(){
          vUv=uv; vNormal=normalize(normalMatrix*normal);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float time; uniform float yearOffset; uniform vec3 layerColor;
        uniform float layerInt; uniform float iceExtent;
        varying vec2 vUv; varying vec3 vNormal;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){
          vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        void main(){
          vec3 ocean=vec3(0.02,0.18,0.35);
          vec3 land=vec3(0.12,0.32,0.18);
          vec3 ice=vec3(0.80,0.92,0.98);
          // Forest denser in 1980, thinner in 2024
          vec3 forest1980=vec3(0.08,0.38,0.14);
          float n1=noise(vUv*5.0+vec2(time*0.001));
          float n2=noise(vUv*12.0+vec2(0.3));
          float landMask=smoothstep(0.42,0.56,n1*0.7+n2*0.3);
          // Ice caps shrink with year
          float poleY=abs(vUv.y-0.5)*2.0;
          float pole=smoothstep(0.7*iceExtent,0.95*iceExtent,poleY);
          // Forest vitality decreases
          float forestVitality=mix(1.0,0.55,yearOffset);
          vec3 col=mix(ocean,mix(land,forest1980,forestVitality*landMask*0.4),landMask);
          col=mix(col,ice,pole);
          col+=noise(vUv*30.0+vec2(time*0.01))*0.04*(1.0-landMask);
          float layerNoise=noise(vUv*8.0);
          col=mix(col,layerColor,layerInt*(0.5+0.5*layerNoise));
          // CO2 haze effect
          float coHaze=yearOffset*0.06;
          col=mix(col,vec3(0.6,0.4,0.1),coHaze*(1.0-landMask)*0.3);
          float rim=pow(1.0-max(dot(vNormal,vec3(0,0,1)),0.0),3.5);
          col+=vec3(0.02,0.25,0.35)*rim*0.6;
          gl_FragColor=vec4(col,1.0);
        }
      `,
    })
  );

  const cloudMat = useRef(
    new THREE.ShaderMaterial({
      uniforms: { time: { value: year * 0.1 } },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `
        uniform float time; varying vec2 vUv;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        void main(){
          float n=noise(vUv*6.0+vec2(time*0.01,0));
          float n2=noise(vUv*14.0+vec2(time*0.008));
          float clouds=smoothstep(0.52,0.72,n*0.6+n2*0.4);
          gl_FragColor=vec4(0.9,0.95,1.0,clouds*0.35);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  );

  // Update uniforms when year/layer changes
  useEffect(() => {
    globeMat.current.uniforms.yearOffset.value = t;
    globeMat.current.uniforms.iceExtent.value = iceExtent;
    globeMat.current.uniforms.layerColor.value = layerVec;
    globeMat.current.uniforms.layerInt.value = activeLayer !== "none" ? 0.38 : 0.0;
  }, [year, activeLayer, t, iceExtent, layerVec]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (meshRef.current)  meshRef.current.rotation.y  = elapsed * 0.08;
    if (cloudRef.current) cloudRef.current.rotation.y = elapsed * 0.05;
    globeMat.current.uniforms.time.value = elapsed;
    cloudMat.current.uniforms.time.value = elapsed;
  });

  return (
    <group>
      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(0.05, 0.85, 0.95)}
          transparent
          opacity={0.06}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh ref={meshRef} material={globeMat.current}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      <mesh ref={cloudRef} material={cloudMat.current}>
        <sphereGeometry args={[1.02, 32, 32]} />
      </mesh>
    </group>
  );
}

function MiniGlobe({ year, label, activeLayer }: { year: number; label: string; activeLayer: string }) {
  const stats = getYearStats(year);
  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-display text-lg font-bold text-primary">{year}</span>
        <span className="font-data text-[8px] text-muted-foreground tracking-widest">{label}</span>
      </div>
      <div className="relative rounded-sm overflow-hidden border border-border/30" style={{ height: "110px" }}>
        <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
          <ambientLight intensity={0.18} />
          <directionalLight position={[5, 3, 5]} intensity={1.2} color="#b0e8ff" />
          <MiniGlobeScene year={year} activeLayer={activeLayer} />
        </Canvas>
        {/* Year stat overlay */}
        <div className="absolute bottom-1 left-1 right-1 flex justify-between px-1">
          <span className="font-data text-[7px] text-warning/80">CO₂ {stats.co2}ppm</span>
          <span className="font-data text-[7px] text-primary/60">🧊 {stats.arctic}M km²</span>
        </div>
      </div>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {[
          { l: "TEMP", v: `+${stats.temp}°C`, c: parseFloat(stats.temp) > 1 ? "text-critical" : "text-warning" },
          { l: "FOREST", v: `${stats.forest}%`, c: parseFloat(stats.forest) < 85 ? "text-warning" : "text-healthy" },
          { l: "SEA", v: `+${stats.sea}mm`, c: parseInt(stats.sea) > 100 ? "text-critical" : "text-warning" },
        ].map(s => (
          <div key={s.l} className="text-center bg-muted/20 rounded-sm py-0.5">
            <div className={`font-data text-[9px] font-semibold ${s.c}`}>{s.v}</div>
            <div className="font-data text-[7px] text-muted-foreground/50">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TimeSliderProps {
  activeLayer?: string;
}

export default function TimeSlider({ activeLayer = "none" }: TimeSliderProps) {
  const [year, setYear]         = useState(2024);
  const [playing, setPlaying]   = useState(false);
  const [compare, setCompare]   = useState(false);
  const intervalRef             = useRef<number | null>(null);

  const handleReset = useCallback(() => {
    setYear(START_YEAR);
    setPlaying(false);
  }, []);

  // Playback ticker
  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setYear(y => {
          if (y >= END_YEAR) { setPlaying(false); return END_YEAR; }
          return y + 1;
        });
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const stats = getYearStats(year);
  const t     = (year - START_YEAR) / (END_YEAR - START_YEAR);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">PLANETARY TIME MACHINE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleReset} className="p-1 rounded hover:bg-muted/50 transition-colors" title="Reset to 1980">
            <SkipBack className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => setCompare(c => !c)}
            className={`flex items-center gap-1 font-data text-[9px] tracking-widest border rounded-sm px-2 py-1 transition-colors ${
              compare
                ? "text-primary border-primary/30 bg-primary/10"
                : "text-muted-foreground border-muted/30 hover:bg-muted/30"
            }`}
            title="Compare 1980 vs 2024"
          >
            <SplitSquareHorizontal className="w-2.5 h-2.5" />
            COMPARE
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-nominal border border-nominal/20 rounded-sm px-2 py-1 hover:bg-nominal/10 transition-colors"
          >
            {playing ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
            {playing ? "PAUSE" : "PLAY"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {compare ? (
          /* ── COMPARE MODE ── */
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex gap-2 flex-1 min-h-0">
              <MiniGlobe year={1980} label="BASELINE" activeLayer={activeLayer} />
              {/* Divider */}
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 px-1">
                <div className="w-px flex-1 bg-border/30" />
                <span className="font-data text-[8px] text-muted-foreground/50 rotate-0">VS</span>
                <div className="w-px flex-1 bg-border/30" />
              </div>
              <MiniGlobe year={2024} label="CURRENT" activeLayer={activeLayer} />
            </div>

            {/* Delta summary */}
            <div className="grid grid-cols-5 gap-1 mt-2 shrink-0">
              {[
                { label: "CO₂ Δ",     val: "+144 ppm", c: "text-critical" },
                { label: "TEMP Δ",    val: "+1.67°C",  c: "text-critical" },
                { label: "ARCTIC Δ",  val: "-3.4 Mkm²",c: "text-critical" },
                { label: "FOREST Δ",  val: "-18%",     c: "text-warning"  },
                { label: "SEA Δ",     val: "+210 mm",  c: "text-warning"  },
              ].map(d => (
                <div key={d.label} className="bg-muted/20 rounded-sm p-1 text-center">
                  <div className={`font-data text-[9px] font-bold ${d.c}`}>{d.val}</div>
                  <div className="font-data text-[7px] text-muted-foreground/50 mt-0.5">{d.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ── NORMAL MODE ── */
          <motion.div
            key="normal"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col gap-2 min-h-0"
          >
            {/* Year display + stats */}
            <div className="flex items-center gap-4 shrink-0">
              <motion.div
                key={year}
                initial={{ opacity: 0.6, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-3xl font-bold text-primary shrink-0"
              >
                {year}
              </motion.div>
              <div className="flex-1 grid grid-cols-5 gap-2">
                {[
                  { label: "CO₂",      val: stats.co2,    unit: "ppm",  color: "text-warning"  },
                  { label: "TEMP Δ",   val: stats.temp,   unit: "°C",   color: year > 2000 ? "text-critical" : "text-warning" },
                  { label: "ARCTIC",   val: stats.arctic, unit: "Mkm²", color: year > 2010 ? "text-critical" : "text-nominal" },
                  { label: "FOREST",   val: stats.forest, unit: "%",    color: year > 2000 ? "text-warning" : "text-healthy" },
                  { label: "SEA RISE", val: stats.sea,    unit: "mm",   color: year > 2010 ? "text-critical" : "text-warning" },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className={`font-data text-xs font-semibold ${item.color}`}>{item.val}</div>
                    <div className="font-data text-[8px] text-muted-foreground">{item.unit}</div>
                    <div className="font-data text-[7px] text-muted-foreground/50">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="relative shrink-0">
              <Slider
                min={START_YEAR} max={END_YEAR} step={1}
                value={[year]}
                onValueChange={([v]) => setYear(v)}
                className="w-full"
              />
              <div className="flex justify-between mt-1.5">
                {[1980, 1990, 2000, 2010, 2020, 2024].map(y => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`font-data text-[8px] transition-colors ${year === y ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-6 bg-muted/30 rounded-sm overflow-hidden border border-border/30 shrink-0">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-nominal/30 via-warning/40 to-critical/50"
                style={{ width: `${t * 100}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-data text-[9px] text-muted-foreground tracking-widest">
                  {t === 0 ? "PRE-INDUSTRIAL BASELINE" : `${(t * 44).toFixed(1)} YEARS OF CHANGE OBSERVED`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
