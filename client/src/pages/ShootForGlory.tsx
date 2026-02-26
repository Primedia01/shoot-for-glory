import React, { useState, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trophy, ArrowUp, Zap, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Import generated assets
import stadiumBg from "@/assets/images/stadium-bg.png";
import soccerBall from "@/assets/images/soccer-ball.png";

type ShotStatus = "idle" | "shooting" | "goal" | "miss";

export default function ShootForGlory() {
  const [shotStatus, setShotStatus] = useState<ShotStatus>("idle");
  const [score, setScore] = useState(12400); // Mock leaderboard score
  const [power, setPower] = useState(0);

  // Billboard ball animation controls
  const billboardBallControls = useAnimation();

  // Reset the game after a few seconds
  useEffect(() => {
    if (shotStatus === "goal" || shotStatus === "miss") {
      const timer = setTimeout(() => {
        setShotStatus("idle");
        billboardBallControls.set({ y: 0, scale: 1, x: 0, opacity: 1 });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [shotStatus, billboardBallControls]);

  const handleSwipeEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    // If swiped up fast enough or far enough
    if (info.offset.y < -100 || info.velocity.y < -500) {
      // Calculate a pseudo-random accuracy based on swipe x
      const isGoal = Math.abs(info.offset.x) < 150; // Simple logic: keep it relatively straight
      
      setPower(Math.min(Math.abs(Math.round(info.velocity.y / 10)), 100));
      setShotStatus("shooting");

      // Animate the DOOH screen ball
      billboardBallControls.start({
        y: -300, // Move up into the net
        x: info.offset.x * 1.5, // curve based on swipe
        scale: 0.3, // get smaller as it goes away
        transition: { duration: 0.4, ease: "easeOut" },
      }).then(() => {
        if (isGoal) {
          setShotStatus("goal");
          setScore((s) => s + 100);
        } else {
          setShotStatus("miss");
        }
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      
      {/* LEFT SIDE: MOBILE INTERFACE (Simulator) */}
      <div className="w-[400px] flex-shrink-0 bg-neutral-950 border-r border-neutral-800 p-8 flex flex-col relative z-20 shadow-2xl z-20">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="w-5 h-5 fill-primary" />
            <span className="font-display tracking-widest text-xl">LIVE SYNC</span>
          </div>
          <h1 className="text-3xl font-display leading-none mb-2">Shoot for Glory</h1>
          <p className="text-neutral-400 text-sm">Swipe up to take your penalty on the big screen.</p>
        </div>

        {/* The Mobile "Phone" Frame */}
        <div className="flex-1 rounded-[2.5rem] border-4 border-neutral-800 bg-neutral-900 relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,102,0.1)]">
          {/* Top Status Bar */}
          <div className="h-6 w-full flex justify-center pt-2">
            <div className="w-20 h-4 bg-neutral-950 rounded-full"></div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-end pb-12 relative">
            
            {/* Target Reticle Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <Target className="w-48 h-48" />
            </div>

            {/* Instruction / Feedback */}
            <div className="absolute top-1/4 w-full text-center px-4">
              {shotStatus === "idle" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 text-neutral-400"
                >
                  <ArrowUp className="w-8 h-8 animate-bounce text-primary" />
                  <span className="font-display text-2xl uppercase tracking-widest text-primary">Swipe to Shoot</span>
                </motion.div>
              )}
              {shotStatus === "shooting" && (
                <h2 className="font-display text-4xl text-yellow-400 animate-pulse">Power: {power}%</h2>
              )}
              {shotStatus === "goal" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-6xl text-primary drop-shadow-[0_0_15px_rgba(0,255,102,0.8)]"
                >
                  GOAL!
                </motion.div>
              )}
              {shotStatus === "miss" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-5xl text-destructive"
                >
                  MISSED
                </motion.div>
              )}
            </div>

            {/* Draggable Ball Area */}
            {shotStatus === "idle" ? (
              <motion.div
                className="w-24 h-24 rounded-full cursor-grab active:cursor-grabbing relative z-10"
                drag
                dragConstraints={{ left: -50, right: 50, top: -300, bottom: 0 }}
                onDragEnd={handleSwipeEnd}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={soccerBall} alt="Soccer Ball" className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              </motion.div>
            ) : (
              <div className="w-24 h-24 opacity-20 transition-opacity duration-1000">
                 <img src={soccerBall} alt="Soccer Ball Ghost" className="w-full h-full object-contain blur-sm" />
              </div>
            )}
            
            {/* Turf indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none rounded-b-[2rem]" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: DOOH BILLBOARD */}
      <div className="flex-1 relative bg-neutral-900 overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        
        {/* Gradient Overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        
        {/* Main Content Container */}
        <div className="absolute inset-0 flex flex-col p-12 z-10">
          
          {/* Billboard Header */}
          <div className="flex justify-between items-start w-full">
            <div>
              <h2 className="font-display text-6xl text-white tracking-wider leading-none drop-shadow-lg">
                MALL OF AFRICA <span className="text-primary block text-3xl">LIVE PENALTY ZONE</span>
              </h2>
            </div>
            
            {/* Leaderboard Module */}
            <Card className="bg-black/60 backdrop-blur-md border-neutral-800 p-6 min-w-[300px]">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <Trophy className="w-6 h-6" />
                <h3 className="font-display text-2xl tracking-widest">LEADERBOARD</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-primary/20 text-primary px-4 py-2 rounded">
                  <span className="font-bold">1. @JHB_Kicker</span>
                  <span className="font-display text-2xl">{score + 500}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 px-4 py-2 rounded">
                  <span className="font-bold text-white">2. You (Live)</span>
                  <span className="font-display text-2xl text-white">
                    <motion.span key={score} initial={{ scale: 1.5, color: '#00ff66' }} animate={{ scale: 1, color: '#ffffff' }}>
                      {score}
                    </motion.span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-neutral-400 px-4 py-2">
                  <span>3. @SarahG_99</span>
                  <span className="font-display text-xl">11200</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Goal Net Area */}
          <div className="flex-1 flex flex-col items-center justify-end pb-20 relative">
            
            {/* Stylized Goal Post Box */}
            <div className="absolute bottom-10 w-[800px] h-[350px] border-t-8 border-x-8 border-white/80 rounded-t-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {/* Net Pattern - Using linear gradients to simulate net */}
              <div className="w-full h-full opacity-30" style={{
                backgroundImage: 'linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            {/* The Billboard Ball */}
            <motion.div
              className="relative z-20 w-32 h-32"
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={billboardBallControls}
            >
              {shotStatus !== "idle" && (
                <img src={soccerBall} alt="Billboard Ball" className="w-full h-full object-contain" />
              )}
            </motion.div>
            
            {/* Interactive Call to Action on Screen */}
            {shotStatus === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border-2 border-primary px-8 py-6 rounded-2xl flex flex-col items-center text-center animate-pulse">
                  <h1 className="font-display text-7xl text-white">SCAN TO PLAY</h1>
                  <p className="text-primary text-2xl font-bold tracking-widest mt-2">QR CODE OR CONNECT DEVICE</p>
                </div>
              </div>
            )}
            
            {/* Feedback Overlays */}
            {shotStatus === "goal" && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center">
                  <h1 className="font-display text-[12rem] text-primary leading-none drop-shadow-[0_0_40px_rgba(0,255,102,1)] italic">GOAL!!!</h1>
                  <p className="font-display text-5xl text-white mt-4">+100 POINTS</p>
                </div>
              </motion.div>
            )}

            {shotStatus === "miss" && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center">
                  <h1 className="font-display text-[10rem] text-destructive leading-none drop-shadow-[0_0_40px_rgba(255,0,0,0.8)] italic">SAVED</h1>
                  <p className="font-display text-4xl text-neutral-300 mt-4">NICE TRY. SWIPE TO GO AGAIN.</p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}