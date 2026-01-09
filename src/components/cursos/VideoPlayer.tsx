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
  RefreshCw,
  FileText,
  Download,
  ExternalLink
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

type VideoSourceType = "youtube" | "drive" | "drive_pdf" | "external_pdf" | "direct";

// Detectar tipo de fonte
const detectVideoSource = (url: string): VideoSourceType => {
  if (!url) return "direct";
  
  const lowerUrl = url.toLowerCase();
  
  // YouTube - diversos formatos
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  
  // Google Drive - verificar se é PDF pela extensão ou padrão
  if (url.includes("drive.google.com")) {
    // Detectar PDFs por URL ou extensão
    if (lowerUrl.includes('.pdf') || 
        lowerUrl.includes('type=pdf') ||
        lowerUrl.includes('mimetype=pdf') ||
        lowerUrl.includes('/pdf')) {
      return "drive_pdf";
    }
    return "drive";
  }
  
  // Detectar PDFs externos por extensão ou padrão
  if (lowerUrl.includes('.pdf') || 
      lowerUrl.includes('type=pdf') || 
      lowerUrl.includes('format=pdf') ||
      lowerUrl.includes('/pdf/') ||
      lowerUrl.includes('mimetype=application/pdf')) {
    return "external_pdf";
  }
  
  // Qualquer outro link (incluindo Supabase Storage) é tratado como direto
  return "direct";
};

