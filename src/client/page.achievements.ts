import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { ACHIEVEMENTS } from "../shared/achievements.js";
import { StoreController } from "./controller.store.js";
import { backIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import "./component.level-badge.js";
import "./component.medal.js";

@customElement("reading-bee-achievements")
export class ReadingBeeAchievements extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .page {
        min-height: 100dvh;
        min-width: 0;
        max-width: 100%;
        overflow-x: clip;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: grid;
        grid-template-columns: 44px 1fr auto;
        align-items: center;
        gap: 0.6rem;
        padding: calc(0.7rem + env(safe-area-inset-top)) 1rem 0.8rem;
        background: linear-gradient(to bottom, #0c0b09 70%, rgba(12, 11, 9, 0.86));
        border-bottom: 1px solid var(--color-panel-border);
      }

      header h1 {
        margin: 0;
        font-size: 1.2rem;
        text-align: center;
      }

      .back {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--color-primary-text);
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
      }

      .body {
        width: min(720px, 100%);
        min-width: 0;
        margin: 0 auto;
        padding: 1.2rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
      }

      .hero {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 0.35rem;
        margin: 0.2rem 0 1.4rem;
      }

      .hero reading-bee-medal {
        width: 88px;
        height: 99px;
      }

      .hero p {
        margin: 0;
      }

      .level-label {
        color: var(--color-1);
        font-weight: 800;
        font-size: 1.15rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .card {
        display: grid;
        justify-items: center;
        gap: 0.3rem;
        padding: 0.7rem 0.45rem 0.8rem;
        border-radius: 18px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        text-align: center;
        min-width: 0;
      }

      .card.locked {
        background: #14110e;
      }

      .name {
        font-weight: 800;
        font-size: 0.82rem;
        line-height: 1.2;
      }

      .hint {
        margin: 0;
        font-size: 0.74rem;
        line-height: 1.25;
        color: var(--color-primary-text-muted);
      }
    `,
  ];

  constructor() {
    super();
    new StoreController(this);
  }

  override render(): TemplateResult {
    const profile = appStore.currentProfile;
    if (!profile) {
      return html`
        <div class="page"><p>No profile selected.</p></div>
      `;
    }
    const unlocked = new Set(profile.achievements);
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${() => navigate("reading")}>${backIcon}</button>
          <h1>Achievements</h1>
          <reading-bee-level-badge .level=${profile.level}></reading-bee-level-badge>
        </header>
        <div class="body">
          <div class="hero">
            <reading-bee-medal .value=${profile.level}></reading-bee-medal>
            <p class="level-label">Level ${profile.level}</p>
            <p>${profile.name} is reading at level ${profile.level}.</p>
          </div>
          <div class="grid">
            ${ACHIEVEMENTS.map((item) => {
              const earned = unlocked.has(item.id);
              return html`
                <div class="card ${earned ? "earned" : "locked"}">
                  <reading-bee-medal .value=${item.number} ?grayscale=${!earned}></reading-bee-medal>
                  <span class="name">${item.title}</span>
                  <p class="hint">${item.description}</p>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-achievements": ReadingBeeAchievements;
  }
}
