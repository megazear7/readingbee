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
  bounce: number;
  maxBounce: number;
  seeking: boolean;
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
  private last = 0;

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
      if (!this.coin) this.spawn();
    }
  }

  override render(): TemplateResult {
    return html`
      <canvas></canvas>
    `;
  }

  private spawn(): void {
    const bounce = 1 + Math.floor(Math.random() * 3);
    this.coin = {
      x: this.originX,
      y: this.originY,
      vx: (Math.random() - 0.5) * 420,
      vy: -620 - Math.random() * 380,
      spin: Math.random() * Math.PI * 2,
      vs: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 10),
      r: 16 + Math.random() * 6,
      bounce: 0,
      maxBounce: bounce,
      seeking: false,
    };
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.032, (now - this.last) / 1000);
    this.last = now;
    const canvas = this.canvas;
    if (!canvas || !this.coin) return;
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
    const floor = height - 28 - coin.r;
    if (!coin.seeking) {
      coin.vy += 1680 * dt;
      coin.x += coin.vx * dt;
      coin.y += coin.vy * dt;
      coin.spin += coin.vs * dt;
      if (coin.x < coin.r) {
        coin.x = coin.r;
        coin.vx = Math.abs(coin.vx) * 0.78;
      }
      if (coin.x > width - coin.r) {
        coin.x = width - coin.r;
        coin.vx = -Math.abs(coin.vx) * 0.78;
      }
      if (coin.y >= floor && coin.vy > 0) {
        coin.y = floor;
        coin.vy *= -0.58 - Math.random() * 0.16;
        coin.vx *= 0.82;
        coin.bounce += 1;
        if (coin.bounce >= coin.maxBounce) {
          coin.seeking = true;
        }
      }
    } else {
      const dx = this.targetX - coin.x;
      const dy = this.targetY - coin.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = 980 + dist * 3.4;
      coin.vx += (dx / dist) * pull * dt;
      coin.vy += (dy / dist) * pull * dt;
      coin.vx *= 0.9;
      coin.vy *= 0.9;
      coin.x += coin.vx * dt;
      coin.y += coin.vy * dt;
      coin.spin += coin.vs * dt;
      coin.r = Math.max(8, coin.r - 10 * dt);
      if (dist < 22) {
        this.dispatchEvent(new Event("done"));
        return;
      }
    }

    this.drawCoin(ctx, coin);
    this.frame = requestAnimationFrame(this.tick);
  };

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
