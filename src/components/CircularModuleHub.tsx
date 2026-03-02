import { useEffect, useState, useMemo } from "react";

export interface CircularModule {
  id: string;
  title: string;
  iconSrc: string;
  path: string;
  disabled?: boolean;
  scaleIcon?: boolean;
  iconScale?: string;
}

interface CircularModuleHubProps {
  modules: CircularModule[];
  badgeCounts?: Record<string, number>;
  onNavigate: (path: string) => void;
  onPrefetch?: (path: string) => void;
}

// Responsive breakpoints for circular layout
const useCircularConfig = (moduleCount: number) => {
  const [config, setConfig] = useState({ radius: 260, iconSize: 112, fontSize: 13, labelWidth: 120, containerW: 700, containerH: 520 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const available = Math.min(w, h - 180); // subtract header space

      if (w >= 1536) {
        // 2XL
        const r = Math.min(320, available * 0.35);
        setConfig({ radius: r, iconSize: 120, fontSize: 14, labelWidth: 130, containerW: r * 2 + 180, containerH: r * 2 + 140 });
      } else if (w >= 1280) {
        // XL
        const r = Math.min(280, available * 0.33);
        setConfig({ radius: r, iconSize: 108, fontSize: 13, labelWidth: 120, containerW: r * 2 + 160, containerH: r * 2 + 120 });
      } else if (w >= 1024) {
        // LG
        const r = Math.min(230, available * 0.3);
        setConfig({ radius: r, iconSize: 92, fontSize: 12, labelWidth: 110, containerW: r * 2 + 140, containerH: r * 2 + 100 });
      } else {
        // MD
        const r = Math.min(185, available * 0.28);
        setConfig({ radius: r, iconSize: 76, fontSize: 11, labelWidth: 95, containerW: r * 2 + 120, containerH: r * 2 + 80 });
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [moduleCount]);

  return config;
};

const getModulePosition = (index: number, total: number, radius: number) => {
  const angleStep = (2 * Math.PI) / total;
  const angle = -Math.PI / 2 + index * angleStep;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

export const CircularModuleHub = ({ modules, badgeCounts = {}, onNavigate, onPrefetch }: CircularModuleHubProps) => {
  const config = useCircularConfig(modules.length);

  const hoverStyles = useMemo(() => `
    .chub-icon {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .chub-icon:hover {
      transform: scale(1.12) translateY(-4px);
    }
    .chub-icon:hover .chub-ring {
      box-shadow: 0 0 30px rgba(255,255,255,0.5), 0 8px 25px rgba(0,0,0,0.2);
    }
    .chub-icon:active {
      transform: scale(1.04) translateY(-1px);
    }
    .chub-ring {
      transition: box-shadow 0.25s ease;
    }
  `, []);

  return (
    <>
      <style>{hoverStyles}</style>
      {/* Desktop circular layout - hidden on mobile */}
      <div
        className="hidden md:block relative"
        style={{ width: `${config.containerW}px`, height: `${config.containerH}px` }}
      >
        {modules.map((module, index) => {
          const { x, y } = getModulePosition(index, modules.length, config.radius);
          const badge = badgeCounts[module.path] || 0;

          return (
            <div
              key={module.id}
              className={`absolute chub-icon ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
              onClick={() => !module.disabled && onNavigate(module.path)}
              onMouseEnter={() => !module.disabled && onPrefetch?.(module.path)}
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold shadow-lg z-20 ring-2 ring-white"
                      style={{ width: 22, height: 22, fontSize: 10 }}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                  <div
                    className="chub-ring rounded-full overflow-hidden shadow-xl"
                    style={{
                      width: config.iconSize,
                      height: config.iconSize,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      border: `${config.iconSize > 100 ? 4 : 3}px solid rgba(255,255,255,0.35)`,
                    }}
                  >
                    <img
                      src={module.iconSrc}
                      alt={module.title}
                      className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`}
                    />
                  </div>
                </div>
                <p
                  className="text-center font-bold text-white leading-tight whitespace-pre-line mt-2"
                  style={{
                    fontSize: config.fontSize,
                    maxWidth: config.labelWidth,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    lineHeight: 1.25,
                  }}
                >
                  {module.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
