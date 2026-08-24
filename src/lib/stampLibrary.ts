/**
 * Curated Stamp Motifs & Pattern Library for ArtisPlan Studio
 * High-resolution SVG data URLs for immediate, crisp rasterization and stamping
 */

export interface BuiltinStampMotif {
  id: string;
  name: string;
  category: 'Nature & Foliage' | 'Celestial & FX' | 'Patterns & Textures' | 'Shapes & Icons';
  svgDataUrl: string;
  defaultSpacing: number;
  followDirection: boolean;
  defaultScatter: number;
  defaultRotationJitter: number;
  defaultScaleJitter: number;
  defaultTint: boolean;
}

const encodeSvg = (svg: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const BUILTIN_STAMP_MOTIFS: BuiltinStampMotif[] = [
  {
    id: 'star-sparkle',
    name: 'Sparkle Star',
    category: 'Celestial & FX',
    defaultSpacing: 120,
    followDirection: false,
    defaultScatter: 35,
    defaultRotationJitter: 80,
    defaultScaleJitter: 50,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M50 0 Q50 42 0 50 Q50 58 50 100 Q50 58 100 50 Q50 42 50 0 Z" fill="#FFFFFF"/>
        <circle cx="50" cy="50" r="14" fill="#FFFFFF"/>
        <circle cx="22" cy="22" r="4" fill="#FFFFFF"/>
        <circle cx="78" cy="78" r="4" fill="#FFFFFF"/>
        <circle cx="78" cy="22" r="3" fill="#FFFFFF"/>
        <circle cx="22" cy="78" r="3" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'sakura-petal',
    name: 'Sakura Blossom Petal',
    category: 'Nature & Foliage',
    defaultSpacing: 95,
    followDirection: true,
    defaultScatter: 45,
    defaultRotationJitter: 60,
    defaultScaleJitter: 40,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M50 5 C30 25 15 50 25 75 C32 92 50 98 50 98 C50 98 68 92 75 75 C85 50 70 25 50 5 Z M50 15 C52 10 48 10 50 15 Z" fill="#FFFFFF"/>
        <path d="M50 35 Q50 65 46 80" stroke="rgba(0,0,0,0.35)" stroke-width="2" fill="none"/>
      </svg>
    `)
  },
  {
    id: 'autumn-leaf',
    name: 'Autumn Maple Leaf',
    category: 'Nature & Foliage',
    defaultSpacing: 140,
    followDirection: true,
    defaultScatter: 30,
    defaultRotationJitter: 45,
    defaultScaleJitter: 35,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M50 5 L55 28 L72 20 L68 38 L88 38 L72 54 L92 68 L68 68 L70 82 L50 72 L30 82 L32 68 L8 68 L28 54 L12 38 L32 38 L28 20 L45 28 Z M50 72 L50 96 L47 96 L47 72 Z" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'chain-link',
    name: 'Chain Link Ribbon',
    category: 'Patterns & Textures',
    defaultSpacing: 55,
    followDirection: true,
    defaultScatter: 0,
    defaultRotationJitter: 0,
    defaultScaleJitter: 0,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect x="15" y="32" width="70" height="36" rx="18" fill="none" stroke="#FFFFFF" stroke-width="14"/>
        <circle cx="50" cy="50" r="10" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'grunge-splatter',
    name: 'Ink Splash & Splatter',
    category: 'Celestial & FX',
    defaultSpacing: 160,
    followDirection: false,
    defaultScatter: 40,
    defaultRotationJitter: 100,
    defaultScaleJitter: 60,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M48 42 C54 38 62 44 65 50 C68 56 60 64 52 65 C44 66 38 58 40 50 C42 42 46 44 48 42 Z" fill="#FFFFFF"/>
        <circle cx="28" cy="30" r="6" fill="#FFFFFF"/>
        <circle cx="75" cy="35" r="7" fill="#FFFFFF"/>
        <circle cx="32" cy="72" r="5" fill="#FFFFFF"/>
        <circle cx="70" cy="75" r="8" fill="#FFFFFF"/>
        <circle cx="85" cy="55" r="3.5" fill="#FFFFFF"/>
        <circle cx="16" cy="52" r="4" fill="#FFFFFF"/>
        <circle cx="50" cy="18" r="4.5" fill="#FFFFFF"/>
        <circle cx="52" cy="88" r="3" fill="#FFFFFF"/>
        <circle cx="62" cy="20" r="2" fill="#FFFFFF"/>
        <circle cx="82" cy="20" r="2.5" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'halftone-dots',
    name: 'Halftone Dot Matrix',
    category: 'Patterns & Textures',
    defaultSpacing: 100,
    followDirection: false,
    defaultScatter: 15,
    defaultRotationJitter: 30,
    defaultScaleJitter: 20,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="14" fill="#FFFFFF"/>
        <circle cx="25" cy="50" r="9" fill="#FFFFFF"/>
        <circle cx="75" cy="50" r="9" fill="#FFFFFF"/>
        <circle cx="50" cy="25" r="9" fill="#FFFFFF"/>
        <circle cx="50" cy="75" r="9" fill="#FFFFFF"/>
        <circle cx="25" cy="25" r="6" fill="#FFFFFF"/>
        <circle cx="75" cy="25" r="6" fill="#FFFFFF"/>
        <circle cx="25" cy="75" r="6" fill="#FFFFFF"/>
        <circle cx="75" cy="75" r="6" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'cyber-hex',
    name: 'Cyber Hexagon Grid',
    category: 'Shapes & Icons',
    defaultSpacing: 85,
    followDirection: true,
    defaultScatter: 10,
    defaultRotationJitter: 15,
    defaultScaleJitter: 10,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" fill="none" stroke="#FFFFFF" stroke-width="8"/>
        <polygon points="50,22 75,36 75,64 50,78 25,64 25,36" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'heart-doodle',
    name: 'Hand-drawn Heart',
    category: 'Shapes & Icons',
    defaultSpacing: 110,
    followDirection: false,
    defaultScatter: 25,
    defaultRotationJitter: 40,
    defaultScaleJitter: 35,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M50 85 C20 60 5 45 5 28 C5 15 15 5 28 5 C38 5 46 12 50 20 C54 12 62 5 72 5 C85 5 95 15 95 28 C95 45 80 60 50 85 Z" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'crystal-diamond',
    name: 'Prism Gem Diamond',
    category: 'Shapes & Icons',
    defaultSpacing: 120,
    followDirection: false,
    defaultScatter: 20,
    defaultRotationJitter: 50,
    defaultScaleJitter: 30,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <polygon points="30,15 70,15 92,40 50,90 8,40" fill="none" stroke="#FFFFFF" stroke-width="6"/>
        <line x1="8" y1="40" x2="92" y2="40" stroke="#FFFFFF" stroke-width="6"/>
        <line x1="30" y1="15" x2="50" y2="90" stroke="#FFFFFF" stroke-width="5"/>
        <line x1="70" y1="15" x2="50" y2="90" stroke="#FFFFFF" stroke-width="5"/>
        <line x1="30" y1="15" x2="35" y2="40" stroke="#FFFFFF" stroke-width="5"/>
        <line x1="70" y1="15" x2="65" y2="40" stroke="#FFFFFF" stroke-width="5"/>
      </svg>
    `)
  },
  {
    id: 'paw-print',
    name: 'Animal Paw Trail',
    category: 'Nature & Foliage',
    defaultSpacing: 90,
    followDirection: true,
    defaultScatter: 15,
    defaultRotationJitter: 20,
    defaultScaleJitter: 15,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <ellipse cx="50" cy="65" rx="24" ry="18" fill="#FFFFFF"/>
        <circle cx="24" cy="35" r="9" fill="#FFFFFF"/>
        <circle cx="42" cy="24" r="10" fill="#FFFFFF"/>
        <circle cx="60" cy="24" r="10" fill="#FFFFFF"/>
        <circle cx="78" cy="35" r="9" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'botanical-fern',
    name: 'Botanical Fern Frond',
    category: 'Nature & Foliage',
    defaultSpacing: 80,
    followDirection: true,
    defaultScatter: 10,
    defaultRotationJitter: 15,
    defaultScaleJitter: 25,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M50 95 Q50 50 50 5" stroke="#FFFFFF" stroke-width="5" fill="none"/>
        <path d="M50 75 Q75 65 80 50 C65 60 50 68 50 75 Z" fill="#FFFFFF"/>
        <path d="M50 75 Q25 65 20 50 C35 60 50 68 50 75 Z" fill="#FFFFFF"/>
        <path d="M50 55 Q72 45 76 32 C62 42 50 48 50 55 Z" fill="#FFFFFF"/>
        <path d="M50 55 Q28 45 24 32 C38 42 50 48 50 55 Z" fill="#FFFFFF"/>
        <path d="M50 35 Q68 25 70 15 C58 24 50 29 50 35 Z" fill="#FFFFFF"/>
        <path d="M50 35 Q32 25 30 15 C42 24 50 29 50 35 Z" fill="#FFFFFF"/>
        <path d="M50 18 Q58 10 50 5 Q42 10 50 18 Z" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'cloud-puff',
    name: 'Atmospheric Cloud Puff',
    category: 'Celestial & FX',
    defaultSpacing: 130,
    followDirection: false,
    defaultScatter: 30,
    defaultRotationJitter: 40,
    defaultScaleJitter: 45,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <path d="M25 65 A18 18 0 0 1 35 35 A22 22 0 0 1 65 30 A20 20 0 0 1 82 50 A16 16 0 0 1 75 68 Z" fill="#FFFFFF"/>
      </svg>
    `)
  },
  {
    id: 'coffee-ring',
    name: 'Coffee Mug Ring Stain',
    category: 'Patterns & Textures',
    defaultSpacing: 180,
    followDirection: false,
    defaultScatter: 20,
    defaultRotationJitter: 100,
    defaultScaleJitter: 30,
    defaultTint: true,
    svgDataUrl: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-dasharray="14 4 8 3 20 5"/>
        <path d="M50 12 C60 12 70 16 78 24 C82 28 85 36 86 42" stroke="#FFFFFF" stroke-width="9" fill="none"/>
        <circle cx="82" cy="74" r="4" fill="#FFFFFF"/>
        <circle cx="22" cy="30" r="3" fill="#FFFFFF"/>
      </svg>
    `)
  }
];

/**
 * Get built-in motif by ID
 */
export const getBuiltinStampMotif = (motifId: string): BuiltinStampMotif | undefined => {
  return BUILTIN_STAMP_MOTIFS.find(m => m.id === motifId);
};