// Converter URLs para formato de embed quando necessário
const getEmbedUrl = (url: string, sourceType: VideoSourceType): string | null => {
  if (sourceType === "youtube") {
    // Converter youtube.com/watch?v=ID para embed com branding mínimo
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    if (videoIdMatch) {
      // Parâmetros otimizados para carregamento rápido e branding mínimo:
      // - modestbranding=1: minimiza logo do YouTube
      // - rel=0: não mostra vídeos relacionados ao final
      // - showinfo=0: oculta título (deprecado, mas mantido)
      // - iv_load_policy=3: oculta anotações
      // - cc_load_policy=0: não carrega legendas automaticamente
      // - playsinline=1: reproduz inline em mobile
      // - autoplay=0: não inicia automaticamente (evita bloqueio do navegador)
      // - enablejsapi=1: habilita API JS para controle
      // Usando youtube-nocookie.com para maior privacidade
      return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}?modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&playsinline=1&autoplay=0&enablejsapi=1`;
    }
  }
  
  if (sourceType === "drive" || sourceType === "drive_pdf") {
    // Detectar links de pasta (inválidos para embed)
    if (url.includes('/folders/') || url.includes('drive/folders')) {
      return null; // Link de pasta não pode ser convertido
    }
    
    // Converter drive.google.com/file/d/ID para formato de embed
    const patterns = [
      /drive\.google\.com\/file\/d\/([^/]+)/,
      /drive\.google\.com\/open\?id=([^&]+)/,
      /drive\.google\.com\/uc\?id=([^&]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return null; // Link inválido
  }
  
  // PDF externo - retornar URL diretamente
  if (sourceType === "external_pdf") {
    return url;
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
  const [retryCount, setRetryCount] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const maxRetries = 3;

  // Adicionar cache-busting e validação de URL
  const getOptimizedUrl = useCallback((originalUrl: string): string => {
    if (!originalUrl) return '';
    
    try {
      const urlObj = new URL(originalUrl);
      
      // Adicionar timestamp para evitar cache problemático
      urlObj.searchParams.set('t', Date.now().toString());
      
      return urlObj.toString();
    } catch {
      // Se não for URL válida, retornar original
      return originalUrl;
    }
  }, []);

  const [optimizedUrl, setOptimizedUrl] = useState(() => getOptimizedUrl(url));

  useEffect(() => {
    // Reset states quando URL muda
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setRetryCount(0);
    setOptimizedUrl(getOptimizedUrl(url));
  }, [url, getOptimizedUrl]);

  useEffect(() => {
    if (videoRef.current && initialPosition && !isLoading) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition, isLoading]);

  // Auto-retry com delay progressivo
  useEffect(() => {
    if (hasError && retryCount < maxRetries && retryCount > 0) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
      const timer = setTimeout(() => {
        console.log(`Tentativa ${retryCount + 1} de ${maxRetries}...`);
        setHasError(false);
        setIsLoading(true);
        setOptimizedUrl(getOptimizedUrl(url));
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, url, getOptimizedUrl]);

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
    setRetryCount(0);
    setOptimizedUrl(getOptimizedUrl(url));
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const error = video.error;
    
    console.error("Erro no vídeo:", error, "URL:", url, "Tentativa:", retryCount + 1);
    
    // Tentar novamente automaticamente
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      return;
    }
    
    setIsLoading(false);
    setHasError(true);
    
    // Detectar formato pela URL
    const lowerUrl = url.toLowerCase();
    const extension = lowerUrl.split('.').pop()?.split('?')[0] || '';
    
    // Formatos que não são suportados nativamente
    const isNonNativeFormat = ['avi', 'mkv', 'wmv'].includes(extension);
    
    // MOV pode funcionar se for H.264, mas frequentemente usa HEVC
    const isMov = extension === 'mov';
    
    // M4V geralmente funciona mas pode ter problemas
    const isM4v = extension === 'm4v';
    
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setErrorMessage("O carregamento do vídeo foi interrompido");
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          setErrorMessage("Erro de rede ao carregar o vídeo. Verifique sua conexão e se o arquivo existe no storage.");
          break;
        case MediaError.MEDIA_ERR_DECODE:
          if (isMov) {
            setErrorMessage(
              "Não foi possível decodificar o vídeo MOV. Provavelmente está usando codec HEVC/H.265 ou ProRes, " +
              "que não são suportados pelos navegadores. Converta para MP4 (H.264 + AAC) usando:\n" +
              "• HandBrake (gratuito)\n• VLC Media Player\n• Adobe Media Encoder"
            );
          } else if (isNonNativeFormat) {
            setErrorMessage(
              `Não foi possível decodificar o vídeo ${extension.toUpperCase()}. ` +
              "Este formato não é suportado nativamente pelos navegadores. " +
              "Converta para MP4 (H.264) usando HandBrake ou VLC."
            );
          } else {
            setErrorMessage(
              "Erro ao decodificar o vídeo. O codec pode não ser compatível com seu navegador. " +
              "Se for H.265/HEVC, converta para H.264."
            );
          }
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          if (isMov) {
            setErrorMessage(
              "Vídeo MOV não suportado. Arquivos MOV de iPhones/Macs frequentemente usam codec HEVC/H.265, " +
              "que navegadores não reproduzem. Soluções:\n\n" +
              "1. Converta para MP4 (H.264) usando HandBrake ou VLC\n" +
              "2. Ao gravar no iPhone, use 'Mais Compatível' em Ajustes > Câmera > Formatos\n" +
              "3. Baixe o vídeo e use um player como VLC"
            );
          } else if (isM4v) {
            setErrorMessage(
              "Vídeo M4V não suportado. Este formato pode conter DRM ou codec incompatível. " +
              "Converta para MP4 (H.264) usando HandBrake."
            );
          } else if (isNonNativeFormat) {
            setErrorMessage(
              `Formato ${extension.toUpperCase()} não suportado pelos navegadores. ` +
              "Converta para MP4 (H.264) ou baixe para assistir com VLC."
            );
          } else {
            setErrorMessage(
              "Formato ou codec não suportado. Se for MP4 com H.265 (HEVC), " +
              "converta para H.264 (AVC) usando HandBrake, VLC ou Adobe Media Encoder."
            );
          }
          break;
        default:
          setErrorMessage("Erro ao carregar o vídeo. Verifique se o arquivo existe e é válido.");
      }
    } else {
      setErrorMessage("Erro ao carregar o vídeo. Verifique se a URL está correta.");
    }
  };

  const handleDownload = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
        src={optimizedUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setIsLoading(false);
          setHasError(false);
          setRetryCount(0);
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
        onCanPlay={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onCanPlayThrough={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={handleError}
        muted={isMuted}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Error overlay with download fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-white text-center mb-4 px-4 max-w-md text-sm">{errorMessage}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={handleRetry}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar vídeo
            </Button>
          </div>
          <p className="text-white/60 text-xs mt-4 text-center max-w-sm">
            💡 Dica: Use um player de vídeo como VLC para reproduzir o arquivo baixado.
          </p>
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

// Componente para player de iframe (YouTube/Drive Video)
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

// Componente para visualização de PDF do Google Drive
const DrivePdfViewer = ({ url }: { url: string }) => {
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
    <div ref={containerRef} className="relative aspect-[3/4] min-h-[500px] bg-white rounded-lg overflow-hidden border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Carregando documento...</p>
          </div>
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full"
        allow="autoplay"
        style={{ border: 0 }}
        onLoad={() => setIsLoading(false)}
      />
      
      {/* Indicador de tipo e botão fullscreen */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded text-white/80 text-xs">
          <FileText className="h-3.5 w-3.5" />
          <span>PDF</span>
        </div>
      </div>
      
      <Button
        size="icon"
        variant="ghost"
        className="absolute bottom-4 right-4 text-white hover:bg-white/20 h-9 w-9 z-10 opacity-70 hover:opacity-100 bg-black/50"
        onClick={handleFullscreen}
      >
        <Maximize className="h-5 w-5" />
      </Button>
    </div>
  );
};

// Componente para visualização de PDF externo
const ExternalPdfViewer = ({ url }: { url: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div ref={containerRef} className="relative aspect-[3/4] min-h-[500px] bg-white rounded-lg overflow-hidden border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Carregando documento...</p>
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="text-center px-4">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <p className="text-foreground font-medium mb-2">Não foi possível exibir o PDF</p>
            <p className="text-muted-foreground text-sm mb-4">
              O servidor pode estar bloqueando a incorporação. Clique abaixo para abrir em uma nova aba.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
            >
              <FileText className="h-4 w-4 mr-2" />
              Abrir PDF
            </Button>
          </div>
        </div>
      )}

      <iframe
        src={url}
        className="w-full h-full"
        title="Visualizador de PDF"
        style={{ border: 0 }}
        onLoad={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      
      {/* Indicador de tipo e botões */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded text-white/80 text-xs">
          <FileText className="h-3.5 w-3.5" />
          <span>PDF</span>
        </div>
      </div>
      
      <div className="absolute bottom-3 right-3 flex gap-2 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 h-9 w-9 opacity-70 hover:opacity-100 bg-black/50"
          onClick={handleOpenExternal}
          title="Abrir em nova aba"
        >
          <FileText className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 h-9 w-9 opacity-70 hover:opacity-100 bg-black/50"
          onClick={handleFullscreen}
          title="Tela cheia"
        >
          <Maximize className="h-5 w-5" />
        </Button>
      </div>
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

  // Se não conseguiu gerar embed URL (ex: link de pasta do Drive)
  if (!embedUrl && (sourceType === "youtube" || sourceType === "drive" || sourceType === "drive_pdf")) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${
        sourceType === "drive_pdf" ? "aspect-[3/4] min-h-[500px]" : "aspect-video"
      }`}>
        <div className="text-center px-4">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <p className="text-muted-foreground font-medium mb-2">
            {sourceType === "drive_pdf" ? "Link de PDF inválido" : "Link de vídeo inválido"}
          </p>
          <p className="text-sm text-muted-foreground">
            {sourceType === "drive" || sourceType === "drive_pdf"
              ? "O link parece ser de uma pasta do Google Drive. É necessário o link direto do arquivo."
              : "Não foi possível processar este link. Verifique se é um link válido."}
          </p>
        </div>
      </div>
    );
  }

  // PDF do Google Drive - usa visualizador específico
  if (sourceType === "drive_pdf") {
    return <DrivePdfViewer url={embedUrl!} />;
  }

  // PDF externo - usa visualizador de PDF externo
  if (sourceType === "external_pdf") {
    return <ExternalPdfViewer url={embedUrl!} />;
  }

  // YouTube ou Drive video - usa iframe player
  if (sourceType === "youtube" || sourceType === "drive") {
    return <IframeVideoPlayer url={embedUrl!} />;
  }

  // Vídeo direto (upload ou link externo)
  return (
    <DirectVideoPlayer 
      url={url} 
      onTimeUpdate={onTimeUpdate} 
      onEnded={onEnded} 
      initialPosition={initialPosition}
    />
  );
};
