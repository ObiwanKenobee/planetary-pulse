import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, AlertTriangle, TrendingDown, Zap, DollarSign } from "lucide-react";
import type { VitalData } from "@/hooks/useRealtimeData";

/* ─── Static data ─── */
const BIOME_SCORES = [
  { name: "Amazon Basin",       icon: "🌿", score: 28, status: "critical", risk: 94, budget: { needed: 2400, deployed: 142 } },
  { name: "Arctic Ocean",       icon: "🧊", score: 19, status: "critical", risk: 91, budget: { needed: 800,  deployed: 0   } },
  { name: "Great Barrier Reef", icon: "🪸", score: 34, status: "critical", risk: 88, budget: { needed: 340,  deployed: 27  } },
  { name: "Sahel Region",       icon: "🌵", score: 41, status: "warning",  risk: 74, budget: { needed: 560,  deployed: 38  } },
  { name: "Congo Basin",        icon: "🌳", score: 52, status: "warning",  risk: 61, budget: { needed: 780,  deployed: 54  } },
  { name: "Siberian Permafrost",icon: "🏔️", score: 38, status: "critical", risk: 79, budget: { needed: 1200, deployed: 0   } },
  { name: "West Antarctica",    icon: "❄️", score: 12, status: "critical", risk: 96, budget: { needed: 2100, deployed: 0   } },
  { name: "North Atlantic",     icon: "🌊", score: 47, status: "warning",  risk: 68, budget: { needed: 450,  deployed: 0   } },
  { name: "Southeast Asia",     icon: "🌴", score: 55, status: "nominal",  risk: 52, budget: { needed: 380,  deployed: 31  } },
];

const AMAZON_CASCADE = [
  { node: "Amazon Tipping",  prob: 100, impact: "90 Gt CO₂ released, continental drying" },
  { node: "Sahel Drying",    prob: 74,  impact: "West African monsoon −20–30%, desertification" },
  { node: "AMOC Slowdown",   prob: 68,  impact: "North Atlantic circulation collapse, +1.2°C" },
  { node: "Arctic Sea Ice",  prob: 82,  impact: "Albedo feedback, summer ice loss" },
  { node: "Permafrost Thaw", prob: 61,  impact: "+1,500 Gt carbon unlocked, +0.5°C" },
  { node: "Coral Bleaching", prob: 55,  impact: "Global reef collapse, 1B people affected" },
];

const WAIS_CASCADE = [
  { node: "WAIS Collapse",        prob: 100, impact: "Marine ice sheet instability triggered" },
  { node: "Sea Level Rise",        prob: 95,  impact: "+3–5m rise, 1B displaced" },
  { node: "AMOC Disruption",       prob: 72,  impact: "Freshwater pulse, thermohaline collapse" },
  { node: "Sahel Monsoon Failure", prob: 58,  impact: "West African monsoon −15–25%, famine" },
  { node: "Boreal Die-back",       prob: 48,  impact: "1.5 Bha converted to grassland" },
];

const ROADMAP = [
  { period: "2025–2027", phase: "EMERGENCY TRIAGE",    color: "text-critical", items: ["Halt Amazon deforestation via emergency moratorium", "Deploy $400M Thwaites monitoring system", "Establish AMOC early-warning network", "Launch $2.4B Amazon Restoration Fund"] },
  { period: "2028–2032", phase: "STABILISATION",       color: "text-warning",  items: ["Reforest 10M ha Amazon buffer zone", "Scale blended finance for Congo Basin", "Deploy Arctic methane capture pilots", "Rebuild 30% degraded coral via heat-resistant strains"] },
  { period: "2033–2040", phase: "RECOVERY PHASE",      color: "text-nominal",  items: ["Restore Atlantic thermohaline gradients", "Regreen Sahel via green wall expansion", "Permafrost rewilding — bison rewilding programme", "WAIS stabilisation ice pumping feasibility study"] },
  { period: "2041–2050", phase: "PLANETARY RESILIENCE",color: "text-healthy",  items: ["Full biodiversity index recovery to 80%+ baseline", "Net-zero land use across all 9 critical biomes", "AMOC strength within 10% of 1990 baseline", "Global tipping point early-warning system operational"] },
];

function fmt(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return val === 0 ? "—" : `$${val}M`;
}

