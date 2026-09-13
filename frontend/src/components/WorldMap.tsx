import React, { useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import { User, Character } from '../types';
import { soundEngine } from '../services/soundEngine';

interface WorldMapProps {
  user: User;
  character: Character;
  onNavigateTab: (tab: 'quests' | 'boss' | 'armory' | 'chronicle' | 'rewards') => void;
  onAttackBoss?: () => void;
  onAwardBonus?: (gold: number, xp: number, message: string) => void;
}

interface Landmark {
  id: string;
  name: string;
  sub: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  icon: string;
  actionText: string;
  targetTab?: 'quests' | 'boss' | 'armory' | 'chronicle';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  user,
  character,
  onNavigateTab,
  onAwardBonus
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Hero State
  const playerRef = useRef({
    x: 400,
    y: 210,
    targetX: 400,
    targetY: 210,
    vx: 0,
    vy: 0,
    speed: 3.8,
    facing: 'down' as 'down' | 'up' | 'left' | 'right',
    isMoving: false,
    walkFrame: 0,
    lastStepSound: 0
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const particlesRef = useRef<Particle[]>([]);
  const dummyHitRef = useRef<number>(0);
  const chestOpenedRef = useRef<boolean>(false);
  const [chestOpened, setChestOpened] = useState(false);
  const [activePrompt, setActivePrompt] = useState<Landmark | null>(null);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);

  // Map Landmarks
  const landmarks: Landmark[] = [
    {
      id: 'guild',
      name: 'The Quest Guild',
      sub: 'Assign & Complete Deeds',
      x: 170,
      y: 130,
      radius: 55,
      color: '#F59E0B',
      icon: '🏛️',
      actionText: 'Enter Guild (Questboard)',
      targetTab: 'quests'
    },
    {
      id: 'armory',
      name: "The Merchant's Armory",
      sub: 'Weapons & Sacred Relics',
      x: 630,
      y: 130,
      radius: 55,
      color: '#3B82F6',
      icon: '🛡️',
      actionText: 'Enter Armory (Shop)',
      targetTab: 'armory'
    },
    {
      id: 'lair',
      name: 'The Abyssal Lair',
      sub: 'Domain of Titan Malakor',
      x: 400,
      y: 330,
      radius: 60,
      color: '#EF4444',
      icon: '🌋',
      actionText: 'Confront Titan (Boss Raid)',
      targetTab: 'boss'
    },
    {
      id: 'chest',
      name: 'Ancient Treasure Cache',
      sub: chestOpened ? 'Opened today' : 'Glows with forgotten bounty',
      x: 400,
      y: 95,
      radius: 45,
      color: '#10B981',
      icon: '🎁',
      actionText: chestOpened ? 'Already Claimed' : 'Open Treasure Cache!'
    },
    {
      id: 'dummy',
      name: 'Training Grounds',
      sub: 'Hit [Space] or Click to Strike',
      x: 170,
      y: 310,
      radius: 45,
      color: '#8B5CF6',
      icon: '⚔️',
      actionText: 'Practice Weapon Strike'
    }
  ];

  // Spawn Dust Particles
  const spawnDust = (x: number, y: number) => {
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 12 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 0.8,
        size: Math.random() * 3 + 1.5,
        color: 'rgba(212, 175, 55, 0.4)',
        alpha: 0.8,
        life: 0,
        maxLife: 20
      });
    }
  };

  // Practice strike at training grounds
  const handleStrikeAction = () => {
    dummyHitRef.current = 15;
    soundEngine.playSwordSlash();
    const dmg = Math.floor(25 + Math.random() * 20);
    setTrainingMessage(`💥 Struck Training Dummy for ${dmg} DMG!`);
    setTimeout(() => setTrainingMessage(null), 1500);

    // Strike particles
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: 170 + (Math.random() - 0.5) * 20,
        y: 310 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        color: '#FBBF24',
        alpha: 1,
        life: 0,
        maxLife: 25
      });
    }
  };

  // Handle Interaction with Active Landmark
  const handleInteract = () => {
    if (!activePrompt) return;

    if (activePrompt.id === 'chest') {
      if (!chestOpenedRef.current) {
        chestOpenedRef.current = true;
        setChestOpened(true);
        soundEngine.playChestOpen();
        if (onAwardBonus) {
          onAwardBonus(30, 60, '🎁 Treasure Cache opened! +30 Gold, +60 XP!');
        }
      }
      return;
    }

    if (activePrompt.id === 'dummy') {
      handleStrikeAction();
      return;
    }

    if (activePrompt.targetTab) {
      soundEngine.playZoneEnter();
      onNavigateTab(activePrompt.targetTab);
    }
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'e'].includes(key)) {
        e.preventDefault();
      }

      // Action Key [E]
      if (key === 'e') {
        handleInteract();
      }

      // Spacebar for Strike
      if (key === ' ') {
        handleStrikeAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activePrompt, chestOpened]);

  // Mouse / Canvas Click to Move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Set target for pathing
    playerRef.current.targetX = Math.max(30, Math.min(canvas.width - 30, clickX));
    playerRef.current.targetY = Math.max(30, Math.min(canvas.height - 30, clickY));

    // Spawn click pulse effect
    particlesRef.current.push({
      x: clickX,
      y: clickY,
      vx: 0,
      vy: 0,
      size: 16,
      color: 'rgba(245, 158, 11, 0.7)',
      alpha: 1,
      life: 0,
      maxLife: 15
    });
  };

  // Main 60 FPS Game Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let lastPromptId: string | null = null;

    const gameLoop = () => {
      frame++;
      const p = playerRef.current;

      // 1. Process Movement Inputs (Keyboard & Mouse Target)
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        // Keyboard drive
        const len = Math.hypot(dx, dy) || 1;
        p.vx = (dx / len) * p.speed;
        p.vy = (dy / len) * p.speed;
        p.targetX = p.x;
        p.targetY = p.y;
      } else {
        // Mouse click drive
        const toTargetX = p.targetX - p.x;
        const toTargetY = p.targetY - p.y;
        const dist = Math.hypot(toTargetX, toTargetY);
        if (dist > 5) {
          p.vx = (toTargetX / dist) * p.speed;
          p.vy = (toTargetY / dist) * p.speed;
        } else {
          p.vx = 0;
          p.vy = 0;
        }
      }

      // Update position with boundaries
      p.x = Math.max(35, Math.min(canvas.width - 35, p.x + p.vx));
      p.y = Math.max(45, Math.min(canvas.height - 45, p.y + p.vy));

      // Determine facing direction and walking animation
      p.isMoving = Math.hypot(p.vx, p.vy) > 0.5;
      if (p.isMoving) {
        p.walkFrame += 0.25;
        if (Math.abs(p.vx) > Math.abs(p.vy)) {
          p.facing = p.vx > 0 ? 'right' : 'left';
        } else {
          p.facing = p.vy > 0 ? 'down' : 'up';
        }

        // Dust and Footstep sound throttle
        if (frame % 10 === 0) {
          spawnDust(p.x, p.y);
          if (Date.now() - p.lastStepSound > 280) {
            soundEngine.playFootstep();
            p.lastStepSound = Date.now();
          }
        }
      } else {
        p.walkFrame = 0;
      }

      // Check Proximity to Landmarks
      let currentNear: Landmark | null = null;
      landmarks.forEach((lm) => {
        const dist = Math.hypot(p.x - lm.x, p.y - lm.y);
        if (dist < lm.radius) {
          currentNear = lm;
        }
      });

      if (currentNear !== lastPromptId) {
        if (currentNear && (currentNear as Landmark).id !== lastPromptId) {
          soundEngine.playZoneEnter();
        }
        lastPromptId = currentNear ? (currentNear as Landmark).id : null;
        setActivePrompt(currentNear);
      }

      // 2. Render Scene
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep Realm Ground
      const groundGrad = ctx.createRadialGradient(400, 210, 50, 400, 210, 450);
      groundGrad.addColorStop(0, '#10141E');
      groundGrad.addColorStop(0.6, '#0B0D14');
      groundGrad.addColorStop(1, '#06070A');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Tile Grid Texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Cobblestone Pathways connecting centers
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      // Center crossroads
      ctx.moveTo(170, 130);
      ctx.lineTo(400, 210);
      ctx.lineTo(630, 130);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(170, 310);
      ctx.lineTo(400, 210);
      ctx.lineTo(400, 330);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(400, 95);
      ctx.lineTo(400, 210);
      ctx.stroke();

      // Crossroads Center Portal Dais
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.beginPath();
      ctx.arc(400, 210, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Render Landmarks
      landmarks.forEach((lm) => {
        const isHovered = activePrompt?.id === lm.id;
        const pulse = Math.sin(frame * 0.05) * 4;

        // Aura glow
        const aura = ctx.createRadialGradient(lm.x, lm.y, 10, lm.x, lm.y, lm.radius + pulse);
        aura.addColorStop(0, lm.color + (isHovered ? '44' : '22'));
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.radius + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Base Ring
        ctx.strokeStyle = isHovered ? lm.color : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.setLineDash(isHovered ? [6, 4] : []);
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, lm.radius - 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Landmark Pedestal
        ctx.fillStyle = '#11141E';
        ctx.beginPath();
        ctx.arc(lm.x, lm.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = lm.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Landmark Emoji/Icon
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lm.icon, lm.x, lm.y);

        // Landmark Label
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.fillStyle = isHovered ? '#FFF' : '#94A3B8';
        ctx.fillText(lm.name, lm.x, lm.y + 36);

        ctx.font = '9px Outfit, sans-serif';
        ctx.fillStyle = isHovered ? lm.color : '#64748B';
        ctx.fillText(lm.sub, lm.x, lm.y + 48);
      });

      // 4. Update and Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life++;
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        ctx.fillStyle = pt.color.replace('0.8', `${alpha}`).replace('0.4', `${alpha * 0.5}`);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * (1 - pt.life / pt.maxLife * 0.5), 0, Math.PI * 2);
        ctx.fill();

        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 5. Render Hero Character
      const bob = p.isMoving ? Math.sin(p.walkFrame * 2) * 3 : 0;
      const heroX = p.x;
      const heroY = p.y + bob;

      // Hero shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(heroX, p.y + 14, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hero Body (Paladin / Knight Cloak & Armor)
      // Cloak
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.arc(heroX, heroY + 2, 11, 0, Math.PI * 2);
      ctx.fill();

      // Gold Armor Plate
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(heroX, heroY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE68A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Helmet / Visor
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      if (p.facing === 'down') {
        ctx.arc(heroX, heroY - 2, 4, 0, Math.PI * 2);
      } else if (p.facing === 'up') {
        ctx.arc(heroX, heroY - 4, 3, 0, Math.PI * 2);
      } else if (p.facing === 'left') {
        ctx.arc(heroX - 2, heroY - 2, 4, 0, Math.PI * 2);
      } else {
        ctx.arc(heroX + 2, heroY - 2, 4, 0, Math.PI * 2);
      }
      ctx.fill();

      // Sword on Back / Side
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (p.facing === 'right') {
        ctx.moveTo(heroX + 8, heroY - 6);
        ctx.lineTo(heroX + 13, heroY + 4);
      } else if (p.facing === 'left') {
        ctx.moveTo(heroX - 8, heroY - 6);
        ctx.lineTo(heroX - 13, heroY + 4);
      } else {
        ctx.moveTo(heroX + 7, heroY - 7);
        ctx.lineTo(heroX + 11, heroY + 3);
      }
      ctx.stroke();

      // Floating Hero Level & Name Tag
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(`Lv.${character.level} ${user.username}`, heroX, heroY - 18);

      // 6. Vignette Outer Darkening
      const vignette = ctx.createRadialGradient(400, 210, 280, 400, 210, 420);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(7, 8, 12, 0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [user, character, activePrompt, chestOpened]);

  // Touch / Virtual D-Pad controls for mouse users
  const handleDPadPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    const p = playerRef.current;
    const step = 45;
    if (dir === 'up') p.targetY = Math.max(45, p.y - step);
    if (dir === 'down') p.targetY = Math.min(375, p.y + step);
    if (dir === 'left') p.targetX = Math.max(35, p.x - step);
    if (dir === 'right') p.targetX = Math.min(765, p.x + step);
  };

  return (
    <div className="world-map-container mb-6">
      {/* Map Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-500/20 text-xs">
        <div className="flex items-center gap-2">
          <Compass size={16} className="text-amber-400" />
          <span className="font-rpg font-bold tracking-wider text-amber-300 uppercase">
            Overworld: The Realm of Aethelgard
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300 font-bold">
            [W][A][S][D] / Arrows
          </span>
          <span>to Move</span>
          <span className="hidden sm:inline">| Click to Path</span>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair block"
          style={{ maxHeight: '420px', aspectRatio: '800 / 420' }}
        />

        {/* Training Grounds Damage Popup */}
        {trainingMessage && (
          <div className="absolute top-4 left-4 bg-purple-950/90 border border-purple-500/60 text-purple-200 text-xs px-3 py-1.5 rounded-lg font-bold shadow-lg animate-bounce">
            {trainingMessage}
          </div>
        )}

        {/* Active Landmark Interaction Prompt */}
        {activePrompt && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-amber-400 rounded-xl px-4 py-2.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
            <span className="text-xl">{activePrompt.icon}</span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5 font-rpg">
                {activePrompt.name}
              </p>
              <p className="text-[10px] text-amber-400 font-mono">
                {activePrompt.sub}
              </p>
            </div>
            <button
              onClick={handleInteract}
              className="rpg-btn rpg-btn-gold text-xs py-1.5 px-3 whitespace-nowrap ml-2 shadow-md"
            >
              <span>{activePrompt.actionText}</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono ml-1 font-bold">
                [E]
              </span>
            </button>
          </div>
        )}

        {/* On-Screen Virtual D-Pad for Mouse / Touch Users */}
        <div className="absolute bottom-3 right-3 flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => handleDPadPress('up')}
            className="w-7 h-7 rounded bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center transition active:scale-95"
            title="Move Up (W)"
          >
            ▲
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => handleDPadPress('left')}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center transition active:scale-95"
              title="Move Left (A)"
            >
              ◀
            </button>
            <button
              onClick={() => handleDPadPress('down')}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center transition active:scale-95"
              title="Move Down (S)"
            >
              ▼
            </button>
            <button
              onClick={() => handleDPadPress('right')}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center transition active:scale-95"
              title="Move Right (D)"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
