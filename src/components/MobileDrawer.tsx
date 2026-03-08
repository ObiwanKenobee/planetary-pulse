import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, BarChart3, AlertTriangle, TrendingUp, ChevronDown, X } from "lucide-react";

interface MobileDrawerProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  badgeCount?: number;
  defaultOpen?: boolean;
}

export function MobileDrawerPanel({ children, title, icon, badgeCount, defaultOpen = false }: MobileDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-border/30">
      {/* Handle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-panel/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary/70">{icon}</span>
          <span className="font-display text-[10px] tracking-widest text-foreground/80">{title}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="font-data text-[8px] bg-critical/20 text-critical rounded-sm px-1.5 py-0.5">{badgeCount}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-background/95">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Full-screen mobile drawer overlay */
interface MobileOverlayDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileOverlayDrawer({ open, onClose, title, children }: MobileOverlayDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 md:hidden panel-glass rounded-t-lg border-t border-border/50 flex flex-col"
            style={{ maxHeight: "80vh" }}
          >
            {/* Drag handle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
              <span className="font-display text-[10px] tracking-widest text-foreground/80">{title}</span>
              <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted/40">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
