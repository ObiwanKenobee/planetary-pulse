import { useCallback } from "react";
import { FileText } from "lucide-react";
import type { VitalData } from "@/hooks/useRealtimeData";
import type { Alert } from "@/components/TippingPointModal";

interface PlanetaryReportProps {
  vitals: VitalData[];
  healthScore: number;
  tippingAlerts: Alert[];
}

function getYearStats(year: number) {
  const START = 1980, END = 2024;
  const t = (year - START) / (END - START);
  return {
    co2:    (280 + t * 144).toFixed(1),
    temp:   (-0.1 + t * 1.57).toFixed(2),
    arctic: (7.9 - t * 3.4).toFixed(1),
    forest: (100 - t * 18).toFixed(1),
    sea:    (0 + t * 210).toFixed(0),
  };
}

// Build a simple SVG sparkline from 0–1 values
function buildSparkline(values: number[], w: number, h: number, color: string): string {
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - v * h * 0.82 - h * 0.09;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <path d="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`;
}

export default function PlanetaryReport({ vitals, healthScore, tippingAlerts }: PlanetaryReportProps) {
  const stats1980 = getYearStats(1980);
  const stats2024 = getYearStats(2024);

  const generateReport = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const critCount = vitals.filter(v => v.status === "critical").length;
    const warnCount = vitals.filter(v => v.status === "warning").length;

    // Generate simple risk sparklines (0-1 values representing 60 data points)
    const riskSparkData = tippingAlerts.map(a => {
      const pts: number[] = [];
      for (let i = 0; i < 24; i++) {
        const t = i / 23;
        pts.push(Math.min(1, (a.risk / 100) * t * 1.2 + (Math.random() - 0.5) * 0.08));
      }
      return pts;
    });

    const statusColor = (s: string) =>
      s === "critical" ? "#e84040" : s === "warning" ? "#e8a020" : s === "nominal" ? "#20b8cc" : "#20cc78";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Planetary Health Report — ${dateStr}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Space Grotesk',sans-serif;background:#05080f;color:#d4dde8;padding:40px 48px;max-width:960px;margin:0 auto;line-height:1.5;}
  .mono{font-family:'JetBrains Mono',monospace;}
  /* Header */
  .header{border-bottom:1px solid #1a2535;padding-bottom:28px;margin-bottom:36px;}
  .atlas-tag{font-size:9px;letter-spacing:0.35em;color:#00d4ff;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
  .headline{font-size:30px;font-weight:700;color:#e8f4ff;line-height:1.15;letter-spacing:-0.01em;}
  .subtitle{font-size:13px;color:#5a7090;margin-top:6px;}
  .meta-row{display:flex;gap:24px;margin-top:18px;flex-wrap:wrap;}
  .meta-item{font-size:9px;font-family:'JetBrains Mono',monospace;color:#3d5270;letter-spacing:0.1em;text-transform:uppercase;}
  .meta-item span{color:#6080a0;}
  /* Section */
  .section{margin-bottom:36px;}
  .section-label{font-size:8px;letter-spacing:0.3em;text-transform:uppercase;color:#00d4ff;font-family:'JetBrains Mono',monospace;margin-bottom:14px;padding-bottom:7px;border-bottom:1px solid #0d1825;display:flex;align-items:center;gap:8px;}
  .section-label::before{content:'';display:block;width:16px;height:1px;background:#00d4ff;}
  /* Health score */
  .hs-row{display:flex;gap:24px;align-items:stretch;}
  .hs-card{flex:0 0 auto;background:#0a1220;border:1px solid #1a2535;border-radius:6px;padding:24px 28px;text-align:center;}
  .hs-num{font-size:68px;font-weight:800;font-family:'JetBrains Mono',monospace;line-height:1;}
  .hs-label{font-size:10px;letter-spacing:0.2em;color:#6b7f99;text-transform:uppercase;margin-top:6px;}
  .hs-status{font-size:13px;font-weight:700;letter-spacing:0.12em;margin-top:4px;}
  .hs-desc{flex:1;background:#08111c;border:1px solid #1a2535;border-radius:6px;padding:20px;display:flex;flex-direction:column;justify-content:center;}
  .hs-desc p{font-size:12px;color:#6b7f99;line-height:1.7;}
  /* Alert badges */
  .badge-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
  .badge{padding:4px 10px;border-radius:4px;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:0.1em;text-transform:uppercase;}
  .badge-critical{background:#e84040/15;border:1px solid #e84040;color:#e84040;background-color:rgba(232,64,64,0.12);}
  .badge-warning{background-color:rgba(232,160,32,0.12);border:1px solid #e8a020;color:#e8a020;}
  /* Vitals */
  .vitals-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .vital-card{background:#08111c;border:1px solid #1a2535;border-radius:6px;padding:16px;position:relative;overflow:hidden;}
  .vital-bar{position:absolute;left:0;top:0;bottom:0;width:3px;}
  .vital-label{font-size:8px;letter-spacing:0.2em;color:#3d5270;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:5px;margin-left:10px;}
  .vital-val{font-size:22px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-left:10px;}
  .vital-unit{font-size:11px;font-weight:400;color:#4a6070;margin-left:3px;}
  .vital-base{font-size:9px;color:#3d5270;margin-top:3px;margin-left:10px;}
  .vital-desc{font-size:9px;color:#3d5270;margin-top:2px;margin-left:10px;}
  /* Progress bar */
  .progress-track{height:3px;background:#111820;border-radius:2px;margin:8px 10px 0;}
  .progress-fill{height:100%;border-radius:2px;}
  /* Alerts */
  .alerts-list{display:flex;flex-direction:column;gap:12px;}
  .alert-card{background:#08111c;border-radius:0 6px 6px 0;padding:14px 16px;display:flex;gap:16px;align-items:flex-start;border-left:3px solid;}
  .alert-high{border-color:#e84040;}
  .alert-medium{border-color:#e8a020;}
  .alert-monitor{border-color:#20b8cc;}
  .alert-icon{font-size:20px;line-height:1;flex-shrink:0;margin-top:2px;}
  .alert-body{flex:1;}
  .alert-sys{font-size:13px;font-weight:600;color:#d4dde8;margin-bottom:3px;}
  .alert-region{font-size:9px;font-family:'JetBrains Mono',monospace;color:#3d5270;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px;}
  .alert-msg{font-size:11px;color:#6b7f99;line-height:1.6;}
  .alert-indicator{font-size:9px;font-family:'JetBrains Mono',monospace;color:#3d5270;margin-top:4px;}
  .alert-right{text-align:right;flex-shrink:0;}
  .alert-risk{font-size:24px;font-weight:700;font-family:'JetBrains Mono',monospace;line-height:1;}
  .alert-risk-label{font-size:8px;letter-spacing:0.15em;color:#3d5270;text-transform:uppercase;}
  .alert-sparkline{margin-top:6px;}
  /* Delta */
  .delta-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;}
  .delta-card{background:#08111c;border:1px solid #1a2535;border-radius:6px;padding:12px;text-align:center;}
  .delta-val{font-size:15px;font-weight:700;font-family:'JetBrains Mono',monospace;}
  .delta-lbl{font-size:8px;color:#3d5270;text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;font-family:'JetBrains Mono',monospace;}
  .delta-row{display:flex;justify-content:space-between;padding:3px 0;font-size:9px;font-family:'JetBrains Mono',monospace;}
  .delta-row span{color:#3d5270;}
  .delta-row strong{color:#6080a0;}
  /* Cascade section */
  .cascade-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
  .cascade-chain{background:#08111c;border:1px solid #1a2535;border-radius:6px;padding:16px;}
  .cascade-title{font-size:11px;font-weight:600;color:#d4dde8;margin-bottom:8px;}
  .cascade-desc{font-size:10px;color:#5a7090;line-height:1.6;margin-bottom:10px;}
  .cascade-nodes{display:flex;flex-direction:column;gap:4px;}
  .cascade-node{display:flex;align-items:center;gap:8px;font-size:9px;font-family:'JetBrains Mono',monospace;}
  .cascade-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
  .cascade-label{color:#8899aa;}
  .cascade-prob{margin-left:auto;font-weight:600;}
  .cascade-impact{margin-top:10px;display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}
  .ci-item{background:#0d1825;border-radius:4px;padding:6px 8px;text-align:center;}
  .ci-val{font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#e84040;}
  .ci-lbl{font-size:7px;color:#3d5270;text-transform:uppercase;letter-spacing:0.1em;margin-top:2px;}
  /* Footer */
  .footer{margin-top:52px;padding-top:18px;border-top:1px solid #0d1825;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;}
  .footer-text{font-size:8px;color:#1e2d40;letter-spacing:0.15em;font-family:'JetBrains Mono',monospace;text-transform:uppercase;}
  /* Print */
  @media print{
    body{background:#fff;color:#111;padding:20px;}
    .vital-card,.alert-card,.delta-card,.hs-card,.hs-desc,.cascade-chain,.ci-item{background:#f8f8f8;border-color:#ddd;}
    .vital-label,.alert-region,.alert-indicator,.delta-lbl,.footer-text,.delta-row span,.cascade-label,.ci-lbl{color:#555;}
    .alert-msg,.alert-sys,.headline,.delta-row strong,.vital-val,.alert-risk,.cascade-title{color:#111;}
    .subtitle,.hs-desc p,.cascade-desc{color:#444;}
  }
</style>
</head>
<body>

<div class="header">
  <div class="atlas-tag">ATLAS · Planetary Pulse Dashboard</div>
  <div class="headline">Planetary Health Brief</div>
  <div class="subtitle">${dateStr} · Compiled by Atlas Mission Control System</div>
  <div class="meta-row">
    <div class="meta-item">DATA SOURCES <span>NASA · ESA Sentinel · MODIS · Landsat · NOAA</span></div>
    <div class="meta-item">VERSION <span>2026.03</span></div>
    <div class="meta-item">CLASSIFICATION <span>Open Scientific Brief</span></div>
    <div class="meta-item">GENERATED <span>${now.toISOString().slice(0,19).replace("T"," ")} UTC</span></div>
  </div>
</div>

<!-- 01 Health Index -->
<div class="section">
  <div class="section-label">01 · Planetary Health Index</div>
  <div class="hs-row">
    <div class="hs-card">
      <div class="hs-num" style="color:${healthScore >= 75 ? "#20cc78" : healthScore >= 55 ? "#e8a020" : "#e84040"}">${healthScore}</div>
      <div class="hs-label">Health Score / 100</div>
      <div class="hs-status" style="color:${healthScore >= 75 ? "#20cc78" : healthScore >= 55 ? "#e8a020" : "#e84040"}">${healthScore < 55 ? "CRITICAL" : healthScore < 70 ? "STRESSED" : "NOMINAL"}</div>
    </div>
    <div class="hs-desc">
      <p>Composite index integrating climate stability, ecosystem health, biodiversity, freshwater availability, and cryosphere integrity. Updated continuously from live sensor networks spanning NASA, ESA Sentinel, MODIS, Landsat, and NOAA monitoring systems.</p>
      <div class="badge-row">
        ${critCount > 0 ? `<div class="badge badge-critical">${critCount} CRITICAL VITAL${critCount > 1 ? "S" : ""}</div>` : ""}
        ${warnCount > 0 ? `<div class="badge badge-warning">${warnCount} WARNING${warnCount > 1 ? "S" : ""}</div>` : ""}
        <div class="badge" style="background:rgba(0,212,255,0.1);border:1px solid #00d4ff20;color:#00d4ff60;">STREAMS ACTIVE</div>
      </div>
    </div>
  </div>
</div>

<!-- 02 Vital Signs -->
<div class="section">
  <div class="section-label">02 · Planetary Vital Signs</div>
  <div class="vitals-grid">
    ${vitals.map(v => {
      const c = statusColor(v.status);
      const pct = Math.min(100, Math.max(0, v.progress));
      return `
      <div class="vital-card">
        <div class="vital-bar" style="background:${c}"></div>
        <div class="vital-label">${v.label}</div>
        <div class="vital-val" style="color:${c}">${v.displayValue}<span class="vital-unit">${v.unit}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${c}"></div></div>
        <div class="vital-base">${v.baseline}</div>
        <div class="vital-desc">${v.description}</div>
      </div>
      `;
    }).join("")}
  </div>
</div>

<!-- 03 Tipping Point Alerts -->
<div class="section">
  <div class="section-label">03 · Tipping Point Risk Alerts</div>
  <div class="alerts-list">
    ${tippingAlerts.map((a, i) => {
      const c = statusColor(a.severity === "high" ? "critical" : a.severity === "medium" ? "warning" : "nominal");
      const sparkSvg = buildSparkline(riskSparkData[i] || [], 80, 28, c);
      return `
      <div class="alert-card alert-${a.severity}">
        <div class="alert-icon">${a.icon}</div>
        <div class="alert-body">
          <div class="alert-sys">${a.system}</div>
          <div class="alert-region">${a.region}</div>
          <div class="alert-msg">${a.message}</div>
          <div class="alert-indicator">${a.indicator}</div>
        </div>
        <div class="alert-right">
          <div class="alert-risk" style="color:${c}">${a.risk}%</div>
          <div class="alert-risk-label">RISK</div>
          <div class="alert-sparkline">${sparkSvg}</div>
        </div>
      </div>
      `;
    }).join("")}
  </div>
</div>

<!-- 04 Delta 1980→2024 -->
<div class="section">
  <div class="section-label">04 · Time Machine Delta · 1980 → 2024</div>
  <div class="delta-grid">
    <div class="delta-card">
      <div class="delta-val" style="color:#e84040">+144 ppm</div>
      <div class="delta-lbl">CO₂ Change</div>
      <div class="delta-row"><span>1980</span><strong>${stats1980.co2} ppm</strong></div>
      <div class="delta-row"><span>2024</span><strong>${stats2024.co2} ppm</strong></div>
    </div>
    <div class="delta-card">
      <div class="delta-val" style="color:#e84040">+1.67°C</div>
      <div class="delta-lbl">Temp Δ</div>
      <div class="delta-row"><span>1980</span><strong>+${stats1980.temp}°C</strong></div>
      <div class="delta-row"><span>2024</span><strong>+${stats2024.temp}°C</strong></div>
    </div>
    <div class="delta-card">
      <div class="delta-val" style="color:#e84040">−3.4 Mkm²</div>
      <div class="delta-lbl">Arctic Ice Loss</div>
      <div class="delta-row"><span>1980</span><strong>${stats1980.arctic} Mkm²</strong></div>
      <div class="delta-row"><span>2024</span><strong>${stats2024.arctic} Mkm²</strong></div>
    </div>
    <div class="delta-card">
      <div class="delta-val" style="color:#e8a020">−18%</div>
      <div class="delta-lbl">Forest Cover</div>
      <div class="delta-row"><span>1980</span><strong>${stats1980.forest}%</strong></div>
      <div class="delta-row"><span>2024</span><strong>${stats2024.forest}%</strong></div>
    </div>
    <div class="delta-card">
      <div class="delta-val" style="color:#e8a020">+210 mm</div>
      <div class="delta-lbl">Sea Level Rise</div>
      <div class="delta-row"><span>1980</span><strong>+0 mm</strong></div>
      <div class="delta-row"><span>2024</span><strong>+${stats2024.sea} mm</strong></div>
    </div>
  </div>
</div>

<!-- 05 Cascade Chains -->
<div class="section">
  <div class="section-label">05 · Tipping Cascade Risk Chains</div>
  <div class="cascade-grid">
    <!-- Amazon Cascade -->
    <div class="cascade-chain">
      <div class="cascade-title">🌿 Amazon Savannification Cascade</div>
      <div class="cascade-desc">Deforestation beyond the ~20–25% threshold triggers irreversible savannification, disrupting global monsoon systems and releasing ~90 Gt CO₂.</div>
      <div class="cascade-nodes">
        ${[
          { icon: "🌿", label: "Amazon Tipping",    prob: "100%", c: "#e84040" },
          { icon: "🌵", label: "Sahel Drying",       prob: "74%",  c: "#e8a020" },
          { icon: "🌊", label: "AMOC Slowdown",      prob: "68%",  c: "#e8a020" },
          { icon: "🧊", label: "Arctic Sea Ice Loss",prob: "82%",  c: "#e84040" },
          { icon: "🏔️", label: "Permafrost Thaw",   prob: "61%",  c: "#e8a020" },
          { icon: "🪸", label: "Coral Bleaching",    prob: "55%",  c: "#20b8cc" },
        ].map(n => `
          <div class="cascade-node">
            <div class="cascade-dot" style="background:${n.c}"></div>
            <span style="font-size:11px">${n.icon}</span>
            <span class="cascade-label">${n.label}</span>
            <span class="cascade-prob" style="color:${n.c}">${n.prob}</span>
          </div>
        `).join("")}
      </div>
      <div class="cascade-impact">
        <div class="ci-item"><div class="ci-val">+90 Gt</div><div class="ci-lbl">CO₂ Released</div></div>
        <div class="ci-item"><div class="ci-val">+1.5°C</div><div class="ci-lbl">Temp Increase</div></div>
        <div class="ci-item"><div class="ci-val">6</div><div class="ci-lbl">Systems Tipped</div></div>
        <div class="ci-item"><div class="ci-val">>500 yr</div><div class="ci-lbl">Recovery ETA</div></div>
      </div>
    </div>
    <!-- WAIS Cascade -->
    <div class="cascade-chain">
      <div class="cascade-title">🧊 West Antarctic Ice Sheet Collapse</div>
      <div class="cascade-desc">Marine ice sheet instability at Thwaites glacier triggers irreversible WAIS collapse, raising sea levels 3–5m and disrupting global circulation.</div>
      <div class="cascade-nodes">
        ${[
          { icon: "🧊", label: "WAIS Collapse",             prob: "100%", c: "#e84040" },
          { icon: "🌊", label: "Sea Level Rise (+3–5m)",    prob: "95%",  c: "#e84040" },
          { icon: "🌀", label: "AMOC Disruption",           prob: "72%",  c: "#e8a020" },
          { icon: "🌵", label: "Sahel Monsoon Failure",     prob: "58%",  c: "#e8a020" },
          { icon: "🌲", label: "Boreal Forest Die-back",    prob: "48%",  c: "#20b8cc" },
        ].map(n => `
          <div class="cascade-node">
            <div class="cascade-dot" style="background:${n.c}"></div>
            <span style="font-size:11px">${n.icon}</span>
            <span class="cascade-label">${n.label}</span>
            <span class="cascade-prob" style="color:${n.c}">${n.prob}</span>
          </div>
        `).join("")}
      </div>
      <div class="cascade-impact">
        <div class="ci-item"><div class="ci-val">+3–5m</div><div class="ci-lbl">Sea Level Rise</div></div>
        <div class="ci-item"><div class="ci-val">~1B</div><div class="ci-lbl">People Displaced</div></div>
        <div class="ci-item"><div class="ci-val">5</div><div class="ci-lbl">Systems Tipped</div></div>
        <div class="ci-item"><div class="ci-val">>10k yr</div><div class="ci-lbl">Recovery ETA</div></div>
      </div>
    </div>
  </div>
</div>

<div class="footer">
  <div class="footer-text">ATLAS · PLANETARY PULSE · MISSION CONTROL</div>
  <div class="footer-text">GENERATED ${now.toISOString().slice(0,19).replace("T"," ")} UTC</div>
  <div class="footer-text">OPEN SCIENTIFIC BRIEF — FREE DISTRIBUTION</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `planetary-health-brief-${now.toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vitals, healthScore, tippingAlerts, stats1980, stats2024]);

  return (
    <button
      onClick={generateReport}
      className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-muted-foreground border border-muted/20 rounded-sm px-2.5 py-1.5 hover:bg-muted/20 hover:text-foreground hover:border-muted/40 transition-all"
      title="Download Planetary Health Brief"
    >
      <FileText className="w-3 h-3" />
      REPORT
    </button>
  );
}
