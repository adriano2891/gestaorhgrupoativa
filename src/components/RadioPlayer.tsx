import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Radio, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";

const STATIONS = [
  { name: "Jovem Pan", url: "https://stream.zeno.fm/yn65fsaurfhvv" },
  { name: "Band FM", url: "https://stream.zeno.fm/4s2hcbps2g8uv" },
  { name: "Mix FM", url: "https://stream.zeno.fm/ra15gdam3fquv" },
  { name: "Antena 1", url: "https://stream.zeno.fm/0r0xa792kwzuv" },
  { name: "MPB FM", url: "https://stream.zeno.fm/phr7ygs9x18uv" },
];

export const RadioPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const station = STATIONS[stationIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = station.url;
      if (playing) audioRef.current.play().catch(() => {});
    }
  }, [stationIdx]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const changeStation = (dir: number) => {
    setStationIdx((prev) => (prev + dir + STATIONS.length) % STATIONS.length);
  };

  return (
    <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 border border-primary/20">
      <audio ref={audioRef} muted={muted} />
      <Radio className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      <span className="text-[11px] font-medium text-foreground max-w-[70px] truncate hidden lg:inline" title={station.name}>
        {station.name}
      </span>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStation(-1)}>
          <SkipBack className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePlay}>
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStation(1)}>
          <SkipForward className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }}>
          {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
};
