import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";

type Flyer = {
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  ctrlOffX: number;
  pop: number;
  spin: number;
  vs: number;
  r: number;
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

const COIN_START = 0.3;
const COIN_SOUNDS = [
  "/sounds/Coin01.mp3",
  "/sounds/Coin02.mp3",
  "/sounds/Coin03.mp3",
  "/sounds/Coin04.mp3",
  "/sounds/Coin05.mp3",
];
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const quad = (start: number, control: number, end: number, t: number): number => {
  const rest = 1 - t;
  return rest * rest * start + 2 * rest * t * control + t * t * end;
};

export const SHOP_FRONT_IMAGE = "/shop-front.webp";
export const MAX_SPEND_COINS = 16;

@customElement("reading-bee-coin-spend")
export class ReadingBeeCoinSpend extends LitElement {
  static override styles = [
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: block;
        pointer-events: none;
      }

      canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        z-index: 2;
      }

      .shop {
        position: fixed;
        left: 50%;
        bottom: 0;
        z-index: 1;
        width: min(94vw, 520px);
        max-height: 44vh;
        object-fit: contain;
        transform: translate(-50%, 115%);
        filter: drop-shadow(0 -10px 28px rgba(0, 0, 0, 0.5));
        transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .shop.is-in {
        transform: translate(-50%, 4%);
      }

      .shop.is-out {
        transform: translate(-50%, 115%);
        transition-duration: 420ms;
      }

      @media (prefers-reduced-motion: reduce) {
        .shop,
        .shop.is-in,
        .shop.is-out {
          transition: none;
        }
      }
    `,
  ];

  @property({ type: Number }) originX = 0;
  @property({ type: Number }) originY = 0;
  @property({ type: Number }) count = 1;
  @query("canvas") private canvas!: HTMLCanvasElement;
  @query(".shop") private shopEl!: HTMLImageElement;
  @state() private shopIn = false;
  @state() private shopOut = false;
  private flyers: Flyer[] = [];
  private sparkles: Sparkle[] = [];
  private rings: Ring[] = [];
  private frame = 0;
  private last = 0;
  private started = 0;
  private finished = false;

  override firstUpdated(): void {
    this.spawn();
    requestAnimationFrame(() => {
      this.shopIn = true;
    });
    this.last = performance.now();
    this.started = this.last;
    this.frame = requestAnimationFrame(this.tick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
  }

  override render(): TemplateResult {
    const shopClass = `shop ${this.shopIn && !this.shopOut ? "is-in" : ""} ${this.shopOut ? "is-out" : ""}`;
    return html`
      <img class=${shopClass} src=${SHOP_FRONT_IMAGE} alt="" />
      <canvas></canvas>
    `;
  }

  private visualCount(): number {
    return Math.max(1, Math.min(MAX_SPEND_COINS, Math.round(this.count)));
  }

  private spawn(): void {
    const n = this.visualCount();
    const stagger = n > 10 ? 0.045 : 0.07;
    this.flyers = Array.from({ length: n }, (_, index) => ({
      delay: COIN_START + index * stagger,
      duration: 0.95 + Math.random() * 0.18,
      startX: this.originX + (Math.random() - 0.5) * 14,
      startY: this.originY + (Math.random() - 0.5) * 8,
      dx: (Math.random() - 0.5) * 42,
      dy: (Math.random() - 0.5) * 22,
      ctrlOffX: (Math.random() - 0.5) * 90,
      pop: 48 + Math.random() * 70,
      spin: Math.random() * Math.PI * 2,
      vs: (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8),
      r: 13 + Math.random() * 4,
      launched: false,
      arrived: false,
    }));
  }

  private door(): { x: number; y: number } {
    const shop = this.shopEl;
    if (!(shop instanceof HTMLImageElement)) {
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.78 };
    }
    const rect = shop.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.58,
    };
  }

  private burst(x: number, y: number, count: number, maxLife: number, speed = 160): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const go = speed * (0.55 + Math.random() * 0.7);
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * go,
        vy: Math.sin(angle) * go,
        life: 0,
        maxLife: maxLife * (0.7 + Math.random() * 0.3),
        r: 1.5 + Math.random() * 2.1,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
      });
    }
  }

  private finishBurst(x: number, y: number): void {
    this.rings.push({ x, y, life: 0, maxLife: 0.38, maxR: 48 });
    this.rings.push({ x, y, life: 0, maxLife: 0.2, maxR: 24 });
    for (let i = 0; i < 28; i += 1) {
      const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.28;
      const big = i % 5 === 0;
      const speed = big ? 160 + Math.random() * 220 : 100 + Math.random() * 240;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0,
        maxLife: (big ? 0.38 : 0.3) * (0.78 + Math.random() * 0.22),
        r: big ? 3.1 + Math.random() * 2 : 1.7 + Math.random() * 2,
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

    const door = this.door();
    for (const flyer of this.flyers) {
      if (elapsed < flyer.delay) {
        continue;
      }
      if (!flyer.launched) {
        flyer.launched = true;
        this.burst(flyer.startX, flyer.startY, 7, 0.22, 120);
        this.playCoinSound();
        this.dispatchEvent(new CustomEvent("coin-left", { bubbles: true, composed: true }));
      }
      if (flyer.arrived) {
        continue;
      }
      const local = (elapsed - flyer.delay) / flyer.duration;
      if (local >= 1) {
        flyer.arrived = true;
        this.finishBurst(door.x + flyer.dx, door.y + flyer.dy);
        continue;
      }
      const u = easeInOut(Math.min(1, local));
      const endX = door.x + flyer.dx;
      const endY = door.y + flyer.dy;
      const ctrlX = (flyer.startX + endX) / 2 + flyer.ctrlOffX;
      const ctrlY = flyer.startY - flyer.pop;
      const x = quad(flyer.startX, ctrlX, endX, u);
      const y = quad(flyer.startY, ctrlY, endY, u);
      flyer.spin += flyer.vs * dt;
      this.drawCoin(ctx, x, y, flyer.r * (1 - u * 0.22), flyer.spin);
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
      sparkle.vy += 260 * dt;
      sparkle.vx *= 0.9;
      sparkle.rot += sparkle.vr * dt;
      this.drawSparkle(ctx, sparkle);
    }

    const allArrived = this.flyers.every((flyer) => flyer.arrived);
    const fxDone = this.sparkles.length === 0 && this.rings.length === 0;
    if (allArrived && fxDone && elapsed > COIN_START + 0.2 && !this.shopOut) {
      this.shopOut = true;
      window.setTimeout(() => this.complete(), 440);
    }

    if (this.finished) {
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private playCoinSound(): void {
    const src = COIN_SOUNDS[Math.floor(Math.random() * COIN_SOUNDS.length)];
    const audio = new Audio(src);
    audio.volume = 0.45;
    void audio.play().catch(() => undefined);
  }

  private complete(): void {
    if (this.finished) return;
    this.finished = true;
    cancelAnimationFrame(this.frame);
    this.dispatchEvent(new Event("done"));
  }

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
    "reading-bee-coin-spend": ReadingBeeCoinSpend;
  }
}
