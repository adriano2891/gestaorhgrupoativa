import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoPlayerProps {
  url: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  initialPosition?: number;
}

type VideoSourceType = "youtube" | "drive" | "direct";

// Detectar tipo de fonte
const detectVideoSource = (url: string): VideoSourceType => {
  if (!url) return "direct";
  
  // YouTube - diversos formatos
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  
  // Google Drive
  if (url.includes("drive.google.com")) return "drive";
  
  // Qualquer outro link (incluindo Supabase Storage) é tratado como direto
  return "direct";
};

// Converter URLs para formato de embed quando necessário
const getEmbedUrl = (url: string, sourceType: VideoSourceType): string => {
  if (sourceType === "youtube") {
    // Converter youtube.com/watch?v=ID para youtube.com/embed/ID
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
    }
  }
  
  if (sourceType === "drive") {
    // Converter drive.google.com/file/d/ID para formato de embed
    const fileIdMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }
  
  return url;
};

// Componente para player de vídeo direto (upload/link direto)
const DirectVideoPlayer = ({ 
  url, 
  onTimeUpdate, 
  onEnded, 
  initialPosition 
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reset states quando URL muda
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  useEffect(() => {
    if (videoRef.current && initialPosition && !isLoading) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition, isLoading]);

  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
    hideControlsAfterDelay();
  };

  const handlePlayPause = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Erro ao reproduzir:", err);
          setHasError(true);
          setErrorMessage("Não foi possível reproduzir o vídeo");
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time, duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage("");
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    console.error("Erro no vídeo:", error);
    setIsLoading(false);
    setHasError(true);
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setErrorMessage("O carregamento do vídeo foi interrompido");
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          setErrorMessage("Erro de rede ao carregar o vídeo");
          break;
        case MediaError.MEDIA_ERR_DECODE:
          setErrorMessage("Erro ao decodificar o vídeo");
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setErrorMessage(
            "Formato não suportado. Seu vídeo pode estar em H.265 (HEVC). " +
            "Converta para H.264 (AVC) usando HandBrake, VLC ou Adobe Media Encoder."
          );
          break;
        default:
          setErrorMessage("Erro ao carregar o vídeo");
      }
    } else {
      setErrorMessage("Erro ao carregar o vídeo");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsLoading(false);
          setHasError(false);
        }}
        onLoadedData={() => {
          setIsLoading(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onError={handleError}
        muted={isMuted}
        playsInline
        preload="auto"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-white text-center mb-4 px-4">{errorMessage}</p>
          <Button 
            variant="outline" 
            onClick={handleRetry}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Play/Pause central overlay */}
      {!hasError && (
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handlePlayPause}
        >
          {!isPlaying && !isLoading && (
            <div className="bg-black/50 rounded-full p-4">
              <Play className="h-12 w-12 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Controles inferiores */}
      {!hasError && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Barra de progresso */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-runnable-track]:rounded-full"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.3) 100%)`
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handlePlayPause} 
                className="text-white hover:bg-white/20 h-9 w-9"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-white hover:bg-white/20 h-9 w-9"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <span className="text-white text-sm font-medium ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20 h-9 px-3"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {playbackSpeed}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        if (videoRef.current) {
                          videoRef.current.playbackRate = speed;
                        }
                      }}
                      className={playbackSpeed === speed ? "bg-accent" : ""}
                    >
                      {speed}x {speed === 1 && "(Normal)"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-white hover:bg-white/20 h-9 w-9"
                onClick={handleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para player de iframe (YouTube/Drive)
const IframeVideoPlayer = ({ url }: { url: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
        onLoad={() => setIsLoading(false)}
      />
      
      {/* Botão de fullscreen overlay */}
      <Button
        size="icon"
        variant="ghost"
        className="absolute bottom-4 right-4 text-white hover:bg-white/20 h-9 w-9 z-10 opacity-70 hover:opacity-100"
        onClick={handleFullscreen}
      >
        <Maximize className="h-5 w-5" />
      </Button>
    </div>
  );
};

// Player unificado que escolhe o componente correto
export const VideoPlayer = ({ 
  url, 
  onTimeUpdate, 
  onEnded, 
  initialPosition 
}: VideoPlayerProps) => {
  if (!url) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Play className="h-16 w-16 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">Selecione uma aula para começar</p>
        </div>
      </div>
    );
  }

  const sourceType = detectVideoSource(url);
  const embedUrl = getEmbedUrl(url, sourceType);

  if (sourceType === "youtube" || sourceType === "drive") {
    return <IframeVideoPlayer url={embedUrl} />;
  }

  return (
    <DirectVideoPlayer 
      url={url} 
      onTimeUpdate={onTimeUpdate} 
      onEnded={onEnded} 
      initialPosition={initialPosition}
    />
  );
};
