import { useState, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, SkipBack, Radio, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

const STATIONS = [
  { name: "Smooth Jazz", url: "https://stream.laut.fm/smooth-jazz" },
  { name: "Lo-Fi Hip Hop", url: "https://stream.laut.fm/lofi" },
  { name: "Chill Out", url: "https://stream.laut.fm/chillout" },
  { name: "Rock Radio", url: "https://stream.laut.fm/rock" },
  { name: "Pop Hits", url: "https://stream.laut.fm/pop" },
  { name: "Bossa Nova", url: "https://stream.laut.fm/bossanova" },
  { name: "Jazz Radio", url: "https://stream.laut.fm/jazz" },
  { name: "Klassik", url: "https://stream.laut.fm/klassik" },
  { name: "80s Hits", url: "https://stream.laut.fm/80er" },
  { name: "90s Hits", url: "https://stream.laut.fm/90er" },
  { name: "Blues", url: "https://stream.laut.fm/blues" },
  { name: "Reggae", url: "https://stream.laut.fm/reggae" },
];

export const RadioPlayer = () => {
  const [playing, setPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const station = STATIONS[stationIdx];

  const playStation = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoading(true);
    audio.src = url;
    audio.load();
    audio.play()
      .then(() => { setPlaying(true); setLoading(false); })
      .catch(() => {
        setPlaying(false);
        setLoading(false);
        toast.error("Não foi possível reproduzir esta estação");
      });
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      playStation(station.url);
    }
  };

  const changeStation = (dir: number) => {
    const newIdx = (stationIdx + dir + STATIONS.length) % STATIONS.length;
    setStationIdx(newIdx);
    if (playing) {
      playStation(STATIONS[newIdx].url);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-3 py-1.5 border border-primary/20">
      <audio ref={audioRef} muted={muted} crossOrigin="anonymous" preload="none" />
      <Radio className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      <span className="text-[11px] font-medium text-foreground max-w-[80px] truncate hidden lg:inline" title={station.name}>
        {station.name}
      </span>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStation(-1)} title="Estação anterior">
          <SkipBack className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePlay} disabled={loading} title={playing ? "Pausar" : "Reproduzir"}>
          {loading ? (
            <Radio className="h-3 w-3 animate-pulse" />
          ) : playing ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => changeStation(1)} title="Próxima estação">
          <SkipForward className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { const m = !muted; setMuted(m); if (audioRef.current) audioRef.current.muted = m; }} title={muted ? "Ativar som" : "Silenciar"}>
          {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
};
