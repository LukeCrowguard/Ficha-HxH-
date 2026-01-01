import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AttributeDisplayProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  isEditing?: boolean;
  onRoll: () => void;
  onChange?: (val: number) => void;
}

const AttributeDisplay: React.FC<AttributeDisplayProps> = ({ 
  label, value, icon: Icon, color, isEditing, onRoll, onChange 
}) => {
  const displayValue = value >= 0 ? `+${value}` : `${value}`;

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 group"
      style={{ boxShadow: isEditing ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
    >
      {/* Glow Effect behind Icon */}
      <div 
        className="absolute w-16 h-16 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
        style={{ backgroundColor: color }}
      ></div>

      <div onClick={!isEditing ? onRoll : undefined} className={!isEditing ? "cursor-pointer contents" : "contents"}>
        <Icon 
          size={32} 
          className={`mb-2 drop-shadow-md z-10 transition-transform ${!isEditing && 'group-hover:scale-110'}`}
          style={{ color: color }} 
        />
        
        {isEditing ? (
          <input 
            type="number" 
            value={value}
            onChange={(e) => onChange && onChange(parseInt(e.target.value) || 0)}
            className="w-16 bg-black/30 text-white font-title text-xl text-center border-b-2 border-white/20 focus:border-white/80 outline-none rounded-t"
          />
        ) : (
          <span 
            className="text-3xl font-black font-title z-10 text-white tracking-widest" 
            style={{ textShadow: `0 2px 4px rgba(0,0,0,0.8), 0 0 10px ${color}40` }}
          >
            {displayValue}
          </span>
        )}
        
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 font-header group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
    </div>
  );
};

export default AttributeDisplay;