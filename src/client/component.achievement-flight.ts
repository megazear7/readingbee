import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { achievementById } from "../shared/achievements.js";
import "./component.medal.js";

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

const HOLD = 0.55;
const FLY = 1.15;
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const quad = (start: number, control: number, end: number, t: number): number => {
  const rest = 1 - t;
  return rest * rest * start + 2 * rest * t * control + t * t * end;
};

@customElement("reading-bee-achievement-flight")
export class ReadingBeeAchievementFlight extends LitElement {
  static override styles = [
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 42;
        display: block;
        pointer-events: none;
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .flyer {
        position: fixed;
        width: 88px;
        height: 99px;
        margin: -49px 0 0 -44px;
        z-index: 1;
        transform-origin: 50% 50%;
      }

      reading-bee-medal {
        width: 100%;
        height: 100%;
      }
    `,
  ];

  @property({ type: String }) achievementId = "";
  @property({ type: Number }) originX = 0;
  @property({ type: Number }) originY = 0;
  @property({ type: Number }) targetX = 0;
  @property({ type: Number }) targetY = 0;
  @query("canvas") private canvas!: HTMLCanvasElement;
  @query(".flyer") private flyerEl!: HTMLDivElement;
  private frame = 0;
  private sparkles: Sparkle[] = [];
  private rings: Ring[] = [];
  private last = 0;
  private started = 0;
  private finished = false;
  private popped = false;

  override firstUpdated(): void {
    this.last = performance.now();
    this.started = this.last;
    this.burst(this.originX, this.originY, 28, 0.38);
    this.frame = requestAnimationFrame(this.tick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
  }

  override render(): TemplateResult {
    const achievement = achievementById(this.achievementId);
    return html`
      <canvas></canvas>
      <div class="flyer">
        <reading-bee-medal .value=${achievement?.number ?? 1}></reading-bee-medal>
      </div>
    `;
  }

  private burst(x: number, y: number, count: number, maxLife: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 240;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0,
        maxLife: maxLife * (0.7 + Math.random() * 0.3),
        r: 1.7 + Math.random() * 2.4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 16,
      });
    }
  }

  private finishBurst(x: number, y: number): void {
    this.rings.push({ x, y, life: 0, maxLife: 0.42, maxR: 58 });
    this.rings.push({ x, y, life: 0, maxLife: 0.22, maxR: 28 });
    this.burst(x, y, 36, 0.4);
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.032, (now - this.last) / 1000);
    this.last = now;
    const elapsed = (now - this.started) / 1000;
    const canvas = this.canvas;
    const flyer = this.flyerEl;
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

    let x = this.originX;
    let y = this.originY;
    let scale = 1;
    if (elapsed < HOLD) {
      const pop = easeInOut(Math.min(1, elapsed / 0.28));
      scale = 0.55 + pop * 0.55;
    } else {
      const u = easeInOut(Math.min(1, (elapsed - HOLD) / FLY));
      const ctrlX = (this.originX + this.targetX) / 2 + (this.originX - this.targetX) * 0.08;
      const ctrlY = Math.min(this.originY, this.targetY) - 70;
      x = quad(this.originX, ctrlX, this.targetX, u);
      y = quad(this.originY, ctrlY, this.targetY, u);
      scale = 1.1 - u * 0.62;
      if (u >= 1 && !this.popped) {
        this.popped = true;
        this.finishBurst(this.targetX, this.targetY);
      }
    }
    if (flyer) {
      flyer.style.left = `${x}px`;
      flyer.style.top = `${y}px`;
      flyer.style.transform = `scale(${scale})`;
      flyer.style.opacity = elapsed < HOLD + FLY + 0.18 ? "1" : "0";
    }

    this.rings = this.rings.filter((ring) => ring.life < ring.maxLife);
    for (const ring of this.rings) {
      ring.life += dt;
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
      ctx.restore();
    }

    this.sparkles = this.sparkles.filter((sparkle) => sparkle.life < sparkle.maxLife);
    for (const sparkle of this.sparkles) {
      sparkle.life += dt;
      sparkle.x += sparkle.vx * dt;
      sparkle.y += sparkle.vy * dt;
      sparkle.vy += 260 * dt;
      sparkle.vx *= 0.9;
      sparkle.rot += sparkle.vr * dt;
      const t = sparkle.life / sparkle.maxLife;
      const alpha = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      const r = sparkle.r * (1 - t * 0.35);
      ctx.save();
      ctx.translate(sparkle.x, sparkle.y);
      ctx.rotate(sparkle.rot);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = "#fff6c8";
      ctx.beginPath();
      ctx.moveTo(0, -r * 2.1);
      ctx.lineTo(r * 0.45, 0);
      ctx.lineTo(0, r * 2.1);
      ctx.lineTo(-r * 0.45, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (elapsed >= HOLD + FLY + 0.42) {
      if (!this.finished) {
        this.finished = true;
        this.dispatchEvent(new Event("done"));
      }
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-achievement-flight": ReadingBeeAchievementFlight;
  }
}
