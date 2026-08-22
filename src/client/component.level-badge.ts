import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { globalStyles } from "./styles.global.js";
import "./component.medal.js";

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

      reading-bee-medal {
        width: 100%;
        height: 100%;
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
          <div class="face front">
            <reading-bee-medal .value=${this.front}></reading-bee-medal>
          </div>
          <div class="face back">
            <reading-bee-medal .value=${this.back}></reading-bee-medal>
          </div>
        </div>
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
