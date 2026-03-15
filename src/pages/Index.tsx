import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Expand, GitBranch, Menu, Play, Square, FlaskConical } from "lucide-react";
import PlanetaryGlobe from "@/components/PlanetaryGlobe";
import VitalsPanel from "@/components/VitalsPanel";
import PulseGraph from "@/components/PulseGraph";
import LayerControls from "@/components/LayerControls";
import HealthScore from "@/components/HealthScore";
import TippingPointAlerts from "@/components/TippingPointAlerts";
import TippingPointModal, { ALL_ALERTS } from "@/components/TippingPointModal";
import EcosystemRadar from "@/components/EcosystemRadar";
import TimeSlider from "@/components/TimeSlider";
import StressMap from "@/components/StressMap";
import CriticalAlertBanner from "@/components/CriticalAlertBanner";
import CapitalFlowFeed from "@/components/CapitalFlowFeed";
import OverviewEffect from "@/components/OverviewEffect";
import TippingCascade from "@/components/TippingCascade";
import IntroSequence from "@/components/IntroSequence";
import NewsTicker from "@/components/NewsTicker";
import PlanetaryBudget, { DeployModal, BiomeBudget } from "@/components/PlanetaryBudget";
import PlanetaryThreatReport from "@/components/PlanetaryThreatReport";
import SatelliteFeed from "@/components/SatelliteFeed";
import InterventionSimulator from "@/components/InterventionSimulator";
import { MobileOverlayDrawer } from "@/components/MobileDrawer";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useSimulateMode } from "@/hooks/useSimulateMode";
import { useIsMobile } from "@/hooks/use-mobile";

const START_YEAR = 1980;
const END_YEAR   = 2024;

