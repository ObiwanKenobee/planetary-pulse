import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  height?: number;        // pixel height when open
  accentColor?: string;   // tailwind text color class for the title chip
  children: ReactNode;
}

export default function CollapsiblePanel({
  title,
  subtitle,
  defaultOpen = true,
  height,
  accentColor = "text-primary/70",
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="panel-glass rounded-sm shadow-panel shrink-0 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/10 transition-colors border-b border-border/15"
      >
        <div className="flex items-center gap-2">
          <span className={`font-display text-[9px] tracking-[0.14em] ${accentColor}`}>{title}</span>
          {subtitle && (
            <span className="font-data text-[7px] text-muted-foreground/40 tracking-widest">{subtitle}</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: height ?? "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="p-3 h-full" style={height ? { height } : undefined}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
