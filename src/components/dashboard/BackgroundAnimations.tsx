import { useEffect, useState, useMemo } from "react";

interface Light {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface Camera {
  id: number;
  x: number;
  y: number;
  delay: number;
}

export const BackgroundAnimations = ({ isMobile }: { isMobile: boolean }) => {
  const [lights, setLights] = useState<Light[]>([]);

  // Generate random apartment lights
  const apartmentLights = useMemo(() => {
    const count = isMobile ? 12 : 25;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      // Spread across building areas (middle-lower portion of screen)
      x: 10 + Math.random() * 80,
      y: 25 + Math.random() * 55,
      size: isMobile ? 2 + Math.random() * 3 : 3 + Math.random() * 5,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 6,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, [isMobile]);

  // Generate camera positions (fewer, specific spots)
  const cameras = useMemo<Camera[]>(() => {
    const base: Camera[] = [
      { id: 0, x: 8, y: 35, delay: 0 },
      { id: 1, x: 92, y: 30, delay: 1.5 },
      { id: 2, x: 25, y: 55, delay: 0.8 },
      { id: 3, x: 75, y: 50, delay: 2.2 },
      { id: 4, x: 50, y: 20, delay: 3.0 },
    ];
    return isMobile ? base.slice(0, 3) : base;
  }, [isMobile]);

  // Randomize which lights are on/off
  useEffect(() => {
    const interval = setInterval(() => {
      setLights(
        apartmentLights.map((l) => ({
          ...l,
          opacity: Math.random() > 0.4 ? 0.3 + Math.random() * 0.6 : 0,
        }))
      );
    }, 2000);
    setLights(apartmentLights);
    return () => clearInterval(interval);
  }, [apartmentLights]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
      <style>{`
        @keyframes camera-blink {
          0%, 85%, 100% { opacity: 0.15; box-shadow: 0 0 3px 1px rgba(255,0,0,0.2); }
          90% { opacity: 1; box-shadow: 0 0 8px 3px rgba(255,0,0,0.7), 0 0 20px 6px rgba(255,0,0,0.3); }
        }
        @keyframes light-flicker {
          0% { opacity: 0; }
          10% { opacity: var(--light-opacity); }
          90% { opacity: var(--light-opacity); }
          100% { opacity: 0; }
        }
        .camera-dot {
          animation: camera-blink 3s ease-in-out infinite;
        }
        .apt-light {
          transition: opacity 1.5s ease-in-out;
        }
      `}</style>

      {/* Camera blinking dots */}
      {cameras.map((cam) => (
        <div
          key={`cam-${cam.id}`}
          className="absolute camera-dot rounded-full"
          style={{
            left: `${cam.x}%`,
            top: `${cam.y}%`,
            width: isMobile ? 4 : 6,
            height: isMobile ? 4 : 6,
            backgroundColor: '#ff1a1a',
            animationDelay: `${cam.delay}s`,
          }}
        />
      ))}

      {/* Apartment lights */}
      {lights.map((light) => (
        <div
          key={`light-${light.id}`}
          className="absolute apt-light rounded-sm"
          style={{
            left: `${light.x}%`,
            top: `${light.y}%`,
            width: light.size,
            height: light.size * 0.7,
            backgroundColor: `rgba(255, 230, 150, ${light.opacity})`,
            boxShadow: light.opacity > 0.3
              ? `0 0 ${light.size * 2}px rgba(255, 220, 100, ${light.opacity * 0.5})`
              : 'none',
          }}
        />
      ))}
    </div>
  );
};
