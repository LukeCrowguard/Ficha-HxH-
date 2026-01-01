import React from 'react';
import { Edit2 } from 'lucide-react';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
  isEditing?: boolean;
  onChange?: (val: number) => void;
  onMaxChange?: (val: number) => void;
}

const StatBar: React.FC<StatBarProps> = ({ 
  label, current, max, color, icon, isEditing, onChange, onMaxChange 
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className="flex flex-col w-full mb-4 group relative">
      <div className="flex justify-between items-end mb-1">
        <div className="flex items-center gap-2 text-white font-header text-lg font-bold uppercase tracking-wider">
          {icon && <span className="text-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{icon}</span>}
          <span className="drop-shadow-md text-gray-100">{label}</span>
        </div>
        
        <div className="flex items-center text-xl font-bold font-title">
          <input 
            type="number" 
            value={current}
            onChange={(e) => onChange && onChange(parseInt(e.target.value) || 0)}
            className="w-16 bg-transparent text-right outline-none border-b border-transparent hover:border-white/50 focus:border-white transition-colors text-white drop-shadow-md"
          />
          <span className="mx-1 text-gray-400">/</span>
          {isEditing ? (
             <input 
             type="number" 
             value={max}
             onChange={(e) => onMaxChange && onMaxChange(parseInt(e.target.value) || 0)}
             className="w-16 bg-white/10 rounded px-1 text-center outline-none border border-white/20 focus:border-white transition-colors text-white"
           />
          ) : (
            <span className="text-gray-300 w-16 text-center">{max}</span>
          )}
        </div>
      </div>
      
      {/* Bar Container */}
      <div className="relative h-5 bg-black/60 rounded-sm overflow-hidden border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        
        {/* Fill Bar */}
        <div 
          className="h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) relative"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color,
            boxShadow: `0 0 15px ${color}, inset 0 1px 0 rgba(255,255,255,0.3)`
          }}
        >
           {/* Shimmer Effect */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default StatBar;