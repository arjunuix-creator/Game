import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Star, Zap } from 'lucide-react';
import { ITEMS } from '../../constants';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface ShopProps {
  profile: UserProfile;
  onPurchase: (itemId: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ profile, onPurchase }) => {
  return (
    <div className="space-y-12 font-retro">
      <div className="flex items-center justify-between border-b-4 border-black pb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tighter">ITEM <span className="text-yellow-400">SHOP</span></h2>
        <div className="bg-black/40 border-4 border-gray-800 px-6 py-3 flex items-center gap-4">
          <div className="w-3 h-3 bg-yellow-400 border border-black" />
          <span className="text-xs font-bold text-yellow-400">{profile.coins} COINS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {ITEMS.map((item) => {
          const isOwned = profile.inventory.includes(item.id);
          const isEquipped = profile.equippedOutfitId === item.id;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -5 }}
              className={cn(
                "bg-gray-900 border-4 rounded-none p-6 flex flex-col transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]",
                isEquipped ? "border-blue-500" : "border-gray-800"
              )}
            >
              <div className="w-12 h-12 bg-black border-2 border-gray-800 flex items-center justify-center mb-6">
                {item.type === 'outfit' ? <ShoppingBag className="text-purple-400" size={20} /> : <Zap className="text-yellow-400" size={20} />}
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[10px] uppercase">{item.name}</h3>
                {isEquipped && <span className="text-[6px] font-bold text-blue-500 bg-blue-500/10 px-1 py-0.5 border border-blue-500/20">ACTIVE</span>}
              </div>
              <p className="text-[8px] text-gray-600 mb-6 flex-1 uppercase leading-relaxed">{item.description}</p>
              
              <button
                disabled={isEquipped || (!isOwned && profile.coins < item.price)}
                onClick={() => onPurchase(item.id)}
                className={cn(
                  "w-full py-3 rounded-none font-bold text-[8px] transition-all border-b-4 border-r-4 active:border-0 active:translate-x-1 active:translate-y-1 uppercase",
                  isEquipped
                    ? "bg-blue-600 text-white border-blue-900 cursor-default"
                    : isOwned 
                      ? "bg-gray-800 text-white border-black hover:bg-gray-700" 
                      : profile.coins >= item.price
                        ? "bg-yellow-400 text-black border-yellow-700 hover:bg-yellow-300"
                        : "bg-gray-900 text-gray-700 border-gray-950 cursor-not-allowed"
                )}
              >
                {isEquipped ? 'EQUIPPED' : isOwned ? 'EQUIP' : `${item.price} COINS`}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
