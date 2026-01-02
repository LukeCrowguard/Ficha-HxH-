import React from 'react';
import { NenType } from '../types';
import { NEN_COLORS } from '../constants';

interface NenHexagonProps {
  activeType: NenType;
}

const NenHexagon: React.FC<NenHexagonProps> = ({ activeType }) => {
  // Standard HxH Hexagon Order:
  // Enhancer (Top) -> Transmuter -> Conjurer -> Specialist -> Manipulator -> Emitter
  // Note: Angles need to match this standard visual layout.
  
  const typeOrder = [
    NenType.Enhancer,
    NenType.Transmuter,
    NenType.Conjurer,
    NenType.Specialist,
    NenType.Manipulator,
    NenType.Emitter
  ];

  // Coordinates for the 6 points of the hexagon (radius 40)
  // Center is 50,50
  const points = [
    { x: 50, y: 10, label: 'Reforço' },      // Top
    { x: 84.6, y: 30, label: 'Transform.' }, // Top Right
    { x: 84.6, y: 70, label: 'Material.' },  // Bottom Right
    { x: 50, y: 90, label: 'Especial.' },    // Bottom
    { x: 15.4, y: 70, label: 'Manipul.' },   // Bottom Left
    { x: 15.4, y: 30, label: 'Emissão' }     // Top Left
  ];

  // Define Affinity Efficiencies based on Active Type
  // 1.0 = 100%, 0.8 = 80%, 0.6 = 60%, 0.4 = 40%, 0.0 = 0% (Specialist rule)
  
  const getEfficiencies = (type: NenType) => {
    // Default distances on the ring (0 is same, 1 is adjacent, 2 is far, 3 is opposite)
    const index = typeOrder.indexOf(type);
    
    return typeOrder.map((t, i) => {
      if (type === NenType.Specialist) {
        // Specialist Rules: 100% Spec, 80% Conj/Manip, 60% Others, 40% Enhancer
        if (t === NenType.Specialist) return 1.0;
        if (t === NenType.Conjurer || t === NenType.Manipulator) return 0.8;
        if (t === NenType.Transmuter || t === NenType.Emitter) return 0.6;
        if (t === NenType.Enhancer) return 0.4;
        return 0;
      }
      
      if (t === NenType.Specialist) {
        // Non-Specialists usually have 0% efficiency in Specialization 
        // (Visualized as a dip in the chart towards the center)
        return 0.1; 
      }

      // Calculate distance on the ring
      let dist = Math.abs(index - i);
      if (dist > 3) dist = 6 - dist;
      
      // Standard Efficiencies
      let eff = 1.0 - (dist * 0.2); 
      if (eff < 0.4) eff = 0.4;

      return eff;
    });
  };

  const efficiencies = getEfficiencies(activeType);
  const activeColor = NEN_COLORS[activeType] || '#9b59b6';

  // Calculate polygon points based on efficiency
  const polyPoints = points.map((p, i) => {
    // Lerp between center (50,50) and point (p.x, p.y) based on efficiency
    const eff = efficiencies[i];
    // We visually clamp 0% to a small value (0.1) so the graph doesn't disappear completely
    const visualEff = Math.max(0.1, eff); 
    
    const x = 50 + (p.x - 50) * visualEff;
    const y = 50 + (p.y - 50) * visualEff;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative w-full aspect-square max-w-[220px] mx-auto flex items-center justify-center">
      {/* Background Kanji for "Nen" */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
        <span className="text-8xl font-title text-white animate-pulse" style={{ textShadow: `0 0 30px ${activeColor}` }}>念</span>
      </div>

      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
        <defs>
          <filter id="auraGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Outer Hexagon (100% Capacity) */}
        <polygon 
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" 
          stroke="rgba(255,255,255,0.1)" 
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        
        {/* Inner Guides (Grid) */}
        <polygon 
          points={points.map(p => {
             const x = 50 + (p.x - 50) * 0.6; // 60% mark
             const y = 50 + (p.y - 50) * 0.6;
             return `${x},${y}`;
          }).join(' ')}
          fill="none" 
          stroke="rgba(255,255,255,0.05)" 
          strokeWidth="0.5"
        />

        {/* Connectors to center */}
        {points.map((p, i) => (
           <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        ))}

        {/* Dynamic Efficiency Polygon */}
        <polygon 
          points={polyPoints}
          fill={activeColor}
          fillOpacity="0.3"
          stroke={activeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ filter: 'url(#auraGlow)' }}
        />

        {/* Nodes and Labels */}
        {points.map((p, i) => {
          const isMain = typeOrder[i] === activeType;
          const eff = efficiencies[i];
          
          return (
            <g key={i}>
              {/* Point on the outer ring */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r={isMain ? 2 : 1} 
                fill={isMain ? activeColor : '#333'}
                className="transition-colors duration-500"
              />
              
              {/* Efficiency Point on the dynamic polygon */}
              {eff > 0.1 && (
                  <circle 
                  cx={50 + (p.x - 50) * eff}
                  cy={50 + (p.y - 50) * eff}
                  r={2}
                  fill="#fff"
                  className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  />
              )}

              <text 
                x={p.x} 
                y={p.y < 50 ? p.y - 6 : p.y + 10} 
                textAnchor="middle" 
                fontSize="6" 
                fill={isMain ? activeColor : '#666'}
                fontWeight={isMain ? '900' : 'normal'}
                className="font-header uppercase tracking-wider transition-colors duration-300"
                style={{ textShadow: isMain ? `0 0 10px ${activeColor}` : 'none' }}
              >
                {p.label}
              </text>
              
              {/* Percentage Label */}
              {isMain && (
                 <text 
                 x={p.x} 
                 y={p.y < 50 ? p.y + 8 : p.y - 5}
                 textAnchor="middle"
                 fontSize="4"
                 fill="#fff"
                 fontWeight="bold"
                 >
                   100%
                 </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default NenHexagon;