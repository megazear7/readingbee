import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

let medalSeq = 0;

@customElement("reading-bee-medal")
export class ReadingBeeMedal extends LitElement {
  static override styles = [
    css`
      :host {
        display: block;
        width: 64px;
        height: 72px;
        flex: 0 0 auto;
      }

      .medal {
        position: relative;
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));
      }

      :host([grayscale]) .medal {
        filter: grayscale(1) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
        opacity: 0.55;
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
        top: 22%;
        bottom: 6%;
        display: grid;
        place-items: center;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: #f4ead5;
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
        line-height: 1;
        font-family: var(--font-family, Nunito, sans-serif);
      }

      .num[data-digits="1"] {
        font-size: 1.28em;
      }

      .num[data-digits="2"] {
        font-size: 1.08em;
      }

      .num[data-digits="3"] {
        font-size: 0.86em;
      }
    `,
  ];

  @property({ type: Number }) value = 1;
  @property({ type: Boolean, reflect: true }) grayscale = false;
  private readonly goldId = `medal-gold-${(medalSeq += 1)}`;

  override render(): TemplateResult {
    const digits = String(this.value).length;
    return html`
      <div class="medal">
        <svg viewBox="0 0 64 72" aria-hidden="true">
          <defs>
            <linearGradient id=${this.goldId} x1="12" y1="8" x2="52" y2="68" gradientUnits="userSpaceOnUse">
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
            stroke=${`url(#${this.goldId})`}
            stroke-width="3.2"
            stroke-linejoin="round"></polygon>
          <polygon
            points="32,22 49,32 49,50 32,60 15,50 15,32"
            fill="#241c0e"
            stroke="#e8b84a"
            stroke-width="1.1"
            opacity="0.95"></polygon>
        </svg>
        <span class="num" data-digits=${digits}>${this.value}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-medal": ReadingBeeMedal;
  }
}
