import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, BellOff, Bell } from "lucide-react";
import type { VitalData } from "@/hooks/useRealtimeData";
import type { Alert } from "@/components/TippingPointModal";

interface BannerAlert {
  id: string;
  type: "vital" | "tipping";
  title: string;
  message: string;
  severity: "critical" | "warning";
  timestamp: number;
}

function buildAlerts(vitals: VitalData[], tippingAlerts: Alert[]): BannerAlert[] {
  const out: BannerAlert[] = [];

  vitals
    .filter(v => v.status === "critical")
    .forEach(v => {
      out.push({
        id:        `vital-${v.id}`,
        type:      "vital",
        title:     v.label,
        message:   `${v.displayValue}${v.unit} — ${v.description}`,
        severity:  "critical",
        timestamp: Date.now(),
      });
    });

  tippingAlerts
    .filter(a => a.risk >= 80)
    .forEach(a => {
      out.push({
        id:        `tip-${a.id}`,
        type:      "tipping",
        title:     a.system,
        message:   `Risk at ${a.risk}% — ${a.message}`,
        severity:  "critical",
        timestamp: Date.now(),
      });
    });

  return out;
}

interface CriticalAlertBannerProps {
  vitals: VitalData[];
  tippingAlerts: Alert[];
  onAlertClick?: (id: string) => void;
}

const SNOOZE_MS = 5 * 60 * 1000; // 5 minutes

export default function CriticalAlertBanner({ vitals, tippingAlerts, onAlertClick }: CriticalAlertBannerProps) {
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set());
  const [snoozed, setSnoozed]       = useState<Map<string, number>>(new Map());
  const [visibleIdx, setVisibleIdx] = useState(0);
  const [muted, setMuted]           = useState(false);

  const rawAlerts = buildAlerts(vitals, tippingAlerts);

  // Filter out dismissed and currently-snoozed
  const now = Date.now();
  const active = rawAlerts.filter(a => {
    if (dismissed.has(a.id)) return false;
    const snoozeUntil = snoozed.get(a.id);
    if (snoozeUntil && snoozeUntil > now) return false;
    return true;
  });

  // Cycle through multiple alerts every 4s
  useEffect(() => {
    if (active.length <= 1) { setVisibleIdx(0); return; }
    const id = setInterval(() => setVisibleIdx(i => (i + 1) % active.length), 4000);
    return () => clearInterval(id);
  }, [active.length]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const snooze = useCallback((id: string) => {
    setSnoozed(prev => new Map([...prev, [id, Date.now() + SNOOZE_MS]]));
  }, []);

  const dismissAll = useCallback(() => {
    active.forEach(a => dismiss(a.id));
  }, [active, dismiss]);

  if (muted || active.length === 0) {
    return (
      <AnimatePresence>
        {muted && active.length > 0 && (
          <motion.button
            key="muted-pill"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => setMuted(false)}
            className="fixed top-2 right-16 z-50 flex items-center gap-1.5 bg-critical/20 border border-critical/30 rounded-full px-3 py-1 font-data text-[9px] text-critical hover:bg-critical/30 transition-colors"
          >
            <BellOff className="w-3 h-3" />
            {active.length} ALERT{active.length > 1 ? "S" : ""} SILENCED
          </motion.button>
        )}
      </AnimatePresence>
    );
  }

  const current = active[visibleIdx] ?? active[0];
  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: -40, scaleY: 0.8 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: -20, scaleY: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 pointer-events-none"
      >
        <div
          className={`pointer-events-auto mx-auto max-w-4xl mt-2 mx-3 rounded-sm border shadow-lg flex items-center gap-3 px-4 py-2.5 ${
            current.severity === "critical"
              ? "bg-critical/12 border-critical/40"
              : "bg-warning/12 border-warning/40"
          }`}
        >
          {/* Pulsing dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              current.severity === "critical" ? "bg-critical" : "bg-warning"
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              current.severity === "critical" ? "bg-critical" : "bg-warning"
            }`} />
          </span>

          <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
            current.severity === "critical" ? "text-critical" : "text-warning"
          }`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className={`font-data text-[10px] font-bold tracking-widest ${
                current.severity === "critical" ? "text-critical" : "text-warning"
              }`}>
                {current.type === "vital" ? "VITAL CRITICAL" : "TIPPING POINT"}
              </span>
              <span className="font-data text-[10px] text-foreground/80 truncate">
                {current.title}
              </span>
              <span className="font-body text-[10px] text-muted-foreground truncate hidden sm:block">
                — {current.message}
              </span>
            </div>
          </div>

          {/* Alert counter */}
          {active.length > 1 && (
            <span className="font-data text-[9px] text-muted-foreground shrink-0">
              {visibleIdx + 1}/{active.length}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Tipping alert: click to open modal */}
            {current.type === "tipping" && onAlertClick && (
              <button
                onClick={() => onAlertClick(current.id.replace("tip-", ""))}
                className={`font-data text-[8px] tracking-widest px-2 py-1 rounded-sm border transition-colors ${
                  current.severity === "critical"
                    ? "border-critical/30 text-critical hover:bg-critical/15"
                    : "border-warning/30 text-warning hover:bg-warning/15"
                }`}
              >
                ANALYZE
              </button>
            )}

            <button
              onClick={() => snooze(current.id)}
              className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors"
              title="Snooze 5 minutes"
            >
              <BellOff className="w-3 h-3 text-muted-foreground" />
            </button>

            <button
              onClick={() => dismiss(current.id)}
              className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors"
              title="Dismiss"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>

            {active.length > 1 && (
              <button
                onClick={dismissAll}
                className="font-data text-[8px] text-muted-foreground/60 hover:text-muted-foreground px-1.5 py-1 rounded-sm hover:bg-muted/30 transition-colors"
                title="Dismiss all alerts"
              >
                ALL
              </button>
            )}

            <button
              onClick={() => setMuted(true)}
              className="p-1.5 rounded-sm hover:bg-muted/40 transition-colors"
              title="Mute all alerts"
            >
              <Bell className="w-3 h-3 text-muted-foreground/40" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
