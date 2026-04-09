import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, ArrowLeftRight, Package, Send } from 'lucide-react';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface TradingProps {
  profile: UserProfile;
}

export const Trading: React.FC<TradingProps> = ({ profile }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-trades'>('browse');

  return (
    <div className="space-y-12 font-retro">
      <div className="flex items-center justify-between border-b-4 border-black pb-8">
        <h2 className="text-2xl font-bold uppercase tracking-tighter">MARKET <span className="text-blue-500">PLACE</span></h2>
        <div className="flex bg-black border-4 border-gray-800 p-1">
          <button 
            onClick={() => setActiveTab('browse')}
            className={cn("px-6 py-3 text-[8px] font-bold transition-all uppercase", activeTab === 'browse' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white")}
          >
            BROWSE
          </button>
          <button 
            onClick={() => setActiveTab('my-trades')}
            className={cn("px-6 py-3 text-[8px] font-bold transition-all uppercase", activeTab === 'my-trades' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white")}
          >
            MY TRADES
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'browse' ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 border-4 border-black p-6 flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-black border-2 border-gray-800 flex items-center justify-center">
                      <Package size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase">Player_{i*999}</p>
                      <p className="text-[8px] text-gray-600 uppercase mt-1">Level {10 + i}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Offering</p>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-purple-500/20 border-2 border-purple-500/30" />
                        <div className="w-6 h-6 bg-blue-500/20 border-2 border-blue-500/30" />
                      </div>
                    </div>
                    <ArrowLeftRight className="text-gray-600" size={16} />
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 border-b-4 border-r-4 border-blue-900 active:border-0 active:translate-x-1 active:translate-y-1 text-[8px] font-bold uppercase">
                      OFFER TRADE
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 border-4 border-black bg-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
              <Package size={48} className="mb-6 opacity-20" />
              <p className="text-[10px] font-bold uppercase">No active trades</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border-4 border-black p-8 h-fit shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          <h4 className="text-[10px] font-bold mb-8 flex items-center gap-3 uppercase">
            <Send size={16} className="text-blue-500" />
            NEW REQUEST
          </h4>
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Select Item</label>
              <div className="grid grid-cols-4 gap-2">
                {profile.inventory.length > 0 ? (
                  profile.inventory.map(id => (
                    <div key={id} className="aspect-square bg-black border-2 border-gray-800 hover:border-blue-500 cursor-pointer transition-all" />
                  ))
                ) : (
                  <div className="col-span-4 py-8 text-center bg-black border-2 border-dashed border-gray-800">
                    <p className="text-[8px] text-gray-700 font-bold uppercase">Empty</p>
                  </div>
                )}
              </div>
            </div>
            <button className="w-full py-4 bg-blue-600 text-white font-bold text-[8px] hover:bg-blue-500 border-b-4 border-r-4 border-blue-900 active:border-0 active:translate-x-1 active:translate-y-1 uppercase">
              POST TO MARKET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
