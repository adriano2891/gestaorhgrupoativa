import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Radio, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";

const STATIONS = [
  { name: "Jovem Pan", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/JOVEMPAN_FMAAC.aac" },
  { name: "Band FM 96.1", url: "https://evpp.mm.uol.com.br:8443/band_rj/aac" },
  { name: "Mix FM 106.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFMSP_FMAAC.aac" },
  { name: "Antena 1 94.7", url: "https://antena1.crossradio.com.br/stream/1;" },
  { name: "Nativa FM 95.3", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/NATIVAFM_FMAAC.aac" },
  { name: "Alpha FM 101.7", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/ALPHAFM_FMAAC.aac" },
  { name: "89 FM Rock", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/89FM_FMAAC.aac" },
  { name: "CBN SP 90.5", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac" },
  { name: "BandNews 96.9", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC.aac" },
  { name: "Transamérica", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/TRANSISTAAC.aac" },
  { name: "Tupi FM 96.5", url: "https://stream.zeno.fm/yn65fsaurfhvv" },
  { name: "Kiss FM 92.5", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/KISSFM_FMAAC.aac" },
  { name: "Nova Brasil 89.7", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/NOVABRASILFM_FMAAC.aac" },
  { name: "Metropolitana 98.5", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/METROFM_FMAAC.aac" },
  { name: "Mundo Livre FM", url: "https://playerservices.streamtheworld.com/api/livestream-redirect/MUNDOLIVRE_FMAAC.aac" },
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
