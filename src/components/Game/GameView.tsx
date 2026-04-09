import React, { useEffect, useRef } from 'react';
import { GameEngine } from './Engine';
import { Character } from '../../types';

interface GameViewProps {
  character: Character;
  initialLevel: number;
  onCoinCollect: (count: number) => void;
  onGameOver: () => void;
  onLevelComplete: (level: number) => void;
}

export const GameView: React.FC<GameViewProps> = ({ 
  character, 
  initialLevel,
  onCoinCollect, 
  onGameOver,
  onLevelComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new GameEngine(
        canvasRef.current,
        character,
        initialLevel,
        onCoinCollect,
        onGameOver,
        onLevelComplete
      );
      engineRef.current = engine;
      engine.start();

      return () => {
        engine.stop();
      };
    }
  }, [character, initialLevel]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900 overflow-hidden rounded-xl shadow-2xl border-4 border-gray-800">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="max-w-full max-h-full"
      />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white text-sm">
          <p className="font-bold text-blue-400">Controls</p>
          <p>Arrows: Move</p>
          <p>Space: Jump</p>
          {character.id === 'praveen' && <p>Shift: Dash</p>}
        </div>
      </div>
    </div>
  );
};
