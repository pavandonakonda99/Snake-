/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Music Data ---
const TRACKS = [
  {
    id: 1,
    title: "SECTOR_01_DRIFT",
    artist: "MECH_SYNTH_V1",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/200/200?grayscale"
  },
  {
    id: 2,
    title: "CYBER_PULSE_ERR",
    artist: "MECH_SYNTH_V2",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/200/200?grayscale"
  },
  {
    id: 3,
    title: "VOID_HORIZON",
    artist: "MECH_SYNTH_V3",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch3/200/200?grayscale"
  }
];

// --- Game Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 100; // Faster, more brutal

type Point = { x: number; y: number };

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("AUDIO.ERR:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  
  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    handleNext();
  };

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameStarted(true);
    setIsGamePaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && isGameStarted && !gameOver) {
        setIsGamePaused(p => !p);
        return;
      }

      if (!isGameStarted || gameOver || isGamePaused) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted, gameOver, isGamePaused]);

  useEffect(() => {
    if (!isGameStarted || gameOver || isGamePaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const currentDir = directionRef.current;
        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }

        return newSnake;
      });
    };

    const speed = Math.max(40, BASE_SPEED - Math.floor(score / 50) * 10);
    const gameLoop = setInterval(moveSnake, speed);

    return () => clearInterval(gameLoop);
  }, [isGameStarted, gameOver, isGamePaused, food, score, highScore, generateFood]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-[#00FFFF] font-mono flex flex-col items-center justify-center p-4 overflow-hidden relative crt-flicker">
      <div className="scanlines" />
      <div className="noise" />

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnded}
        preload="auto"
      />

      <h1 className="glitch text-5xl md:text-6xl mb-12 z-10 tracking-widest" data-text="SYS.CORE.OVERRIDE">SYS.CORE.OVERRIDE</h1>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 items-start">
        
        {/* Left Panel: Music Player */}
        <div className="flex flex-col items-center lg:items-end justify-center order-2 lg:order-1 w-full">
          <div className="brutal-border p-6 w-full max-w-sm screen-tear">
            <h2 className="text-[#FF00FF] font-bold text-2xl border-b-4 border-[#FF00FF] pb-2 mb-6 tracking-widest">SYS.AUDIO.STREAM</h2>
            
            <div className="relative mb-6 border-4 border-[#00FFFF] aspect-square overflow-hidden">
              <img 
                src={currentTrack.cover} 
                alt={currentTrack.title} 
                className={`w-full h-full object-cover ${isPlaying ? 'scale-110' : 'scale-100'} transition-transform duration-1000`}
                referrerPolicy="no-referrer"
                style={{ filter: 'contrast(1.5) saturate(1.5) hue-rotate(90deg)' }}
              />
              <div className="absolute inset-0 bg-[#FF00FF] mix-blend-overlay opacity-40" />
              
              {/* Equalizer animation overlay when playing */}
              {isPlaying && (
                <div className="absolute bottom-4 left-4 flex items-end gap-2 h-12">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className="w-3 bg-[#00FFFF]"
                      style={{
                        animation: `eq ${0.2 + Math.random() * 0.3}s steps(5, end) infinite alternate`,
                        height: `${20 + Math.random() * 80}%`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white truncate uppercase">{currentTrack.title}</h3>
              <p className="text-lg text-[#FF00FF] truncate uppercase">{currentTrack.artist}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <button onClick={handlePrev} className="brutal-border px-4 py-2 text-xl hover:bg-[#00FFFF] hover:text-black">[ &lt;&lt; ]</button>
                <button onClick={handlePlayPause} className="brutal-border px-6 py-2 text-2xl hover:bg-[#00FFFF] hover:text-black flex-1 text-center">
                  {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
                </button>
                <button onClick={handleNext} className="brutal-border px-4 py-2 text-xl hover:bg-[#00FFFF] hover:text-black">[ &gt;&gt; ]</button>
              </div>
              <button onClick={() => setIsMuted(!isMuted)} className="brutal-border-alt px-4 py-2 text-xl hover:bg-[#FF00FF] hover:text-black w-full text-center">
                {isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE'}
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel: Snake Game */}
        <div className="flex flex-col items-center order-1 lg:order-2 w-full">
          <div className="mb-4 flex items-center justify-between w-full px-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#FF00FF] tracking-widest">DATA.YIELD</span>
              <span className="text-4xl font-black text-white">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-bold text-[#FF00FF] tracking-widest">MAX.YIELD</span>
              <span className="text-4xl font-black text-white">{highScore.toString().padStart(4, '0')}</span>
            </div>
          </div>

          <div className="brutal-border-alt p-2 relative bg-black">
            {/* Game Grid */}
            <div 
              className="relative overflow-hidden"
              style={{
                width: `${GRID_SIZE * 20}px`,
                height: `${GRID_SIZE * 20}px`,
                background: '#000',
                backgroundImage: 'linear-gradient(to right, rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              {/* Food */}
              <div 
                className="absolute bg-white animate-pulse"
                style={{
                  width: '20px',
                  height: '20px',
                  left: `${food.x * 20}px`,
                  top: `${food.y * 20}px`,
                  boxShadow: '0 0 10px #FF00FF, 0 0 20px #FF00FF'
                }}
              />

              {/* Snake */}
              {snake.map((segment, index) => {
                const isHead = index === 0;
                return (
                  <div
                    key={`${segment.x}-${segment.y}-${index}`}
                    className="absolute"
                    style={{
                      width: '20px',
                      height: '20px',
                      left: `${segment.x * 20}px`,
                      top: `${segment.y * 20}px`,
                      backgroundColor: isHead ? '#FF00FF' : '#00FFFF',
                      border: '1px solid #000',
                      boxShadow: isHead ? '0 0 10px #FF00FF' : 'none',
                      zIndex: isHead ? 10 : 1
                    }}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {(!isGameStarted || gameOver || isGamePaused) && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 p-4 text-center">
                {gameOver ? (
                  <>
                    <h3 className="glitch text-5xl font-black text-[#FF00FF] mb-6" data-text="SYSTEM.FAILURE">SYSTEM.FAILURE</h3>
                    <p className="text-2xl text-white mb-8">FINAL YIELD: {score}</p>
                    <button 
                      onClick={resetGame}
                      className="brutal-border px-8 py-4 text-2xl bg-black hover:bg-[#00FFFF] hover:text-black transition-colors"
                    >
                      [ REBOOT.SEQUENCE ]
                    </button>
                  </>
                ) : !isGameStarted ? (
                  <>
                    <h3 className="glitch text-4xl font-black text-[#00FFFF] mb-8" data-text="AWAITING.INPUT">AWAITING.INPUT</h3>
                    <button 
                      onClick={resetGame}
                      className="brutal-border px-8 py-4 text-2xl bg-black hover:bg-[#00FFFF] hover:text-black transition-colors"
                    >
                      [ INIT.PROTOCOL ]
                    </button>
                  </>
                ) : isGamePaused ? (
                  <>
                    <h3 className="glitch text-5xl font-black text-white mb-8" data-text="SYS.PAUSED">SYS.PAUSED</h3>
                    <button 
                      onClick={() => setIsGamePaused(false)}
                      className="brutal-border px-8 py-4 text-2xl bg-black hover:bg-[#00FFFF] hover:text-black transition-colors"
                    >
                      [ RESUME.EXECUTION ]
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Instructions / Info */}
        <div className="hidden lg:flex flex-col items-start justify-center order-3 w-full">
          <div className="brutal-border p-6 w-full max-w-sm">
            <h3 className="text-[#FF00FF] font-bold text-2xl border-b-4 border-[#FF00FF] pb-2 mb-6 tracking-widest">INPUT.PARAMS</h3>
            <ul className="space-y-6 text-xl text-white">
              <li className="flex items-center justify-between">
                <span>VECTOR.UP</span>
                <span className="text-[#00FFFF]">[ W ]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>VECTOR.LEFT</span>
                <span className="text-[#00FFFF]">[ A ]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>VECTOR.DOWN</span>
                <span className="text-[#00FFFF]">[ S ]</span>
              </li>
              <li className="flex items-center justify-between">
                <span>VECTOR.RIGHT</span>
                <span className="text-[#00FFFF]">[ D ]</span>
              </li>
              <li className="flex items-center justify-between pt-4 border-t-4 border-[#FF00FF]">
                <span>HALT.EXEC</span>
                <span className="text-[#00FFFF]">[ SPACE ]</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes eq {
          0% { height: 20%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
}
