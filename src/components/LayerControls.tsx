import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export interface Layer {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const LAYERS: Layer[] = [
  { id: "none",   label: "DEFAULT",       icon: "🌍", color: "hsl(185 100% 50%)", description: "Base visualization"    },
  { id: "forest", label: "FOREST",        icon: "🌿", color: "hsl(142 70% 45%)",  description: "Vegetation vitality"  },
  { id: "ocean",  label: "OCEAN HEAT",    icon: "🌊", color: "hsl(210 100% 55%)", description: "Sea surface temps"    },
  { id: "ice",    label: "ICE MASS",      icon: "🧊", color: "hsl(200 80% 80%)",  description: "Cryosphere extent"    },
  { id: "co2",    label: "CARBON",        icon: "💨", color: "hsl(38 95% 55%)",   description: "Atmospheric CO₂"     },
  { id: "heat",   label: "HEAT ISLANDS",  icon: "🔥", color: "hsl(0 85% 60%)",    description: "Urban heat zones"     },
  { id: "soil",   label: "SOIL",          icon: "🌱", color: "hsl(30 60% 45%)",   description: "Moisture index"       },
  { id: "impact", label: "HUMAN IMPACT",  icon: "🏭", color: "hsl(290 80% 65%)",  description: "Cities · Mines · Restoration" },
  { id: "regen",  label: "REGEN CAPITAL", icon: "💚", color: "hsl(142 90% 45%)",  description: "Capital deployed · Recovery signal" },
];

interface LayerControlsProps {
  activeLayer: string;
  onLayerChange: (id: string) => void;
}

export default function LayerControls({ activeLayer, onLayerChange }: LayerControlsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span className="font-display text-[10px] tracking-[0.2em] text-foreground/80">DATA LAYERS</span>
      </div>

      <div className="flex flex-col gap-1.5">
        {LAYERS.map((layer, i) => {
          const isActive = activeLayer === layer.id;
          return (
            <motion.button
              key={layer.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onLayerChange(layer.id)}
              className={`relative flex items-center gap-3 rounded-sm px-3 py-2 text-left transition-all duration-200 border ${
                isActive
                  ? "border-primary/30 bg-primary/8"
                  : "border-transparent hover:border-border hover:bg-muted/50"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeLayer"
                  className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-sm"
                  style={{ backgroundColor: layer.color }}
                />
              )}
              <span className="text-base leading-none">{layer.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-data text-[10px] tracking-widest font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {layer.label}
                </div>
                <div className="font-data text-[9px] text-muted-foreground/60 mt-0.5">{layer.description}</div>
              </div>
              {isActive && (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: layer.color }} />
                  <span className="font-data text-[8px] text-muted-foreground tracking-widest">ON</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-border/30">
        <div className="font-data text-[8px] text-muted-foreground/40 tracking-wider leading-relaxed">
          DATA SOURCES<br />
          NASA · ESA Sentinel · MODIS<br />
          Landsat · NOAA · Planet Labs
        </div>
      </div>
    </div>
  );
}
