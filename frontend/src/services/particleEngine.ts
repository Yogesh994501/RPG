import confetti from 'canvas-confetti';

export function triggerLevelUpConfetti() {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;

  const defaults = { startVelocity: 30, spread: 360, ticks: 70, zIndex: 9999 };

  const colors = ['#F59E0B', '#FBBF24', '#8B5CF6', '#EF4444', '#10B981', '#F43F5E'];

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);

    // Blast from left
    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.2, y: 0.5 },
      colors
    });
    // Blast from right
    confetti({
      ...defaults,
      particleCount,
      origin: { x: 0.8, y: 0.5 },
      colors
    });
  }, 250);
}

export function triggerQuestCompleteSparks(x?: number, y?: number) {
  const originX = x !== undefined ? x / window.innerWidth : 0.5;
  const originY = y !== undefined ? y / window.innerHeight : 0.5;

  confetti({
    particleCount: 35,
    spread: 70,
    origin: { x: originX, y: originY },
    colors: ['#F59E0B', '#FDE68A', '#34D399', '#60A5FA'],
    ticks: 45,
    gravity: 1.2,
    scalar: 0.9,
    zIndex: 9999
  });
}

export function triggerCriticalHitParticles(x?: number, y?: number) {
  const originX = x !== undefined ? x / window.innerWidth : 0.7;
  const originY = y !== undefined ? y / window.innerHeight : 0.4;

  confetti({
    particleCount: 55,
    spread: 100,
    startVelocity: 35,
    origin: { x: originX, y: originY },
    colors: ['#EC4899', '#8B5CF6', '#3B82F6', '#F43F5E'],
    ticks: 50,
    gravity: 0.9,
    scalar: 1.1,
    zIndex: 9999
  });
}
