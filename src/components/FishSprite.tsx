import React from 'react';
import { FishSpecies } from '../types/game';

interface FishSpriteProps {
  species: FishSpecies;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSwimming?: boolean;
  isFacingRight?: boolean;
  className?: string;
}

export const FishSprite: React.FC<FishSpriteProps> = ({
  species,
  size = 'md',
  isSwimming = true,
  isFacingRight = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-14 h-9',
    md: 'w-24 h-16',
    lg: 'w-36 h-24',
    xl: 'w-48 h-32',
  };

  const { color, secondaryColor, finColor, shape, rarity } = species;
  const isLegendary = rarity >= 4;

  return (
    <div
      className={`relative inline-block select-none transition-transform duration-300 ${sizeMap[size]} ${className}`}
      style={{
        transform: `${isFacingRight ? 'scaleX(-1)' : 'scaleX(1)'}`,
      }}
    >
      <svg
        viewBox="0 0 160 100"
        className={`w-full h-full overflow-visible drop-shadow-md ${isSwimming ? 'animate-pulse' : ''}`}
        style={{
          animationDuration: isSwimming ? '2.4s' : '0s',
        }}
      >
        <defs>
          <linearGradient id={`fish-grad-${species.id}`} x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor={color} />
            <stop offset="65%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <linearGradient id={`fin-grad-${species.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={finColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
          {isLegendary && (
            <filter id={`glow-${species.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Tail Fin with wagging animation */}
        <g
          className={isSwimming ? 'origin-left animate-[wiggle_1.2s_ease-in-out_infinite]' : ''}
          style={{ transformOrigin: '125px 50px' }}
        >
          {shape === 'long' ? (
            <path
              d="M 125,50 C 145,35 155,20 160,10 C 152,45 152,55 160,90 C 155,80 145,65 125,50 Z"
              fill={`url(#fin-grad-${species.id})`}
            />
          ) : shape === 'round' ? (
            <path
              d="M 120,50 C 135,25 150,20 152,32 C 145,45 145,55 152,68 C 150,80 135,75 120,50 Z"
              fill={`url(#fin-grad-${species.id})`}
            />
          ) : shape === 'giant' ? (
            <path
              d="M 125,50 C 145,25 158,15 162,25 C 148,46 148,54 162,75 C 158,85 145,75 125,50 Z"
              fill={`url(#fin-grad-${species.id})`}
            />
          ) : (
            <path
              d="M 120,50 C 140,25 155,15 158,28 C 146,45 146,55 158,72 C 155,85 140,75 120,50 Z"
              fill={`url(#fin-grad-${species.id})`}
            />
          )}
        </g>

        {/* Top/Dorsal Fin */}
        {shape === 'long' ? (
          <path
            d="M 40,32 Q 80,10 120,38 Q 80,24 40,32 Z"
            fill={`url(#fin-grad-${species.id})`}
            opacity="0.9"
          />
        ) : shape === 'round' ? (
          <path
            d="M 55,20 Q 75,5 95,22 Q 75,14 55,20 Z"
            fill={`url(#fin-grad-${species.id})`}
            opacity="0.9"
          />
        ) : (
          <path
            d="M 45,25 Q 75,8 105,32 Q 75,20 45,25 Z"
            fill={`url(#fin-grad-${species.id})`}
            opacity="0.9"
          />
        )}

        {/* Main Body */}
        {shape === 'round' ? (
          <path
            d="M 25,50 C 25,20 60,15 95,20 C 120,25 125,40 125,50 C 125,60 120,75 95,80 C 60,85 25,80 25,50 Z"
            fill={`url(#fish-grad-${species.id})`}
            filter={isLegendary ? `url(#glow-${species.id})` : undefined}
          />
        ) : shape === 'flat' ? (
          <path
            d="M 20,50 C 25,25 65,18 100,24 C 122,30 125,45 125,50 C 125,55 122,70 100,76 C 65,82 25,75 20,50 Z"
            fill={`url(#fish-grad-${species.id})`}
            filter={isLegendary ? `url(#glow-${species.id})` : undefined}
          />
        ) : shape === 'giant' ? (
          <path
            d="M 15,50 C 20,24 55,18 95,22 C 122,25 130,42 130,50 C 130,58 122,75 95,78 C 55,82 20,76 15,50 Z"
            fill={`url(#fish-grad-${species.id})`}
            filter={isLegendary ? `url(#glow-${species.id})` : undefined}
          />
        ) : shape === 'long' ? (
          <path
            d="M 18,50 C 25,32 60,28 105,32 C 125,36 128,45 128,50 C 128,55 125,64 105,68 C 60,72 25,68 18,50 Z"
            fill={`url(#fish-grad-${species.id})`}
            filter={isLegendary ? `url(#glow-${species.id})` : undefined}
          />
        ) : (
          <path
            d="M 20,50 C 25,25 60,20 95,24 C 120,28 124,42 124,50 C 124,58 120,72 95,76 C 60,80 25,75 20,50 Z"
            fill={`url(#fish-grad-${species.id})`}
            filter={isLegendary ? `url(#glow-${species.id})` : undefined}
          />
        )}

        {/* Stripes / Patterns */}
        {species.id === 'kuma-nomi' && (
          <g fill="#ffffff" opacity="0.95">
            <path d="M 50,22 Q 54,50 50,78 Q 44,50 44,24 Z" />
            <path d="M 80,21 Q 84,50 80,79 Q 74,50 74,23 Z" />
          </g>
        )}
        {species.id === 'katsuo' && (
          <g stroke="#0369a1" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.75">
            <line x1="55" y1="52" x2="100" y2="52" />
            <line x1="58" y1="58" x2="98" y2="58" />
            <line x1="62" y1="64" x2="92" y2="64" />
          </g>
        )}
        {species.id === 'gold-salmon' && (
          <g fill="#fef08a" opacity="0.8">
            <circle cx="55" cy="45" r="2.5" />
            <circle cx="70" cy="40" r="3" />
            <circle cx="85" cy="48" r="2.5" />
            <circle cx="98" cy="42" r="2" />
          </g>
        )}

        {/* Pectoral Fin */}
        <path
          d="M 45,50 C 55,48 68,52 64,65 C 55,62 48,56 45,50 Z"
          fill={`url(#fin-grad-${species.id})`}
          opacity="0.95"
          className={isSwimming ? 'origin-left animate-[pulse_1.5s_ease-in-out_infinite]' : ''}
        />

        {/* Eye */}
        <circle cx="36" cy="44" r="5" fill="#ffffff" />
        <circle cx="35" cy="44" r="2.8" fill="#0f172a" />
        <circle cx="33.5" cy="42.5" r="1.2" fill="#ffffff" />

        {/* Mouth */}
        <path d="M 20,50 Q 24,52 27,51" stroke="#0f172a" strokeWidth="1.2" fill="none" opacity="0.7" />

        {/* Gills */}
        <path d="M 44,38 Q 48,50 44,62" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
};
