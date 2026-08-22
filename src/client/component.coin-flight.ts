import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { playCoinSound } from "./coin-sounds.js";

type Flyer = {
  delay: number;
  duration: number;
  originX: number;
  originY: number;
  controlX: number;
  controlY: number;
  targetX: number;
  targetY: number;
  spin: number;
  vs: number;
  startR: number;
  launched: boolean;
  arrived: boolean;
};

type Sparkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  rot: number;
  vr: number;
};

type Ring = {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxR: number;
};

const DURATION = 2;
const ARRIVE_AT = 1.55;

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const quad = (start: number, control: number, end: number, t: number): number => {
  const rest = 1 - t;
  return rest * rest * start + 2 * rest * t * control + t * t * end;
};

@customElement("reading-bee-coin-flight")
export class ReadingBeeCoinFlight extends LitElement {
  static override styles = [
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 18;
        display: block;
        pointer-events: none;
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `,
  ];

  @property({ type: Number }) originX = 0;
  @property({ type: Number }) originY = 0;
  @property({ type: Number }) targetX = 0;
  @property({ type: Number }) targetY = 0;
  @property({ type: Number }) count = 1;
  @query("canvas") private canvas!: HTMLCanvasElement;
  private frame = 0;
  private flyers: Flyer[] = [];
  private sparkles: Sparkle[] = [];
  private rings: Ring[] = [];
  private last = 0;
  private started = 0;
  private finished = false;

  override firstUpdated(): void {
    this.spawn();
    this.last = performance.now();
    this.started = this.last;
    this.frame = requestAnimationFrame(this.tick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if ((changed.has("originX") || changed.has("originY")) && this.flyers.length === 0 && !this.finished) {
      this.spawn();
    }
  }

  override render(): TemplateResult {
    return html`
      <canvas></canvas>
    `;
  }

  private spawn(): void {
    const n = Math.max(1, Math.round(this.count));
    const stagger = n > 1 ? 0.32 : 0;
    this.flyers = Array.from({ length: n }, (_, index) => {
      const originX = this.originX + (Math.random() - 0.5) * 36;
      const originY = this.originY + (Math.random() - 0.5) * 22;
      const targetX = this.targetX + (Math.random() - 0.5) * 14;
      const targetY = this.targetY + (Math.random() - 0.5) * 10;
      return {
        delay: index * stagger + (n > 1 ? Math.random() * 0.08 : 0),
        duration: ARRIVE_AT + (n > 1 ? (Math.random() - 0.5) * 0.22 : 0),
        originX,
        originY,
        targetX,
        targetY,
        controlX: (originX + targetX) / 2 + (Math.random() - 0.5) * 180,
        controlY: Math.min(originY, targetY) - 50 - Math.random() * 70,
        spin: Math.random() * Math.PI * 2,
        vs: (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8),
        startR: 15 + Math.random() * 4,
        launched: false,
        arrived: false,
      };
    });
  }

  private burst(x: number, y: number, count: number, maxLife: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 220;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: maxLife * (0.7 + Math.random() * 0.3),
        r: 1.6 + Math.random() * 2.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
      });
    }
  }

  private finishBurst(x: number, y: number): void {
    this.rings.push({ x, y, life: 0, maxLife: 0.4, maxR: 56 });
    this.rings.push({ x, y, life: 0, maxLife: 0.22, maxR: 28 });
    for (let i = 0; i < 36; i += 1) {
      const angle = (Math.PI * 2 * i) / 36 + Math.random() * 0.28;
      const big = i % 5 === 0;
      const speed = big ? 180 + Math.random() * 260 : 120 + Math.random() * 280;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0,
        maxLife: (big ? 0.4 : 0.32) * (0.78 + Math.random() * 0.22),
        r: big ? 3.4 + Math.random() * 2.2 : 1.8 + Math.random() * 2.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 18,
      });
    }
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.032, (now - this.last) / 1000);
    this.last = now;
    const elapsed = (now - this.started) / 1000;
    const canvas = this.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    for (const flyer of this.flyers) {
      if (elapsed < flyer.delay) {
        continue;
      }
      if (!flyer.launched) {
        flyer.launched = true;
        this.burst(flyer.originX, flyer.originY, 18, 0.28);
      }
      if (flyer.arrived) {
        continue;
      }
      const local = elapsed - flyer.delay;
      if (local >= flyer.duration) {
        flyer.arrived = true;
        this.finishBurst(flyer.targetX, flyer.targetY);
        playCoinSound();
        this.dispatchEvent(new CustomEvent("coin-landed", { bubbles: true, composed: true }));
        continue;
      }
      const u = easeInOut(Math.min(1, local / flyer.duration));
      const x = quad(flyer.originX, flyer.controlX, flyer.targetX, u);
      const y = quad(flyer.originY, flyer.controlY, flyer.targetY, u);
      flyer.spin += flyer.vs * dt;
      this.drawCoin(ctx, x, y, flyer.startR * (1 - u * 0.48), flyer.spin);
    }

    this.rings = this.rings.filter((ring) => ring.life < ring.maxLife);
    for (const ring of this.rings) {
      ring.life += dt;
      this.drawRing(ctx, ring);
    }

    this.sparkles = this.sparkles.filter((sparkle) => sparkle.life < sparkle.maxLife);
    for (const sparkle of this.sparkles) {
      sparkle.life += dt;
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.vy += 280 * dt;
      sparkle.vx *= 0.9;
      sparkle.rot += sparkle.vr * dt;
      this.drawSparkle(ctx, sparkle);
    }

    const lastLand = this.flyers.reduce((max, flyer) => Math.max(max, flyer.delay + flyer.duration), ARRIVE_AT);
    const doneAt = lastLand + (DURATION - ARRIVE_AT);
    if (elapsed >= doneAt) {
      if (!this.finished) {
        this.finished = true;
        this.dispatchEvent(new Event("done"));
      }
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  private drawRing(ctx: CanvasRenderingContext2D, ring: Ring): void {
    const t = ring.life / ring.maxLife;
    const alpha = Math.max(0, 1 - t);
    const radius = 6 + t * ring.maxR;
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = "#fff6c8";
    ctx.lineWidth = 3.2 * (1 - t * 0.55);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(232, 184, 74, 0.85)";
    ctx.lineWidth = 1.6 * (1 - t);
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    const glow = ctx.createRadialGradient(ring.x, ring.y, 2, ring.x, ring.y, radius * 0.55);
    glow.addColorStop(0, `rgba(255, 246, 200, ${0.55 * alpha})`);
    glow.addColorStop(1, "rgba(232, 184, 74, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, sparkle: Sparkle): void {
    const t = sparkle.life / sparkle.maxLife;
    const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
    const r = sparkle.r * (1 - t * 0.35);
    ctx.save();
    ctx.translate(sparkle.x, sparkle.y);
    ctx.rotate(sparkle.rot);
    ctx.globalAlpha = Math.max(0, alpha);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
    glow.addColorStop(0, "rgba(255, 246, 200, 0.85)");
    glow.addColorStop(1, "rgba(232, 184, 74, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6c8";
    ctx.beginPath();
    ctx.moveTo(0, -r * 2.1);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(0, r * 2.1);
    ctx.lineTo(-r * 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = "#f3d27a";
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.5);
    ctx.lineTo(r * 0.38, 0);
    ctx.lineTo(0, r * 1.5);
    ctx.lineTo(-r * 0.38, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin * 0.15);
    const squash = 0.55 + Math.abs(Math.cos(spin)) * 0.45;
    ctx.scale(squash, 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 2, 0, 0, r);
    g.addColorStop(0, "#fff6c8");
    g.addColorStop(0.35, "#f3d27a");
    g.addColorStop(0.72, "#e8b84a");
    g.addColorStop(1, "#9a6c1e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 244, 196, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(154, 108, 30, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 246, 200, 0.7)";
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-coin-flight": ReadingBeeCoinFlight;
  }
}
