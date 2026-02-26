import { useEffect, useState } from 'react';
import logoAtiva from '@/assets/logo-ativa.png';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

const SplashScreen = ({ onComplete, minDuration = 800 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, minDuration);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, minDuration + 200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, minDuration]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#40E0D0' }}
    >
      {/* Background animated circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animation: 'pulse-slow 3s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            bottom: '15%',
            right: '15%',
            animation: 'pulse-slow 3s ease-in-out infinite 0.5s'
          }}
        />
        <div 
          className="absolute w-48 h-48 rounded-full opacity-15"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
            top: '50%',
            right: '25%',
            animation: 'pulse-slow 3s ease-in-out infinite 1s'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo container with animation */}
        <div 
          className="relative"
          style={{
            animation: 'logo-entrance 1s ease-out forwards'
          }}
        >
          {/* Glowing ring */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent)',
              animation: 'spin-slow 3s linear infinite',
              transform: 'scale(1.3)',
              filter: 'blur(8px)'
            }}
          />
          
          {/* Logo */}
          <div 
            className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 sm:p-8"
            style={{
              boxShadow: '0 0 60px rgba(255,255,255,0.3), inset 0 0 30px rgba(255,255,255,0.1)'
            }}
          >
            <img 
              src={logoAtiva} 
              alt="GRUPO ATIVA" 
              className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain"
              style={{
                animation: 'logo-pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.1))'
              }}
            />
          </div>
        </div>

        {/* Title with staggered animation */}
        <div 
          className="text-center"
          style={{
            animation: 'text-entrance 1s ease-out 0.3s forwards',
            opacity: 0
          }}
        >
          <h1 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-2"
            style={{ 
              fontFamily: "'Pacifico', cursive",
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          >
            Sistema Integrado de Gerenciamento
          </h1>
          <p 
            className="text-lg sm:text-xl md:text-2xl text-white/90 font-semibold tracking-wider"
            style={{ 
              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
              animation: 'fade-up 0.8s ease-out 0.6s forwards',
              opacity: 0
            }}
          >
            GRUPO ATIVA
          </p>
        </div>

        {/* Loading indicator */}
        <div 
          className="flex flex-col items-center gap-4 mt-4"
          style={{
            animation: 'loader-entrance 0.8s ease-out 0.8s forwards',
            opacity: 0
          }}
        >
          {/* Animated dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-white/80"
                style={{
                  animation: `bounce-dot 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.16}s`
                }}
              />
            ))}
          </div>
          
          {/* Loading text */}
          <p 
            className="text-white/70 text-sm font-medium tracking-wide"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            Carregando...
          </p>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes logo-entrance {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes text-entrance {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loader-entrance {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-up {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logo-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes spin-slow {
          from {
            transform: scale(1.3) rotate(0deg);
          }
          to {
            transform: scale(1.3) rotate(360deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          }
          50% {
            text-shadow: 2px 2px 8px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
