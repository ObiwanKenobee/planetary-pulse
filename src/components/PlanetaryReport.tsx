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

export default function PlanetaryReport({ vitals, healthScore, tippingAlerts }: PlanetaryReportProps) {
  const stats1980 = getYearStats(1980);
  const stats2024 = getYearStats(2024);

  const generateReport = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Planetary Health Report — ${dateStr}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Space Grotesk',sans-serif;background:#05080f;color:#d4dde8;padding:40px;max-width:900px;margin:0 auto;}
  .mono{font-family:'JetBrains Mono',monospace;}
  .header{border-bottom:1px solid #1a2535;padding-bottom:24px;margin-bottom:32px;}
  .title{font-size:11px;letter-spacing:0.3em;color:#00d4ff;text-transform:uppercase;margin-bottom:8px;}
  .headline{font-size:28px;font-weight:700;color:#e8f4ff;line-height:1.2;}
  .subtitle{font-size:13px;color:#6b7f99;margin-top:6px;letter-spacing:0.05em;}
  .meta{display:flex;gap:24px;margin-top:16px;}
  .meta-item{font-size:10px;font-family:'JetBrains Mono',monospace;color:#3d5270;letter-spacing:0.1em;text-transform:uppercase;}
  .meta-item span{color:#8899aa;}
  .section{margin-bottom:32px;}
  .section-label{font-size:9px;letter-spacing:0.25em;text-transform:uppercase;color:#00d4ff;font-family:'JetBrains Mono',monospace;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #0d1825;}
  .health-score{display:flex;align-items:center;gap:20px;background:#0a1220;border:1px solid #1a2535;border-radius:4px;padding:20px;margin-bottom:20px;}
  .score-num{font-size:64px;font-weight:700;color:#e8a020;font-family:'JetBrains Mono',monospace;line-height:1;}
  .score-label{font-size:11px;letter-spacing:0.2em;color:#6b7f99;text-transform:uppercase;}
  .score-status{font-size:14px;font-weight:600;color:#e8a020;letter-spacing:0.1em;margin-top:4px;}
  .vitals-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
  .vital-card{background:#08111c;border:1px solid #1a2535;border-radius:4px;padding:14px;}
  .vital-label{font-size:8px;letter-spacing:0.2em;color:#3d5270;text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:4px;}
  .vital-val{font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;}
  .vital-base{font-size:9px;color:#3d5270;margin-top:2px;}
  .c-critical{color:#e84040;}
  .c-warning{color:#e8a020;}
  .c-nominal{color:#20b8cc;}
  .c-healthy{color:#20cc78;}
  .alerts-list{display:flex;flex-direction:column;gap:10px;}
  .alert-row{background:#08111c;border-left:3px solid;border-radius:0 4px 4px 0;padding:12px 14px;}
  .alert-high{border-color:#e84040;}
  .alert-medium{border-color:#e8a020;}
  .alert-monitor{border-color:#20b8cc;}
  .alert-sys{font-size:12px;font-weight:600;color:#d4dde8;margin-bottom:3px;}
  .alert-msg{font-size:11px;color:#6b7f99;}
  .alert-risk{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;float:right;}
  .delta-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
  .delta-card{background:#08111c;border:1px solid #1a2535;border-radius:4px;padding:10px;text-align:center;}
  .delta-val{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#e84040;}
  .delta-lbl{font-size:8px;color:#3d5270;text-transform:uppercase;letter-spacing:0.1em;margin-top:3px;}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #0d1825;display:flex;justify-content:space-between;align-items:center;}
  .footer-text{font-size:9px;color:#1e2d40;letter-spacing:0.15em;font-family:'JetBrains Mono',monospace;text-transform:uppercase;}
  @media print{body{background:#fff;color:#000;} .vital-card,.alert-row,.delta-card,.health-score{background:#f5f5f5;border-color:#ccc;}}
</style>
</head>
<body>
<div class="header">
  <div class="title">ATLAS · Planetary Pulse Dashboard</div>
  <div class="headline">Planetary Health Report</div>
  <div class="subtitle">${dateStr} · Compiled by Atlas Mission Control</div>
  <div class="meta">
    <div class="meta-item">SOURCE <span>NASA · ESA Sentinel · MODIS · Landsat</span></div>
    <div class="meta-item">VERSION <span>2026.03</span></div>
    <div class="meta-item">CLASSIFICATION <span>Open Scientific Brief</span></div>
  </div>
</div>

<div class="section">
  <div class="section-label">01 · Planetary Health Index</div>
  <div class="health-score">
    <div>
      <div class="score-num">${healthScore}</div>
    </div>
    <div>
      <div class="score-label">Health Score / 100</div>
      <div class="score-status">${healthScore < 55 ? "CRITICAL" : healthScore < 70 ? "STRESSED" : "NOMINAL"}</div>
      <div style="font-size:12px;color:#6b7f99;margin-top:8px;max-width:480px;">
        Composite index integrating climate stability, ecosystem health, biodiversity, freshwater availability, and agricultural resilience. Updates continuously from live sensor networks.
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-label">02 · Planetary Vital Signs</div>
  <div class="vitals-grid">
    ${vitals.map(v => `
    <div class="vital-card">
      <div class="vital-label">${v.label}</div>
      <div class="vital-val ${v.status === "critical" ? "c-critical" : v.status === "warning" ? "c-warning" : v.status === "nominal" ? "c-nominal" : "c-healthy"}">${v.displayValue}${v.unit}</div>
      <div class="vital-base">${v.baseline}</div>
      <div style="font-size:9px;color:#3d5270;margin-top:3px;">${v.description}</div>
    </div>
    `).join("")}
  </div>
</div>

<div class="section">
  <div class="section-label">03 · Tipping Point Risk Alerts</div>
  <div class="alerts-list">
    ${tippingAlerts.map(a => `
    <div class="alert-row alert-${a.severity}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="alert-sys">${a.icon} ${a.system} · ${a.region}</div>
          <div class="alert-msg">${a.message}</div>
          <div style="font-size:9px;font-family:'JetBrains Mono',monospace;color:#3d5270;margin-top:4px;">${a.indicator}</div>
        </div>
        <div class="alert-risk ${a.severity === "high" ? "c-critical" : a.severity === "medium" ? "c-warning" : "c-nominal"}">${a.risk}% RISK</div>
      </div>
    </div>
    `).join("")}
  </div>
</div>

<div class="section">
  <div class="section-label">04 · Time Machine Delta · 1980 → 2024</div>
  <div class="delta-grid">
    <div class="delta-card"><div class="delta-val c-critical">+144 ppm</div><div class="delta-lbl">CO₂ Change</div></div>
    <div class="delta-card"><div class="delta-val c-critical">+1.67°C</div><div class="delta-lbl">Temp Δ</div></div>
    <div class="delta-card"><div class="delta-val c-critical">−3.4 Mkm²</div><div class="delta-lbl">Arctic Ice Loss</div></div>
    <div class="delta-card"><div class="delta-val c-warning">−18%</div><div class="delta-lbl">Forest Cover</div></div>
    <div class="delta-card"><div class="delta-val c-warning">+210 mm</div><div class="delta-lbl">Sea Level Rise</div></div>
  </div>
  <div style="margin-top:14px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px;opacity:0.5;">
    ${["co2","temp","arctic","forest","sea"].map((k, i) => {
      const labels = ["CO₂ (ppm)", "Temp Δ (°C)", "Arctic (Mkm²)", "Forest (%)", "Sea Rise (mm)"];
      const v1980 = [stats1980.co2, stats1980.temp, stats1980.arctic, stats1980.forest, stats1980.sea][i];
      const v2024 = [stats2024.co2, stats2024.temp, stats2024.arctic, stats2024.forest, stats2024.sea][i];
      return `<div class="delta-card" style="font-size:8px;"><div style="color:#3d5270;">${labels[i]}</div><div style="font-family:'JetBrains Mono',monospace;margin-top:3px;">1980: ${v1980}</div><div style="font-family:'JetBrains Mono',monospace;">2024: ${v2024}</div></div>`;
    }).join("")}
  </div>
</div>

<div class="footer">
  <div class="footer-text">ATLAS · PLANETARY PULSE · MISSION CONTROL</div>
  <div class="footer-text">Generated ${now.toISOString().slice(0,19).replace("T"," ")} UTC</div>
  <div class="footer-text">CONFIDENTIAL — SCIENTIFIC USE ONLY</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `planetary-health-report-${now.toISOString().slice(0,10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [vitals, healthScore, tippingAlerts, stats1980, stats2024]);

  return (
    <button
      onClick={generateReport}
      className="flex items-center gap-1.5 font-data text-[9px] tracking-widest text-muted-foreground border border-muted/20 rounded-sm px-2.5 py-1.5 hover:bg-muted/20 hover:text-foreground hover:border-muted/40 transition-all"
      title="Download Planetary Health Report"
    >
      <FileText className="w-3 h-3" />
      REPORT
    </button>
  );
}
