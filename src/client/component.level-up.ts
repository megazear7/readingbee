import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";

type Particle = {
  kind: "confetti" | "spark" | "hex";
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  w: number;
  h: number;
};

const COLORS = ["#e8b84a", "#f3d27a", "#f4ead5", "#f0c36a", "#7dce82", "#c45c3e", "#e8d6a3"];
const DURATION = 2800;

@customElement("reading-bee-level-up")
export class ReadingBeeLevelUp extends LitElement {
  static override styles = [
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: block;
        pointer-events: none;
      }

      .overlay {
        position: absolute;
        inset: 0;
      }

      canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .copy {
        position: absolute;
        left: 50%;
        top: 46%;
        transform: translate(-50%, -50%);
        text-align: center;
        pointer-events: auto;
        cursor: pointer;
        animation: popIn 720ms cubic-bezier(0.16, 1.2, 0.32, 1) both;
      }

      .kicker {
        margin: 0 0 0.35rem;
        font-size: 0.92rem;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: #f3d27a;
        font-weight: 700;
      }

      .level {
        margin: 0;
        font-size: clamp(3.2rem, 12vw, 5.6rem);
        line-height: 0.9;
        font-weight: 800;
        letter-spacing: -0.05em;
        color: #f4ead5;
        text-shadow:
          0 0 24px rgba(232, 184, 74, 0.45),
          0 8px 24px rgba(0, 0, 0, 0.45);
      }

      .hint {
        margin: 0.85rem 0 0;
        color: #8a8175;
        font-size: 0.92rem;
      }

      @keyframes popIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.55);
        }
        60% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.08);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .copy {
          animation: none;
        }
      }
    `,
  ];

  @property({ type: Number }) level = 1;
  @property({ type: Number }) originX = 0;
  @property({ type: Number }) originY = 0;
  @query("canvas") private canvas!: HTMLCanvasElement;

  private frame = 0;
  private started = 0;
  private particles: Particle[] = [];
  private reduced = false;
  private closing = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.started = performance.now();
    window.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    cancelAnimationFrame(this.frame);
    window.removeEventListener("keydown", this.onKey);
  }

  override firstUpdated(): void {
    this.resize();
    this.spawn();
    this.frame = requestAnimationFrame(this.tick);
    window.setTimeout(() => this.close(), this.reduced ? 1200 : DURATION);
  }

  override render(): TemplateResult {
    return html`
      <div class="overlay">
        <canvas aria-hidden="true"></canvas>
        <div class="copy" @click=${this.close}>
          <p class="kicker">Level up</p>
          <p class="level">${this.level}</p>
          <p class="hint">Tap to continue</p>
        </div>
      </div>
    `;
  }

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.close();
    }
  };

  private close = (): void => {
    if (this.closing) return;
    this.closing = true;
    this.dispatchEvent(new Event("done"));
  };

  private resize(): void {
    const canvas = this.canvas;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private spawn(): void {
    if (this.reduced) return;
    const ox = this.originX || window.innerWidth - 40;
    const oy = this.originY || 48;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.46;
    const count = 92;
    for (let i = 0; i < count; i += 1) {
      const fromBadge = i < 36;
      const x = fromBadge ? ox : cx;
      const y = fromBadge ? oy : cy;
      const angle = Math.random() * Math.PI * 2;
      const speed = fromBadge ? 2.2 + Math.random() * 6.4 : 1.2 + Math.random() * 4.2;
      const kind: Particle["kind"] = i % 7 === 0 ? "hex" : i % 3 === 0 ? "spark" : "confetti";
      this.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (fromBadge ? 2.8 : 1.4),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.28,
        life: 0,
        maxLife: 1400 + Math.random() * 1200,
        size: kind === "spark" ? 2 + Math.random() * 2.4 : 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        w: 5 + Math.random() * 8,
        h: 8 + Math.random() * 12,
      });
    }
  }

  private tick = (now: number): void => {
    const canvas = this.canvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const elapsed = now - this.started;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = `rgba(12, 11, 9, ${Math.min(0.42, elapsed / 280)})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const ringT = Math.min(1, elapsed / 900);
    const ox = this.originX || window.innerWidth - 40;
    const oy = this.originY || 48;
    ctx.beginPath();
    ctx.arc(ox, oy, 18 + ringT * 90, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(232, 184, 74, ${0.55 * (1 - ringT)})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    const dt = 16;
    for (const particle of this.particles) {
      particle.life += dt;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.08;
      particle.vx *= 0.992;
      particle.rot += particle.vr;
      const alpha = Math.max(0, 1 - particle.life / particle.maxLife);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      if (particle.kind === "hex") {
        this.drawHex(ctx, particle.size);
      } else if (particle.kind === "spark") {
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h);
      }
      ctx.restore();
    }

    if (!this.closing) {
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  private drawHex(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-level-up": ReadingBeeLevelUp;
  }
}
