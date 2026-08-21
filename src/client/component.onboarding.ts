import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ReadingBand } from "../shared/type.app.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";

const BANDS: { id: ReadingBand; label: string; detail: string }[] = [
  { id: "words", label: "I read words", detail: "Cat, sun, jump" },
  { id: "phrases", label: "I read phrases", detail: "The red hat" },
  { id: "sentences", label: "I read sentences", detail: "The cat sat on the mat." },
  { id: "books", label: "I read books", detail: "Short stories and pages" },
];

@customElement("reading-bee-onboarding")
export class ReadingBeeOnboarding extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .screen {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: calc(1.5rem + env(safe-area-inset-top)) 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
      }

      .card {
        width: min(560px, 100%);
        display: grid;
        gap: 1.2rem;
      }

      .brand {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 0.6rem;
      }

      img {
        width: 88px;
        height: 88px;
        border-radius: 22px;
        box-shadow: var(--shadow-normal);
      }

      .lede {
        font-size: 1.02rem;
        max-width: 28ch;
      }

      label {
        display: grid;
        gap: 0.45rem;
        font-size: 0.92rem;
        color: var(--color-primary-text-muted);
      }

      .bands {
        display: grid;
        gap: 0.7rem;
      }

      .band {
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        padding: 1rem 1.1rem;
        border-radius: 18px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        display: grid;
        gap: 0.15rem;
      }

      .band[active] {
        border-color: var(--color-1);
        box-shadow: 0 0 0 3px rgba(232, 184, 74, 0.16);
      }

      .band strong {
        font-size: 1.05rem;
      }

      .band span {
        color: var(--color-primary-text-muted);
        font-size: 0.92rem;
      }

      .primary-btn {
        width: 100%;
        margin-top: 0.3rem;
      }

      .primary-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }
    `,
  ];

  @state() private name = "";
  @state() private band: ReadingBand | null = null;

  override render(): TemplateResult {
    const canStart = this.name.trim().length > 0 && this.band !== null;
    return html`
      <div class="screen">
        <div class="card">
          <div class="brand">
            <img src="/logo/logo-256x256.png" alt="Reading Bee" />
            <h1>Reading Bee</h1>
            <p class="lede">A quiet place to practice reading, one line at a time.</p>
          </div>
          <label>
            Who is reading?
            <input type="text" maxlength="40" placeholder="Student name" .value=${this.name} @input=${this.onName} />
          </label>
          <div class="bands">
            ${BANDS.map(
              (band) => html`
                <button class="band" ?active=${this.band === band.id} @click=${() => (this.band = band.id)}>
                  <strong>${band.label}</strong>
                  <span>${band.detail}</span>
                </button>
              `,
            )}
          </div>
          <button class="primary-btn" ?disabled=${!canStart} @click=${this.start}>Start reading</button>
        </div>
      </div>
    `;
  }

  private onName = (event: Event): void => {
    this.name = (event.target as HTMLInputElement).value;
  };

  private start = (): void => {
    if (!this.band || !this.name.trim()) return;
    appStore.createFirstProfile(this.name, this.band);
  };
}
