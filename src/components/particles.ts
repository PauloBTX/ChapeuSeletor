/**
 * High-performance lightweight Canvas Particle System
 * Creates floating golden embers, magical stardust, and ethereal mist
 */
export class MagicParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;
  private width = 0;
  private height = 0;
  private intensity = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles(45);
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  private initParticles(count: number) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.width, this.height));
    }
  }

  public setIntensity(val: number) {
    this.intensity = val;
  }

  public start() {
    if (this.animationFrameId !== null) return;
    const render = () => {
      this.ctx.clearRect(0, 0, this.width, this.height);
      for (const p of this.particles) {
        p.update(this.width, this.height, this.intensity);
        p.draw(this.ctx);
      }
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

class Particle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  size: number = 2;
  alpha: number = 0.5;
  color: string = '#d4af37';
  pulseSpeed: number = 0.02;
  pulseOffset: number = 0;

  constructor(w: number, h: number) {
    this.reset(w, h, true);
  }

  reset(w: number, h: number, randomY = false) {
    this.x = Math.random() * w;
    this.y = randomY ? Math.random() * h : h + 10;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.7 + 0.3);
    this.size = Math.random() * 2.8 + 1;
    this.alpha = Math.random() * 0.6 + 0.2;
    this.pulseOffset = Math.random() * Math.PI * 2;

    const colors = [
      'rgba(245, 218, 126,', // Warm gold
      'rgba(255, 185, 80,',  // Amber
      'rgba(180, 140, 255,', // Mystical violet
      'rgba(212, 175, 55,'   // Hogwarts gold
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(w: number, h: number, intensity: number) {
    this.x += this.vx * intensity;
    this.y += this.vy * intensity;
    this.pulseOffset += 0.03;

    if (this.y < -20 || this.x < -20 || this.x > w + 20) {
      this.reset(w, h);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const currentAlpha = Math.max(0.1, Math.min(0.9, this.alpha + Math.sin(this.pulseOffset) * 0.25));
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `${this.color} ${currentAlpha})`;
    ctx.shadowBlur = this.size * 3;
    ctx.shadowColor = 'rgba(235, 195, 85, 0.7)';
    ctx.fill();
    ctx.restore();
  }
}
