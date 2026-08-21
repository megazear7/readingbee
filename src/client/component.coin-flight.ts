import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";

type Coin = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  vs: number;
  r: number;
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
  @query("canvas") private canvas!: HTMLCanvasElement;
  private frame = 0;
  private coin: Coin | null = null;
  private sparkles: Sparkle[] = [];
  private last = 0;
  private finished = false;

  override firstUpdated(): void {
    this.spawn();
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has("originX") || changed.has("originY")) {
      if (!this.coin && !this.finished) this.spawn();
    }
  }

  override render(): TemplateResult {
    return html`
      <canvas></canvas>
    `;
  }

  private spawn(): void {
    this.coin = {
      x: this.originX,
      y: this.originY,
      vx: (this.targetX - this.originX) * 1.15 + (Math.random() - 0.5) * 90,
      vy: (this.targetY - this.originY) * 1.35 - 80 - Math.random() * 60,
      spin: Math.random() * Math.PI * 2,
      vs: (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8),
      r: 15 + Math.random() * 4,
    };
    this.burst(this.originX, this.originY, 18);
  }

  private burst(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 90 + Math.random() * 220;
      this.sparkles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.16,
        r: 1.6 + Math.random() * 2.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 14,
      });
    }
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.032, (now - this.last) / 1000);
    this.last = now;
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

    const coin = this.coin;
    if (coin) {
      const dx = this.targetX - coin.x;
      const dy = this.targetY - coin.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = 4200 + dist * 6;
      coin.vx += (dx / dist) * pull * dt;
      coin.vy += (dy / dist) * pull * dt;
      coin.vx *= 0.84;
      coin.vy *= 0.84;
      coin.x += coin.vx * dt;
      coin.y += coin.vy * dt;
      coin.spin += coin.vs * dt;
      coin.r = Math.max(7, coin.r - 18 * dt);
      if (dist < 18) {
        this.burst(this.targetX, this.targetY, 20);
        this.coin = null;
      } else {
        this.drawCoin(ctx, coin);
      }
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

    if (!this.coin && this.sparkles.length === 0) {
      if (!this.finished) {
        this.finished = true;
        this.dispatchEvent(new Event("done"));
      }
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  private drawSparkle(ctx: CanvasRenderingContext2D, sparkle: Sparkle): void {
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

  private drawCoin(ctx: CanvasRenderingContext2D, coin: Coin): void {
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.rotate(coin.spin * 0.15);
    const squash = 0.55 + Math.abs(Math.cos(coin.spin)) * 0.45;
    ctx.scale(squash, 1);
    const g = ctx.createRadialGradient(-coin.r * 0.3, -coin.r * 0.35, 2, 0, 0, coin.r);
    g.addColorStop(0, "#fff6c8");
    g.addColorStop(0.35, "#f3d27a");
    g.addColorStop(0.72, "#e8b84a");
    g.addColorStop(1, "#9a6c1e");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 244, 196, 0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(154, 108, 30, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, coin.r * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 246, 200, 0.7)";
    ctx.beginPath();
    ctx.arc(-coin.r * 0.28, -coin.r * 0.3, coin.r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-coin-flight": ReadingBeeCoinFlight;
  }
}
