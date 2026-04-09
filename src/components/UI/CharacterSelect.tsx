import React from 'react';
import { motion } from 'motion/react';
import { CHARACTERS } from '../../constants';
import { Character } from '../../types';
import { User, Zap, Shield, Move, Target, Maximize } from 'lucide-react';

interface CharacterSelectProps {
  onSelect: (character: Character) => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto font-retro">
      <h2 className="text-3xl font-bold text-white mb-12 text-center tracking-tighter uppercase">
        SELECT YOUR <span className="text-yellow-400">HERO</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {CHARACTERS.map((char) => (
          <motion.button
            key={char.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(char)}
            className="group relative bg-gray-900 border-4 border-gray-700 rounded-none p-6 text-left transition-all hover:border-yellow-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <div className="relative z-10">
              <div 
                className="w-16 h-16 mb-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                style={{ backgroundColor: char.color }}
              >
                {/* Pixel character representation */}
                <div className="w-full h-full flex items-center justify-center">
                   <div className="w-4 h-4 bg-white" />
                </div>
              </div>
              
              <h3 className="text-sm font-bold text-white mb-2 uppercase">{char.name}</h3>
              <p className="text-[8px] font-bold text-yellow-400 uppercase tracking-tighter mb-4">
                {char.ability}
              </p>
              
              <p className="text-gray-500 text-[8px] leading-relaxed mb-6 uppercase">
                {char.description}
              </p>
              
              <div className="space-y-4">
                <StatBar label="SPD" value={char.stats.speed} max={10} color="bg-blue-500" />
                <StatBar label="JMP" value={char.stats.jump} max={20} color="bg-green-500" />
                <StatBar label="STR" value={char.stats.strength} max={10} color="bg-red-500" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const StatBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="h-2 w-full bg-gray-800 rounded-none border-2 border-black">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);
