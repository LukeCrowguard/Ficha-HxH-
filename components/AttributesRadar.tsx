import React from 'react';
import { Attributes } from '../types';
import { Sword, Brain, Feather, Dna, Activity, Ghost } from 'lucide-react';

interface AttributesRadarProps {
  attributes: Attributes;
  size?: number;
}

const AttributesRadar: React.FC<AttributesRadarProps> = ({ attributes, size = 280 }) => {
  // Config
  const center = size / 2;
  const radius = size * 0.32; // Responsive radius ~90px for 280 size
  
  // Scale Logic:
  const maxVisual = 8; 
  const minVisual = -4; 
  const range = maxVisual - minVisual;

  // Attribute Order (Clockwise starting from top)
  const keys: (keyof Attributes)[] = [
    'strength',      // Top
    'intelligence',  // Top Right
    'charisma',      // Bottom Right
    'determination', // Bottom
    'constitution',  // Bottom Left
    'prestidigitation' // Top Left
  ];

  const labels: Record<string, string> = {
    strength: 'FOR',
    intelligence: 'INT',
    charisma: 'CAR',
    determination: 'DET',
    constitution: 'CON',
    prestidigitation: 'DES'
  };

  const icons: Record<string, React.ElementType> = {
    strength: Sword,
    intelligence: Brain,
    charisma: Feather,
    determination: Dna,
    constitution: Activity,
    prestidigitation: Ghost
  };

  // Helper to calculate points
  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    // Clamp values for visual sanity
    const clampedVal = Math.max(minVisual, Math.min(maxVisual, value));
    
    // Normalize: 0 to 1
    const normalized = (clampedVal - minVisual) / range;
    
    const x = center + Math.cos(angle) * (radius * normalized);
    const y = center + Math.sin(angle) * (radius * normalized);
    return [x, y];
  };

  // Generate Data Polygon
  const points = keys.map((key, i) => {
    const val = attributes[key];
    return getPoint(val, i, keys.length).join(',');
  }).join(' ');

  // Grid Levels relative to the "Zero" line for context
  const gridValues = [-2, 0, 2, 4, 6, 8];

  // Scale font sizes based on total size
  const iconSize = Math.max(10, size * 0.05); 
  const textSize = Math.max(8, size * 0.035);

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-2xl overflow-visible">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background Grids */}
        {gridValues.map((val, idx) => {
           const norm = (val - minVisual) / range;
           const r = radius * norm;
           const isZero = val === 0;
           
           return (
            <polygon
              key={idx}
              points={keys.map((_, i) => {
                const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                return `${x},${y}`;
              }).join(' ')}
              fill={isZero ? "rgba(255, 255, 255, 0.03)" : "none"}
              stroke={isZero ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)"}
              strokeWidth={isZero ? 1.5 : 0.5}
              strokeDasharray={isZero ? "0" : "4 2"}
            />
           );
        })}

        {/* Axis Lines */}
        {keys.map((_, i) => {
          const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
          const x = center + Math.cos(angle) * radius;
          const y = center + Math.sin(angle) * radius;
          return (
            <line 
              key={i} 
              x1={center} y1={center} 
              x2={x} y2={y} 
              stroke="rgba(255, 255, 255, 0.05)" 
              strokeWidth="1" 
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={points}
          fill="rgba(255, 255, 255, 0.2)"
          stroke="var(--theme-color, #9b59b6)"
          strokeWidth="2"
          className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ filter: 'url(#glow)' }}
        />

        {/* Data Points */}
        {keys.map((key, i) => {
          const val = attributes[key];
          const [x, y] = getPoint(val, i, keys.length);
          return (
            <g key={i} className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ transformOrigin: 'center' }}>
               <circle
                cx={x} cy={y}
                r={size * 0.01}
                fill="#fff"
                stroke="var(--theme-color, #9b59b6)"
                strokeWidth="1"
              />
              <text
                x={x} 
                y={y - (size * 0.03)}
                textAnchor="middle"
                fontSize={size * 0.028}
                className="font-bold fill-white pointer-events-none opacity-80"
              >
                {val > 0 ? `+${val}` : val}
              </text>
            </g>
          );
        })}

        {/* Axis Labels & Icons */}
        {keys.map((key, i) => {
          const angle = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
          const dist = radius + (size * 0.09); // Scaled distance
          const x = center + Math.cos(angle) * dist;
          const y = center + Math.sin(angle) * dist;
          const Icon = icons[key];

          return (
            <g key={i}>
                <foreignObject x={x - (iconSize/2 + 2)} y={y - (iconSize + 5)} width={iconSize + 4} height={iconSize + 4} className="overflow-visible">
                    <div className="flex items-center justify-center w-full h-full text-gray-500">
                        <Icon size={iconSize} className="stroke-[2.5]" style={{stroke: 'var(--theme-color)'}}/>
                    </div>
                </foreignObject>
                <text
                x={x} y={y + (size * 0.02)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={textSize}
                className="font-bold fill-gray-400 uppercase font-header tracking-widest"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                {labels[key]}
                </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default AttributesRadar;