export default function Index() {
  const [introComplete, setIntroComplete] = useState(false);
  const [activeLayer, setActiveLayer]   = useState("none");
  const [activeAlert, setActiveAlert]   = useState<string | null>(null);
  const [overviewActive, setOverviewActive] = useState(false);
  const [cascadeOpen, setCascadeOpen]   = useState(false);
  const [reportOpen, setReportOpen]     = useState(false);
  const [globeYear, setGlobeYear]       = useState(END_YEAR);
  const [mobilePanel, setMobilePanel]   = useState<"layers" | "vitals" | "alerts" | null>(null);
  const [focusRegion, setFocusRegion]   = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [deployTarget, setDeployTarget] = useState<BiomeBudget | null>(null);
  const [budgetDeploys, setBudgetDeploys] = useState<Record<string, number>>({});
  const [interventorOpen, setInterventorOpen] = useState(false);

  const handleBudgetDeploy = (id: string, amount: number) => {
    setBudgetDeploys(prev => ({ ...prev, [id]: (prev[id] ?? 0) + amount }));
    setDeployTarget(null);
  };

  const realtimeData = useRealtimeData();
  const { simState, startSimulation, stopSimulation } = useSimulateMode();
  const isMobile = useIsMobile();

  const yearOffset = (globeYear - START_YEAR) / (END_YEAR - START_YEAR);

  // Use overridden score during simulation
  const displayScore = simState.active && simState.overrideScore !== null
    ? simState.overrideScore
    : realtimeData.healthScore;

  const handleZoomToRegion = (lat: number, lon: number, label: string) => {
    setFocusRegion({ lat, lon, label });
    if (activeLayer !== "regen") setActiveLayer("regen");
    setTimeout(() => setFocusRegion(null), 8000);
  };

  return (
    <div className="min-h-screen bg-background font-body overflow-hidden relative">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 opacity-35 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220 20% 14%) 1px, transparent 1px), linear-gradient(90deg, hsl(220 20% 14%) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Ambient top-center glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] rounded-full bg-primary/4 blur-[130px] pointer-events-none" />

      {/* Simulation overlay glow */}
      <AnimatePresence>
        {simState.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, hsl(0 85% 60% / 0.07) 0%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="relative flex-col h-screen max-h-screen p-3 gap-3 hidden md:flex">

        {/* ── TOP BAR ── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="panel-glass rounded-sm px-4 py-2.5 shrink-0 shadow-panel"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <HealthScore score={displayScore} vitals={realtimeData.vitals} />
            </div>
            <div className="flex items-center gap-2 shrink-0">

              {/* SIMULATE button */}
              {simState.active ? (
                <div className="flex items-center gap-2">
                  {/* Progress bar */}
                  <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-critical rounded-full"
                      animate={{ width: `${(simState.elapsed / 30) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="font-data text-[8px] text-critical/70 tabular-nums w-8">{30 - simState.elapsed}s</span>
                  <button
                    onClick={stopSimulation}
                    className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-critical border border-critical/30 rounded-sm px-2.5 py-1.5 hover:bg-critical/10 transition-all"
                  >
                    <Square className="w-3 h-3" />
                    STOP
                  </button>
                </div>
              ) : (
                <button
                  onClick={startSimulation}
                  className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-warning border border-warning/25 rounded-sm px-2.5 py-1.5 hover:bg-warning/10 hover:border-warning/40 transition-all"
                  title="Run 30-second crisis simulation"
                >
                  <Play className="w-3 h-3" />
                  SIMULATE
                </button>
              )}

              <button
                onClick={() => setCascadeOpen(true)}
                className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-critical border border-critical/20 rounded-sm px-2.5 py-1.5 hover:bg-critical/10 hover:border-critical/40 transition-all"
                title="Tipping Cascade Simulator"
              >
                <GitBranch className="w-3 h-3" />
                CASCADE
              </button>

              {/* REPORT button */}
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-primary border border-primary/20 rounded-sm px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/40 transition-all"
                title="Planetary Threat Assessment Report"
              >
                REPORT
              </button>

              <button
                onClick={() => setOverviewActive(true)}
                className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-primary border border-primary/20 rounded-sm px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/40 transition-all"
                title="Enter Overview Effect"
              >
                <Expand className="w-3 h-3" />
                OVERVIEW
              </button>
            </div>
          </div>
        </motion.header>

        {/* ── MAIN GRID ── */}
        <div className="flex-1 min-h-0 grid grid-cols-[200px_1fr_220px] gap-3">

          {/* LEFT — Layer Controls */}
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="panel-glass rounded-sm p-3 shadow-panel overflow-y-auto"
          >
            <LayerControls activeLayer={activeLayer} onLayerChange={setActiveLayer} />
          </motion.aside>

          {/* CENTER — Globe + bottom row */}
          <div className="flex flex-col gap-3 min-h-0">

            {/* Globe + Stress Map stack */}
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="flex-1 min-h-0 panel-glass rounded-sm shadow-panel overflow-hidden relative"
                style={{ minHeight: 0 }}
              >
                {/* Sim phase badge */}
                <AnimatePresence>
                  {simState.active && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-data text-[10px] tracking-widest bg-critical/15 border border-critical/40 text-critical rounded-sm px-3 py-1 pointer-events-none"
                    >
                      ⚠ SIMULATION ACTIVE · PHASE {simState.phase + 1}/5 · SCORE {displayScore}
                    </motion.div>
                  )}
                </AnimatePresence>
                {globeYear !== END_YEAR && !simState.active && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-data text-[10px] tracking-widest bg-warning/15 border border-warning/30 text-warning rounded-sm px-3 py-1 pointer-events-none"
                  >
                    TIME MACHINE: {globeYear}
                  </motion.div>
                )}
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <span className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                      INITIALIZING GLOBE...
                    </span>
                  </div>
                }>
                  <PlanetaryGlobe
                    activeLayer={activeLayer}
                    yearOffset={yearOffset}
                    focusLat={focusRegion?.lat ?? null}
                    focusLon={focusRegion?.lon ?? null}
                    focusLabel={focusRegion?.label ?? null}
                  />
                </Suspense>
              </motion.div>

              {/* Stress Map */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="panel-glass rounded-sm p-3 shadow-panel shrink-0"
                style={{ height: "160px" }}
              >
                <StressMap onZoneClick={(zone) => {
                  const mapping: Record<string, string> = {
                    amazon: "amz", arctic: "ghis", greenland: "ghis", coral: "gbr"
                  };
                  const alertId = mapping[zone.id];
                  if (alertId) setActiveAlert(alertId);
                }} />
              </motion.div>
            </div>

            {/* Bottom row: Pulse Graph + Time Slider */}
            <div className="grid grid-cols-2 gap-3 shrink-0" style={{ height: "188px" }}>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="panel-glass rounded-sm p-3 shadow-panel"
              >
                <PulseGraph stability={realtimeData.pulseStability} alertLevel={realtimeData.alertLevel} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="panel-glass rounded-sm p-3 shadow-panel"
              >
                <TimeSlider activeLayer={activeLayer} onYearChange={setGlobeYear} />
              </motion.div>
            </div>
          </div>

          {/* RIGHT — Vitals + Radar + Alerts + Capital Flow + Budget */}
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="flex flex-col gap-3 min-h-0 overflow-hidden"
          >
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "130px" }}>
              <VitalsPanel vitals={realtimeData.vitals} />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "175px" }}>
              <EcosystemRadar />
            </div>
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "160px" }}>
              <TippingPointAlerts alerts={ALL_ALERTS} onAlertClick={setActiveAlert} />
            </div>
            {/* Capital Flow Feed */}
            <div className="panel-glass rounded-sm p-3 shadow-panel shrink-0" style={{ height: "140px" }}>
              <CapitalFlowFeed onZoomToRegion={handleZoomToRegion} />
            </div>
            {/* Planetary Budget */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="panel-glass rounded-sm p-3 shadow-panel shrink-0"
              style={{ height: "260px" }}
            >
              <PlanetaryBudget
                onZoomToRegion={handleZoomToRegion}
                onDeployRequest={setDeployTarget}
              />
            </motion.div>
            {/* Satellite Feed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="panel-glass rounded-sm p-3 shadow-panel flex-1 min-h-0 overflow-hidden"
            >
              <SatelliteFeed simActive={simState.active} />
            </motion.div>
          </motion.aside>
        </div>

        {/* ── NEWS TICKER ── */}
        <NewsTicker
          crisisHeadlines={simState.crisisHeadlines}
          simActive={simState.active}
        />
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="flex flex-col h-screen max-h-screen md:hidden">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel-glass px-3 py-2 shrink-0 border-b border-border/30 flex items-center justify-between"
        >
          <HealthScore score={displayScore} vitals={realtimeData.vitals} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={simState.active ? stopSimulation : startSimulation}
              className={`p-2 rounded-sm border text-xs font-data tracking-widest transition-all ${
                simState.active
                  ? "border-critical/40 text-critical bg-critical/10"
                  : "border-warning/30 text-warning"
              }`}
            >
              {simState.active ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setOverviewActive(true)}
              className="p-2 rounded-sm border border-primary/20 text-primary"
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobilePanel("layers")}
              className="p-2 rounded-sm border border-border/30 text-muted-foreground"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.header>

        <div className="flex-1 min-h-0 relative">
          {simState.active && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 font-data text-[9px] tracking-widest bg-critical/15 border border-critical/40 text-critical rounded-sm px-3 py-1 pointer-events-none">
              ⚠ SIMULATION · {30 - simState.elapsed}s
            </div>
          )}
          {globeYear !== END_YEAR && !simState.active && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 font-data text-[9px] tracking-widest bg-warning/15 border border-warning/30 text-warning rounded-sm px-3 py-1 pointer-events-none">
              TIME MACHINE: {globeYear}
            </div>
          )}
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-background">
              <span className="font-data text-[10px] tracking-widest text-muted-foreground animate-pulse-dot">
                INITIALIZING GLOBE...
              </span>
            </div>
          }>
            <PlanetaryGlobe
              activeLayer={activeLayer}
              yearOffset={yearOffset}
              focusLat={focusRegion?.lat ?? null}
              focusLon={focusRegion?.lon ?? null}
              focusLabel={focusRegion?.label ?? null}
            />
          </Suspense>
        </div>

        <div className="panel-glass border-t border-border/30 px-3 py-2.5 shrink-0">
          <TimeSlider activeLayer={activeLayer} onYearChange={setGlobeYear} />
        </div>

        <div className="panel-glass border-t border-border/30 px-3 py-2 shrink-0 flex gap-2">
          {[
            { key: "vitals" as const,  label: "VITALS",  badge: undefined },
            { key: "alerts" as const,  label: "ALERTS",  badge: ALL_ALERTS.filter(a => a.severity === "high").length },
            { key: "layers" as const,  label: "LAYERS",  badge: undefined },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setMobilePanel(p => p === btn.key ? null : btn.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-sm py-2 font-data text-[9px] tracking-widest border transition-all ${
                mobilePanel === btn.key
                  ? "border-primary/40 text-primary bg-primary/10"
                  : "border-border/30 text-muted-foreground"
              }`}
            >
              {btn.label}
              {btn.badge !== undefined && btn.badge > 0 && (
                <span className="text-critical font-semibold">{btn.badge}</span>
              )}
            </button>
          ))}
        </div>

        <NewsTicker
          crisisHeadlines={simState.crisisHeadlines}
          simActive={simState.active}
        />
      </div>

      {/* Mobile overlay drawers */}
      <MobileOverlayDrawer open={mobilePanel === "layers"} onClose={() => setMobilePanel(null)} title="LAYER CONTROLS">
        <LayerControls activeLayer={activeLayer} onLayerChange={(l) => { setActiveLayer(l); setMobilePanel(null); }} />
      </MobileOverlayDrawer>

      <MobileOverlayDrawer open={mobilePanel === "vitals"} onClose={() => setMobilePanel(null)} title="PLANETARY VITALS">
        <div className="flex flex-col gap-3">
          <div style={{ height: "160px" }}><VitalsPanel vitals={realtimeData.vitals} /></div>
          <div style={{ height: "200px" }}><EcosystemRadar /></div>
          <div style={{ height: "200px" }}><PulseGraph stability={realtimeData.pulseStability} alertLevel={realtimeData.alertLevel} /></div>
        </div>
      </MobileOverlayDrawer>

      <MobileOverlayDrawer open={mobilePanel === "alerts"} onClose={() => setMobilePanel(null)} title="TIPPING POINT ALERTS">
        <div className="flex flex-col gap-3">
          <TippingPointAlerts
            alerts={ALL_ALERTS}
            onAlertClick={(id) => { setActiveAlert(id); setMobilePanel(null); }}
          />
          <div style={{ height: "220px" }}>
            <CapitalFlowFeed onZoomToRegion={(lat, lon, label) => { handleZoomToRegion(lat, lon, label); setMobilePanel(null); }} />
          </div>
          <div style={{ height: "500px" }}>
            <PlanetaryBudget onZoomToRegion={handleZoomToRegion} />
          </div>
        </div>
      </MobileOverlayDrawer>

      {/* Tipping Point Detail Modal */}
      <TippingPointModal alertId={activeAlert} onClose={() => setActiveAlert(null)} />

      {/* Tipping Cascade Simulator */}
      <TippingCascade open={cascadeOpen} onClose={() => setCascadeOpen(false)} />

      {/* Planetary Threat Assessment Report */}
      <PlanetaryThreatReport
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        vitals={realtimeData.vitals}
        healthScore={displayScore}
      />

      {/* Critical Alert Banner */}
      <CriticalAlertBanner
        vitals={realtimeData.vitals}
        tippingAlerts={ALL_ALERTS}
        onAlertClick={setActiveAlert}
      />

      {/* Overview Effect */}
      <OverviewEffect active={overviewActive} onClose={() => setOverviewActive(false)} />

      {/* Deploy Capital Modal — lifted to root to escape overflow-hidden */}
      <AnimatePresence>
        {deployTarget && (
          <DeployModal
            biome={deployTarget}
            onClose={() => setDeployTarget(null)}
            onDeploy={handleBudgetDeploy}
          />
        )}
      </AnimatePresence>

      {/* Intro Sequence */}
      {!introComplete && <IntroSequence onComplete={() => setIntroComplete(true)} />}
    </div>
  );
}
