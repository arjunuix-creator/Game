import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { CharacterSelect } from './components/UI/CharacterSelect';
import { GameView } from './components/Game/GameView';
import { Shop } from './components/UI/Shop';
import { Trading } from './components/UI/Trading';
import { Character, UserProfile } from './types';
import { CHARACTERS, ITEMS } from './constants';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, ShoppingBag, Calendar, LogOut, Play, Settings } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [view, setView] = useState<'home' | 'game' | 'social' | 'shop' | 'leaderboard'>('home');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => doc.data());
      setLeaderboard(entries);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
          const char = CHARACTERS.find(c => c.id === userDoc.data().selectedCharacterId);
          if (char) setSelectedChar(char);
        } else {
          // Create initial profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Pioneer',
            email: firebaseUser.email || '',
            selectedCharacterId: '',
            level: 1,
            xp: 0,
            coins: 0,
            inventory: [],
            unlockedOutfits: [],
            unlockedSkills: [],
            gameLevel: 1
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
        setSelectedChar(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("Login cancelled by user");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCharacterSelect = async (char: Character) => {
    setSelectedChar(char);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        selectedCharacterId: char.id
      });
      setProfile(prev => prev ? { ...prev, selectedCharacterId: char.id } : null);
    }
  };

  const handleCoinCollect = async (count: number) => {
    if (user && profile) {
      const currentCoins = isNaN(profile.coins) ? 0 : profile.coins;
      const currentXp = isNaN(profile.xp) ? 0 : profile.xp;
      const currentLevel = isNaN(profile.level) ? 1 : profile.level;

      const newCoins = currentCoins + 1;
      const newXp = currentXp + 10;
      let newLevel = currentLevel;
      if (newXp >= currentLevel * 100) {
          newLevel++;
      }
      
      const updates = {
        coins: newCoins,
        xp: newXp,
        level: newLevel
      };

      await updateDoc(doc(db, 'users', user.uid), updates);
      
      // Also update leaderboard
      await setDoc(doc(db, 'leaderboard', user.uid), {
        uid: user.uid,
        displayName: profile.displayName,
        level: newLevel,
        score: newXp
      }, { merge: true });

      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleLevelComplete = async (nextLevel: number) => {
    if (user && profile) {
      const updates = { gameLevel: nextLevel };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setProfile(prev => prev ? { ...prev, gameLevel: nextLevel } : null);
      
      // Bonus for level completion
      const currentGameLevel = isNaN(profile.gameLevel) ? 1 : (profile.gameLevel || 1);
      const bonusCoins = 50 + (currentGameLevel * 10);
      const bonusXp = 100 + (currentGameLevel * 20);
      
      const currentCoins = isNaN(profile.coins) ? 0 : profile.coins;
      const currentXp = isNaN(profile.xp) ? 0 : profile.xp;
      const currentLevel = isNaN(profile.level) ? 1 : profile.level;

      const newCoins = currentCoins + bonusCoins;
      const newXp = currentXp + bonusXp;
      let newLevel = currentLevel;
      if (newXp >= currentLevel * 100) {
          newLevel++;
      }

      const statsUpdates = {
        coins: newCoins,
        xp: newXp,
        level: newLevel
      };

      await updateDoc(doc(db, 'users', user.uid), statsUpdates);
      setProfile(prev => prev ? { ...prev, ...statsUpdates } : null);
    }
  };

  const handlePurchase = async (itemId: string) => {
    if (!user || !profile) return;
    const item = ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const isOwned = profile.inventory.includes(itemId);

    if (isOwned) {
      // Equip logic
      if (item.type === 'outfit') {
        await updateDoc(doc(db, 'users', user.uid), { equippedOutfitId: itemId });
        setProfile(prev => prev ? { ...prev, equippedOutfitId: itemId } : null);
      }
      return;
    }

    if (profile.coins < item.price) return;

    const newCoins = profile.coins - item.price;
    const newInventory = [...profile.inventory, itemId];
    const updates: any = { coins: newCoins, inventory: newInventory };
    
    if (item.type === 'outfit') {
        updates.unlockedOutfits = [...profile.unlockedOutfits, itemId];
        updates.equippedOutfitId = itemId;
    }
    if (item.type === 'skill') updates.unlockedSkills = [...profile.unlockedSkills, itemId];

    await updateDoc(doc(db, 'users', user.uid), updates);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden font-retro">
        {/* Background Image with Retro Feel */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/pixel-art-landscape/1920/1080?blur=1" 
            alt="Game Background" 
            className="w-full h-full object-cover opacity-30 grayscale-[0.3] contrast-125 scale-110"
            referrerPolicy="no-referrer"
          />
          {/* Retro Game Overlays: Scanlines and Pixel Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_100%),linear-gradient(to_bottom,transparent_0%,black_100%)] z-10" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e3a8a,transparent_70%)] opacity-20 z-10" />
          
          {/* Floating Game Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: "110%",
                  rotate: 0
                }}
                animate={{ 
                  y: "-10%",
                  rotate: 360
                }}
                transition={{ 
                  duration: 10 + Math.random() * 20, 
                  repeat: Infinity, 
                  delay: Math.random() * 10,
                  ease: "linear"
                }}
                className="absolute w-4 h-4 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter uppercase leading-tight">
            PIXEL <br/><span className="text-yellow-400">PIONEERS</span>
          </h1>
          
          {/* Hero Sprite on Start Screen */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-20 bg-blue-500 border-4 border-black mx-auto mb-8 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute top-4 right-2 w-4 h-4 bg-white border-2 border-black">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black" />
            </div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-black/20" />
          </motion.div>

          <p className="text-gray-500 text-xs mb-12 max-w-md mx-auto uppercase leading-loose">
            EMBARK ON A HIGH-STAKES ADVENTURE ACROSS THE DIGITAL FRONTIER.
          </p>
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="bg-white text-black px-10 py-5 rounded-none font-bold text-sm hover:bg-yellow-400 transition-all border-b-8 border-r-8 border-gray-400 active:border-0 active:translate-x-2 active:translate-y-2 shadow-2xl disabled:opacity-50 uppercase"
          >
            {isLoggingIn ? 'CONNECTING...' : 'INSERT COIN'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-retro selection:bg-yellow-400/30">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-24 bg-gray-900 border-r-4 border-black flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-blue-600 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]">
          <Play size={20} className="fill-white" />
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          <NavButton active={view === 'home'} onClick={() => setView('home')} icon={<Users size={20} />} label="Home" />
          <NavButton active={view === 'leaderboard'} onClick={() => setView('leaderboard')} icon={<Trophy size={20} />} label="Rank" />
          <NavButton active={view === 'shop'} onClick={() => setView('shop')} icon={<ShoppingBag size={20} />} label="Shop" />
          <NavButton active={view === 'social'} onClick={() => setView('social')} icon={<Calendar size={20} />} label="Daily" />
        </div>

        <button 
          onClick={() => auth.signOut()}
          className="p-3 text-gray-600 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="pl-24 min-h-screen">
        <header className="h-24 border-b-4 border-black flex items-center justify-between px-8 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-bold tracking-tighter uppercase">
              {view}
            </h2>
            {profile && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-black/40 px-4 py-2 border-2 border-gray-800">
                  <div className="text-[10px] font-bold text-blue-400">LVL {profile.level}</div>
                  <div className="h-2 w-32 bg-gray-900 border border-black">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ 
                        width: `${Math.max(0, Math.min(100, 
                          ((isNaN(profile.xp) ? 0 : profile.xp) % ((isNaN(profile.level) ? 1 : profile.level) * 100)) / 
                          (isNaN(profile.level) ? 1 : profile.level)
                        ))}%` 
                      }} 
                    />
                  </div>
                </div>
                <div className="bg-black/40 px-4 py-2 border-2 border-gray-800 flex items-center gap-2">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">World</span>
                  <span className="text-[10px] font-bold text-yellow-500">{profile.gameLevel || 1}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-400 border border-black" />
              <span className="font-bold text-xs text-yellow-400">
                {isNaN(profile?.coins || 0) ? 0 : (profile?.coins || 0)} COINS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase leading-none">{profile?.displayName}</p>
                <p className="text-[8px] text-gray-600 uppercase tracking-widest mt-1">Pioneer</p>
              </div>
              <div className="w-12 h-12 border-4 border-black bg-gray-800 p-0.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                <div className="w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Users size={20} className="text-gray-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {!selectedChar ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CharacterSelect onSelect={handleCharacterSelect} />
              </motion.div>
            ) : view === 'game' ? (
              <motion.div
                key="game"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-[calc(100vh-14rem)]"
              >
                <GameView 
                  character={selectedChar} 
                  initialLevel={profile.gameLevel || 1}
                  onCoinCollect={handleCoinCollect}
                  onGameOver={() => setView('home')}
                  onLevelComplete={handleLevelComplete}
                />
              </motion.div>
            ) : view === 'shop' ? (
              <motion.div key="shop" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Shop profile={profile} onPurchase={handlePurchase} />
              </motion.div>
            ) : view === 'social' ? (
              <motion.div key="social" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Trading profile={profile} />
              </motion.div>
            ) : view === 'leaderboard' ? (
              <motion.div key="leaderboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="max-w-4xl mx-auto space-y-8">
                  <h2 className="text-2xl font-bold uppercase">GLOBAL <span className="text-yellow-400">RANKINGS</span></h2>
                  <div className="bg-gray-900 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b-4 border-black bg-gray-800">
                          <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase">Rank</th>
                          <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase">Player</th>
                          <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase">Level</th>
                          <th className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                          <tr key={i} className="border-b-2 border-black hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6 text-xs font-bold text-gray-600">#{i + 1}</td>
                            <td className="px-8 py-6 text-xs font-bold uppercase">{entry.displayName}</td>
                            <td className="px-8 py-6 text-blue-400 text-[10px] font-bold">LVL {entry.level}</td>
                            <td className="px-8 py-6 text-xs font-bold text-right">{entry.score}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-600 text-xs uppercase">No rankings yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-12"
              >
                {/* Hero Card */}
                <div className="lg:col-span-2 space-y-12">
                  <div className="relative h-[400px] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] overflow-hidden group">
                    <img 
                      src="https://picsum.photos/seed/pixel/1200/800" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                      alt="Game Background"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-12 left-12 right-12">
                      <h3 className="text-3xl font-bold mb-8 tracking-tighter uppercase leading-tight">READY FOR THE <br/><span className="text-yellow-400">NEXT FRONTIER?</span></h3>
                      <button 
                        onClick={() => setView('game')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 border-b-4 border-r-4 border-blue-900 active:border-0 active:translate-x-1 active:translate-y-1 font-bold flex items-center gap-4 transition-all uppercase text-xs"
                      >
                        <Play size={16} fill="currentColor" />
                        START GAME
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-gray-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                      <h4 className="text-[10px] font-bold text-gray-600 uppercase mb-6">Current Hero</h4>
                      <div className="flex items-center gap-6">
                        <div 
                          className="w-16 h-16 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex items-center justify-center"
                          style={{ backgroundColor: selectedChar.color }}
                        >
                          <div className="w-4 h-4 bg-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase">{selectedChar.name}</p>
                          <p className="text-yellow-400 font-bold text-[8px] uppercase mt-2">{selectedChar.ability}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedChar(null)}
                        className="mt-8 text-[8px] font-bold text-gray-600 hover:text-white transition-colors flex items-center gap-2 uppercase"
                      >
                        <Settings size={12} />
                        CHANGE HERO
                      </button>
                    </div>

                    <div className="bg-gray-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                      <h4 className="text-[10px] font-bold text-gray-600 uppercase mb-6">Daily Quest</h4>
                      <div className="space-y-6">
                        <p className="text-xs font-bold uppercase">Collect 50 Coins</p>
                        <div className="h-3 w-full bg-gray-800 border-2 border-black">
                          <div className="h-full bg-yellow-400 w-1/3" />
                        </div>
                        <p className="text-[8px] text-gray-600 uppercase">Reward: 200 XP + 50 Coins</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-12">
                  <div className="bg-gray-900 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                    <h4 className="text-sm font-bold mb-8 flex items-center gap-3 uppercase">
                      <Trophy size={18} className="text-yellow-400" />
                      TOP PLAYERS
                    </h4>
                    <div className="space-y-8">
                      {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-gray-700 group-hover:text-yellow-400 transition-colors">0{i+1}</span>
                            <div>
                              <p className="font-bold text-[10px] uppercase">{entry.displayName}</p>
                              <p className="text-[8px] text-gray-600 uppercase mt-1">LVL {entry.level}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[10px]">{entry.score}</p>
                            <p className="text-[8px] text-gray-600 uppercase mt-1">PTS</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-[8px] text-gray-600 text-center py-4 uppercase">No data</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setView('leaderboard')}
                      className="w-full mt-10 py-4 bg-white/5 border-2 border-black text-[8px] font-bold hover:bg-white/10 transition-colors uppercase"
                    >
                      VIEW ALL
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative group p-4 border-4 transition-all duration-200",
      active 
        ? "bg-yellow-400 text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" 
        : "text-gray-600 border-transparent hover:border-gray-800 hover:text-white"
    )}
  >
    {icon}
    <span className="absolute left-full ml-6 px-3 py-2 bg-black text-white text-[8px] font-bold rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase border-2 border-gray-700">
      {label}
    </span>
  </button>
);
