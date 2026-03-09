import { useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

/* ── Data stubs for globe regions ── */
interface RegionData {
  name: string;
  lat: number;
  lon: number;
  stress: number;        // 0–100
  stressLabel: string;
  nearestTipping: string;
  tippingRisk: number;   // %
  capitalDeployed: string | null;
  capitalNote: string | null;
  biome: string;
}

const REGIONS: RegionData[] = [
  {
    name: "Amazon Basin",
    lat: -5, lon: -63, stress: 87, stressLabel: "Deforestation + Drought",
    nearestTipping: "Amazon Savannification", tippingRisk: 76,
    capitalDeployed: "$142M", capitalNote: "Reforestation corridor active",
    biome: "Tropical Rainforest",
  },
  {
    name: "Arctic Ocean",
    lat: 82, lon: 10, stress: 91, stressLabel: "Sea Ice Collapse",
    nearestTipping: "Arctic Sea Ice Loss", tippingRisk: 88,
    capitalDeployed: null, capitalNote: null,
    biome: "Polar / Cryosphere",
  },
  {
    name: "Sahel Region",
    lat: 14, lon: 10, stress: 73, stressLabel: "Desertification + Drought",
    nearestTipping: "West African Monsoon", tippingRisk: 62,
    capitalDeployed: "$38M", capitalNote: "Agroforestry deployment",
    biome: "Savanna / Semi-arid",
  },
  {
    name: "Great Barrier Reef",
    lat: -18, lon: 148, stress: 82, stressLabel: "Bleaching Events",
    nearestTipping: "Coral Reef Die-off", tippingRisk: 71,
    capitalDeployed: "$27M", capitalNote: "Coral restoration project",
    biome: "Marine / Reef",
  },
  {
    name: "Siberian Permafrost",
    lat: 65, lon: 100, stress: 68, stressLabel: "Thaw + CH₄ Release",
    nearestTipping: "Permafrost Carbon Release", tippingRisk: 59,
    capitalDeployed: null, capitalNote: null,
    biome: "Boreal / Tundra",
  },
  {
    name: "Congo Basin",
    lat: -1, lon: 24, stress: 61, stressLabel: "Deforestation Pressure",
    nearestTipping: "Congo Forest Degradation", tippingRisk: 48,
    capitalDeployed: "$54M", capitalNote: "REDD+ carbon credits active",
    biome: "Tropical Rainforest",
  },
  {
    name: "North Atlantic",
    lat: 52, lon: -30, stress: 74, stressLabel: "AMOC Freshwater Influx",
    nearestTipping: "AMOC Collapse", tippingRisk: 65,
    capitalDeployed: null, capitalNote: null,
    biome: "Ocean Current",
  },
  {
    name: "West Antarctica",
    lat: -79, lon: -95, stress: 78, stressLabel: "Ice Sheet Instability",
    nearestTipping: "WAIS Collapse", tippingRisk: 55,
    capitalDeployed: null, capitalNote: null,
    biome: "Polar Ice Sheet",
  },
  {
    name: "Southeast Asia",
    lat: 5, lon: 110, stress: 65, stressLabel: "Peat Fire + Deforestation",
    nearestTipping: "Peatland Carbon Release", tippingRisk: 54,
    capitalDeployed: "$31M", capitalNote: "Peatland rewetting fund",
    biome: "Tropical / Peatland",
  },
];

/* ── Convert lat/lon → sphere surface XYZ ── */
function latLonToVec3(lat: number, lon: number, r = 1): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Find nearest region to a ray–sphere intersection ── */
function nearestRegion(point: THREE.Vector3): RegionData {
  let best = REGIONS[0];
  let bestD = Infinity;
  for (const r of REGIONS) {
    const rv = latLonToVec3(r.lat, r.lon);
    const d = point.distanceTo(rv);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

/* ── Raycaster component (lives inside Canvas) ── */
interface RayProps {
  onHit: (region: RegionData, screenX: number, screenY: number) => void;
  onMiss: () => void;
}

export function GlobeTouchRaycaster({ onHit, onMiss }: RayProps) {
  const sphereRef = useRef<THREE.Mesh>(null);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const pt = e.point.clone().normalize();
    const region = nearestRegion(pt);
    onHit(region, clientX, clientY);
  }, [onHit]);

  const handlePointerMissed = useCallback(() => {
    onMiss();
  }, [onMiss]);

  return (
    <mesh
      ref={sphereRef}
      onPointerDown={handlePointerDown}
      onPointerMissed={handlePointerMissed}
    >
      <sphereGeometry args={[1.05, 32, 32]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/* ── Popup card ── */
interface PopupProps {
  region: RegionData | null;
  screenX: number;
  screenY: number;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function GlobeRegionPopup({ region, screenX, screenY, onClose, containerRef }: PopupProps) {
  if (!region) return null;

  // Clamp popup inside container
  const popW = 220;
  const popH = 260;
  const containerRect = containerRef.current?.getBoundingClientRect();
  let left = screenX - popW / 2;
  let top  = screenY - popH - 14;
  if (containerRect) {
    left = Math.max(containerRect.left + 4, Math.min(left, containerRect.right - popW - 4));
    top  = Math.max(containerRect.top  + 4, top);
    if (top + popH > containerRect.bottom - 4) top = screenY + 14;
  }

  const stressColor = region.stress >= 80 ? "text-critical" : region.stress >= 60 ? "text-warning" : "text-healthy";
  const stressBg    = region.stress >= 80 ? "bg-critical"   : region.stress >= 60 ? "bg-warning"   : "bg-healthy";
  const riskColor   = region.tippingRisk >= 70 ? "text-critical" : region.tippingRisk >= 50 ? "text-warning" : "text-nominal";

  return (
    <AnimatePresence>
      {region && (
        <motion.div
          key={region.name}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 4 }}
          transition={{ duration: 0.18 }}
          style={{ position: "fixed", left, top, width: popW, zIndex: 80 }}
          className="panel-glass rounded-sm border border-border/50 shadow-panel overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
            <div>
              <div className="font-data text-[10px] font-semibold text-foreground tracking-wide">{region.name}</div>
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mt-0.5">{region.biome}</div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground/40 hover:text-muted-foreground text-xs leading-none p-0.5 mt-0.5"
            >✕</button>
          </div>

          <div className="px-3 py-2.5 flex flex-col gap-2">
            {/* Stress */}
            <div>
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">ENVIRONMENTAL STRESS</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${stressBg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${region.stress}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
                <span className={`font-data text-[10px] font-bold ${stressColor}`}>{region.stress}</span>
              </div>
              <div className={`font-data text-[8px] mt-0.5 ${stressColor}`}>{region.stressLabel}</div>
            </div>

            {/* Tipping point */}
            <div className="bg-muted/20 rounded-sm p-2 border border-border/20">
              <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">NEAREST TIPPING POINT</div>
              <div className="font-data text-[9px] text-foreground/80">{region.nearestTipping}</div>
              <div className={`font-data text-[8px] font-semibold mt-0.5 ${riskColor}`}>
                {region.tippingRisk}% CASCADE RISK
              </div>
            </div>

            {/* Capital */}
            {region.capitalDeployed ? (
              <div className="bg-healthy/8 border border-healthy/20 rounded-sm p-2">
                <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">REGEN CAPITAL</div>
                <div className="font-data text-[10px] font-bold text-healthy">{region.capitalDeployed} deployed</div>
                <div className="font-data text-[8px] text-healthy/60 mt-0.5">{region.capitalNote}</div>
              </div>
            ) : (
              <div className="bg-muted/10 border border-border/15 rounded-sm p-2">
                <div className="font-data text-[7px] text-muted-foreground/30 tracking-widest mb-0.5">REGEN CAPITAL</div>
                <div className="font-data text-[8px] text-muted-foreground/30">No capital deployed</div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
