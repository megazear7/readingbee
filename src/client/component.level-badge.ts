import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";

@customElement("reading-bee-level-badge")
export class ReadingBeeLevelBadge extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        width: 52px;
        height: 58px;
        flex: 0 0 auto;
      }

      .scene {
        width: 52px;
        height: 58px;
        perspective: 420px;
      }

      .card {
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transition: transform 720ms cubic-bezier(0.22, 0.9, 0.28, 1);
      }

      .card.flipping {
        transform: rotateY(180deg);
      }

      .card.snap {
        transition: none;
      }

      .face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      .back {
        transform: rotateY(180deg);
      }

      .medal {
        position: relative;
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
      }

      svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .num {
        position: absolute;
        left: 0;
        right: 0;
        top: 16px;
        bottom: 4px;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #f4ead5;
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
        line-height: 1;
      }

      .num[data-digits="1"] {
        font-size: 1.28rem;
      }

      .num[data-digits="2"] {
        font-size: 1.08rem;
      }

      .num[data-digits="3"] {
        font-size: 0.86rem;
      }
    `,
  ];

  @property({ type: Number }) level = 1;
  @state() private front = 1;
  @state() private back = 1;
  @state() private flipping = false;
  @state() private snap = false;
  private seeded = false;

  override willUpdate(changed: PropertyValues<this>): void {
    if (!changed.has("level")) return;
    if (!this.seeded) {
      this.front = this.level;
      this.back = this.level;
      this.seeded = true;
      return;
    }
    if (this.level === this.front) return;
    this.back = this.level;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.front = this.level;
      this.flipping = false;
      return;
    }
    this.flipping = true;
  }

  override render(): TemplateResult {
    return html`
      <div class="scene">
        <div
          class="card ${this.flipping ? "flipping" : ""} ${this.snap ? "snap" : ""}"
          @transitionend=${this.onFlipEnd}>
          <div class="face front">${this.medal(this.front, "front")}</div>
          <div class="face back">${this.medal(this.back, "back")}</div>
        </div>
      </div>
    `;
  }

  private medal(level: number, side: string): TemplateResult {
    const goldId = `gold-${side}`;
    const digits = String(level).length;
    return html`
      <div class="medal" aria-label=${`Level ${level}`}>
        <svg viewBox="0 0 64 72" aria-hidden="true">
          <defs>
            <linearGradient id=${goldId} x1="12" y1="8" x2="52" y2="68" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#f8e2a0"></stop>
              <stop offset="0.45" stop-color="#e8b84a"></stop>
              <stop offset="1" stop-color="#b8862a"></stop>
            </linearGradient>
          </defs>
          <path d="M24 3h16l-3.2 13H27.2Z" fill="#c45c3e"></path>
          <path d="M24 3l5.5 13" stroke="#9a3f2c" stroke-width="1.4" fill="none"></path>
          <path d="M40 3l-5.5 13" stroke="#e08a72" stroke-width="1.2" fill="none"></path>
          <polygon
            points="32,16 55,29 55,53 32,66 9,53 9,29"
            fill="#1a1408"
            stroke=${`url(#${goldId})`}
            stroke-width="3.2"
            stroke-linejoin="round"></polygon>
          <polygon
            points="32,22 49,32 49,50 32,60 15,50 15,32"
            fill="#241c0e"
            stroke="#e8b84a"
            stroke-width="1.1"
            opacity="0.95"></polygon>
        </svg>
        <span class="num" data-digits=${digits}>${level}</span>
      </div>
    `;
  }

  private onFlipEnd = (event: TransitionEvent): void => {
    if (event.propertyName !== "transform" || !this.flipping) return;
    this.snap = true;
    this.flipping = false;
    this.front = this.back;
    requestAnimationFrame(() => {
      this.snap = false;
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-level-badge": ReadingBeeLevelBadge;
  }
}