const STATUS_CFG = {
  critical: "text-critical bg-critical/15 border-critical/30",
  warning:  "text-warning  bg-warning/15  border-warning/30",
  nominal:  "text-nominal  bg-nominal/15  border-nominal/30",
  healthy:  "text-healthy  bg-healthy/15  border-healthy/30",
};

interface Props {
  open: boolean;
  onClose: () => void;
  vitals: VitalData[];
  healthScore: number;
}

export default function PlanetaryThreatReport({ open, onClose, vitals, healthScore }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keyboard close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const handlePrint = () => window.print();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/85 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Full-screen panel */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-3 md:inset-5 z-50 panel-glass rounded-sm shadow-panel flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0 bg-muted/10">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-primary/80" />
                <div>
                  <div className="font-display text-[11px] tracking-[0.14em] text-foreground">PLANETARY THREAT ASSESSMENT</div>
                  <div className="font-data text-[8px] text-muted-foreground/50 tracking-widest">CLASSIFIED · ATLAS MISSION CONTROL · {new Date().toISOString().slice(0, 10)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 font-data text-[9px] tracking-widest border border-primary/25 text-primary/70 rounded-sm px-3 py-1.5 hover:bg-primary/10 transition-all"
                >
                  <Download className="w-3 h-3" />
                  EXPORT PDF
                </button>
                <button onClick={onClose} className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-8">

              {/* ── Section 1: Global Status ── */}
              <section>
                <SectionHeader icon={<AlertTriangle className="w-3.5 h-3.5 text-critical" />} title="GLOBAL PLANETARY STATUS" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <StatCard label="HEALTH SCORE"       value={`${healthScore}/100`}  sub="Composite index"        accent="text-warning"  />
                  <StatCard label="CRITICAL VITALS"    value={`${vitals.filter(v => v.status === "critical").length}/6`} sub="Systems compromised" accent="text-critical" />
                  <StatCard label="TIPPING RISK"       value="HIGH"                  sub="4 systems at threshold" accent="text-critical"  />
                  <StatCard label="TEMP ANOMALY"       value="+1.47°C"               sub="Above pre-industrial"   accent="text-warning"  />
                </div>
              </section>

              {/* ── Section 2: 9 Biome Health Scores ── */}
              <section>
                <SectionHeader icon={<TrendingDown className="w-3.5 h-3.5 text-warning" />} title="BIOME HEALTH SCORES · 9 CRITICAL SYSTEMS" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
                  {BIOME_SCORES.map((b, i) => (
                    <motion.div
                      key={b.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-muted/15 border border-border/25 rounded-sm p-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{b.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-data text-[9px] text-foreground/80 truncate">{b.name}</div>
                          <div className={`inline-flex items-center font-data text-[7px] tracking-widest border rounded-sm px-1.5 py-0.5 ${STATUS_CFG[b.status as keyof typeof STATUS_CFG]}`}>
                            {b.status.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-display text-lg font-bold ${b.score < 30 ? "text-critical" : b.score < 50 ? "text-warning" : "text-nominal"}`}>{b.score}</div>
                          <div className="font-data text-[7px] text-muted-foreground/40">/100</div>
                        </div>
                      </div>
                      {/* Health bar */}
                      <div className="h-1 bg-muted/30 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${b.score < 30 ? "bg-critical" : b.score < 50 ? "bg-warning" : "bg-nominal"}`}
                          style={{ width: `${b.score}%` }}
                        />
                      </div>
                      {/* Budget */}
                      <div className="flex justify-between font-data text-[7px]">
                        <span className="text-muted-foreground/40">Tipping risk: <span className={b.risk > 80 ? "text-critical" : "text-warning"}>{b.risk}%</span></span>
                        <span className="text-muted-foreground/40">{fmt(b.budget.deployed)} / {fmt(b.budget.needed)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ── Section 3: Cascade Risk Matrices ── */}
              <section>
                <SectionHeader icon={<Zap className="w-3.5 h-3.5 text-critical" />} title="CASCADE RISK MATRICES" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <CascadeMatrix title="🌿 AMAZON SAVANNIFICATION" chain={AMAZON_CASCADE} />
                  <CascadeMatrix title="🧊 WEST ANTARCTIC ICE SHEET" chain={WAIS_CASCADE} />
                </div>
              </section>

              {/* ── Section 4: Budget Gap Analysis ── */}
              <section>
                <SectionHeader icon={<DollarSign className="w-3.5 h-3.5 text-primary/70" />} title="REGENERATIVE CAPITAL GAP ANALYSIS" />
                <div className="grid grid-cols-3 gap-3 mt-3 mb-4">
                  <StatCard label="TOTAL NEEDED"  value={fmt(BIOME_SCORES.reduce((s,b)=>s+b.budget.needed,0))}   sub="Across 9 biomes"  accent="text-foreground/70" />
                  <StatCard label="DEPLOYED"      value={fmt(BIOME_SCORES.reduce((s,b)=>s+b.budget.deployed,0))} sub="Currently active" accent="text-healthy"        />
                  <StatCard label="FUNDING GAP"   value={fmt(BIOME_SCORES.reduce((s,b)=>s+b.budget.needed-b.budget.deployed,0))} sub="Urgent need" accent="text-critical" />
                </div>
                <div className="space-y-2">
                  {BIOME_SCORES.map(b => {
                    const pct = b.budget.needed > 0 ? Math.round((b.budget.deployed / b.budget.needed) * 100) : 0;
                    return (
                      <div key={b.name} className="flex items-center gap-3">
                        <span className="text-sm w-5">{b.icon}</span>
                        <div className="w-32 shrink-0">
                          <div className="font-data text-[8px] text-foreground/60 truncate">{b.name}</div>
                        </div>
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${b.status === "critical" ? "bg-gradient-to-r from-critical/70 to-critical" : "bg-gradient-to-r from-warning/70 to-warning"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="w-20 shrink-0 text-right">
                          <span className="font-data text-[8px] text-healthy">{fmt(b.budget.deployed)}</span>
                          <span className="font-data text-[7px] text-muted-foreground/40"> / {fmt(b.budget.needed)}</span>
                        </div>
                        <span className={`font-data text-[8px] w-10 text-right ${pct < 5 ? "text-critical/70" : "text-warning/70"}`}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Section 5: 2025–2050 Roadmap ── */}
              <section>
                <SectionHeader icon={<FileText className="w-3.5 h-3.5 text-primary/70" />} title="2025–2050 INTERVENTION ROADMAP" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {ROADMAP.map((phase, i) => (
                    <motion.div
                      key={phase.period}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-muted/15 border border-border/25 rounded-sm p-4"
                    >
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-display text-sm font-bold text-foreground/90">{phase.period}</span>
                        <span className={`font-data text-[7px] tracking-widest ${phase.color}`}>{phase.phase}</span>
                      </div>
                      <ul className="space-y-1.5">
                        {phase.items.map(item => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                            <span className="font-data text-[8px] text-foreground/60 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <div className="border-t border-border/20 pt-4 flex items-center justify-between">
                <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">ATLAS MISSION CONTROL · PLANETARY INTELLIGENCE SYSTEM · CONFIDENTIAL</span>
                <span className="font-data text-[7px] text-muted-foreground/30 tracking-widest">{new Date().toISOString()}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Sub-components ── */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border/30">
      {icon}
      <span className="font-display text-[10px] tracking-[0.14em] text-foreground/80">{title}</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-muted/20 border border-border/25 rounded-sm p-3">
      <div className="font-data text-[7px] text-muted-foreground/50 tracking-widest mb-1">{label}</div>
      <div className={`font-display text-lg font-bold ${accent}`}>{value}</div>
      <div className="font-data text-[7px] text-muted-foreground/40">{sub}</div>
    </div>
  );
}

function CascadeMatrix({ title, chain }: { title: string; chain: typeof AMAZON_CASCADE }) {
  return (
    <div className="bg-muted/10 border border-border/25 rounded-sm p-4">
      <div className="font-display text-[9px] tracking-widest text-foreground/70 mb-3">{title}</div>
      <div className="space-y-2">
        {chain.map((node, i) => (
          <div key={node.node} className="flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-data text-[7px] font-bold ${node.prob === 100 ? "bg-critical/20 text-critical border border-critical/40" : node.prob > 70 ? "bg-warning/15 text-warning border border-warning/30" : "bg-muted/30 text-muted-foreground/50 border border-border/30"}`}>
                {i + 1}
              </div>
              {i < chain.length - 1 && <div className="w-px h-3 bg-border/30 mt-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-data text-[9px] text-foreground/70">{node.node}</span>
                <span className={`font-data text-[7px] ${node.prob === 100 ? "text-critical" : node.prob > 70 ? "text-warning" : "text-muted-foreground/50"}`}>{node.prob}%</span>
              </div>
              <div className="font-data text-[7px] text-muted-foreground/40 leading-relaxed">{node.impact}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
