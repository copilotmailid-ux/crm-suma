import React, { useState } from 'react';

export const CollegeLogo = ({ className = '', size = 'md' }) => {
  const [sourceIndex, setSourceIndex] = useState(0);

  // Preferred URL as requested by user, with reliable local and SVG fallbacks
  const sources = [
    'https://www.nscet.org/assets/nscet-logo-Bq3x62BG.png',
    '/src/assets/images/college_crest_logo_1791269754055.jpg',
    '/logo.png',
  ];

  const sizeClasses = {
    sm: 'h-8 sm:h-9 max-w-[110px] w-auto',
    md: 'h-14 sm:h-16 max-w-[160px] w-auto',
    lg: 'h-20 sm:h-22 max-w-[200px] w-auto',
    xl: 'h-20 sm:h-24 max-w-[240px] w-auto',
  };

  const handleImageError = () => {
    setSourceIndex((prev) => prev + 1);
  };

  if (sourceIndex < sources.length) {
    return (
      <img
        src={sources[sourceIndex]}
        alt="Nadar Saraswathi College of Engineering and Technology Logo"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        className={`${sizeClasses[size]} object-contain drop-shadow-xs transition-transform duration-300 ${className}`}
      />
    );
  }

  // Graceful high-fidelity SVG fallback of the NSCET Crest Emblem if neither loads
  return (
    <div
      className={`${sizeClasses[size]} relative flex items-center justify-center rounded-full bg-white shadow-xs border border-slate-200/60 p-1 aspect-square ${className}`}
      role="img"
      aria-label="Nadar Saraswathi College of Engineering and Technology Emblem"
    >
      <svg viewBox="0 0 160 160" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Industrial Gear Cogwheel */}
        <circle cx="80" cy="80" r="70" stroke="#003B73" strokeWidth="6" strokeDasharray="10 4" />
        <circle cx="80" cy="80" r="62" fill="#F8FAFC" stroke="#D4AF37" strokeWidth="2.5" />
        
        {/* Inner Golden Radiance Ring */}
        <circle cx="80" cy="80" r="48" fill="#FFFFFF" stroke="#003B73" strokeWidth="1.5" />
        
        {/* Sacred Knowledge Saraswathi Symbol / Traditional Vilakku Lamp Motif */}
        <path d="M80 44 L84 56 L76 56 Z" fill="#D97706" />
        <path d="M78 57 Q80 52 82 57" stroke="#EA580C" strokeWidth="2" fill="none" />
        
        {/* Veena / Book Knowledge Motif */}
        <ellipse cx="80" cy="74" rx="14" ry="10" fill="#003B73" opacity="0.15" />
        <path d="M70 76 Q80 70 90 76 L88 84 Q80 78 72 84 Z" fill="#003B73" />
        <circle cx="75" cy="82" r="3.5" fill="#D4AF37" />
        <circle cx="85" cy="82" r="3.5" fill="#D4AF37" />
        <line x1="72" y1="74" x2="88" y2="74" stroke="#D4AF37" strokeWidth="1.5" />
        
        {/* Ribbons / Banners */}
        <path d="M48 64 C60 61 70 61 80 61 C90 61 100 61 112 64" stroke="#003B73" strokeWidth="2" fill="none" />
        
        {/* Mini text Learn / Excel */}
        <text x="56" y="59" fill="#003B73" fontSize="6" fontWeight="bold" fontFamily="sans-serif">LEARN</text>
        <text x="94" y="59" fill="#003B73" fontSize="6" fontWeight="bold" fontFamily="sans-serif">EXCEL</text>
        
        {/* Bottom Banner */}
        <rect x="36" y="94" width="88" height="15" rx="3" fill="#003B73" />
        <text x="80" y="103" textAnchor="middle" fill="#FFFFFF" fontSize="5.5" fontWeight="600" letterSpacing="0.2">
          ENGINEERING EXCELLENCE
        </text>
        <text x="80" y="108" textAnchor="middle" fill="#FCD34D" fontSize="4.5" fontWeight="500">
          FOR EMPOWERMENT
        </text>
        
        {/* Bottom Arc Text */}
        <text x="80" y="126" textAnchor="middle" fill="#003B73" fontSize="5" fontWeight="bold">
          NADAR SARASWATHI CET
        </text>
      </svg>
    </div>
  );
};
