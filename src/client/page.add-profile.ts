import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { READING_BANDS } from "../shared/bands.js";
import { COLOR_PAIRS, nextColorPairIndex } from "../shared/colors.js";
import { ReadingBand } from "../shared/type.app.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { backIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";

@customElement("reading-bee-add-profile")
export class ReadingBeeAddProfile extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .page {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: grid;
        grid-template-columns: 44px 1fr 44px;
        align-items: center;
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

      .back:hover {
        color: var(--color-1);
      }

      .body {
        width: min(640px, 100%);
        margin: 0 auto;
        padding: 1.2rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
        display: grid;
        gap: 1.1rem;
      }

      label {
        display: grid;
        gap: 0.45rem;
        font-size: 0.92rem;
        color: var(--color-primary-text-muted);
      }

      h2 {
        margin: 0;
        font-size: 1.05rem;
      }

      .section {
        display: grid;
        gap: 0.4rem;
      }

      .bands {
        display: grid;
        gap: 0.7rem;
      }

      .band {
        width: 100%;
        text-align: left;
        padding: 0.85rem 1.1rem;
        border-radius: 18px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
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
        text-align: right;
      }

      .pairs {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 0.5rem;
      }

      .pair {
        width: 100%;
        min-width: 0;
        aspect-ratio: 1;
        height: auto;
        border-radius: 50%;
        border: 3px solid transparent;
      }

      .pair[selected] {
        border-color: #fff;
      }

      .primary-btn {
        width: 100%;
        margin-top: 0.4rem;
      }
    `,
  ];

  @state() private name = "";
  @state() private band: ReadingBand | null = null;
  @state() private colorPairIndex = nextColorPairIndex(
    appStore.state.profiles.map((profile) => profile.colorPairIndex),
  );

  override render(): TemplateResult {
    const canSave = this.name.trim().length > 0 && this.band !== null;
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${this.close}>${backIcon}</button>
          <h1>Add profile</h1>
        </header>
        <div class="body">
          <label>
            Profile name
            <input type="text" maxlength="40" placeholder="Student name" .value=${this.name} @input=${this.onName} />
          </label>
          <div class="section">
            <h2>Reading level</h2>
            <div class="bands">
              ${READING_BANDS.map(
                (band) => html`
                  <button class="band" ?active=${this.band === band.id} @click=${() => (this.band = band.id)}>
                    <strong>${band.label}</strong>
                    <span>${band.detail}</span>
                  </button>
                `,
              )}
            </div>
          </div>
          <div class="section">
            <h2>Color pair</h2>
            <div class="pairs">
              ${COLOR_PAIRS.map(
                (pair, index) => html`
                  <button
                    class="pair"
                    ?selected=${this.colorPairIndex === index}
                    style="background: linear-gradient(135deg, ${pair.primary} 0 50%, ${pair.secondary} 50% 100%);"
                    aria-label="Color pair ${index + 1}"
                    @click=${() => (this.colorPairIndex = index)}></button>
                `,
              )}
            </div>
          </div>
          <button class="primary-btn" ?disabled=${!canSave} @click=${this.save}>Add profile</button>
        </div>
      </div>
    `;
  }

  private close = (): void => {
    navigate("settings");
  };

  private onName = (event: Event): void => {
    this.name = (event.target as HTMLInputElement).value;
  };

  private save = (): void => {
    if (!this.band || !this.name.trim()) {
      dispatch(this, WarningEvent("Enter a name and reading level"));
      return;
    }
    appStore.addProfile(this.name, this.band, this.colorPairIndex);
    dispatch(this, SuccessEvent("Profile added"));
    navigate("settings");
  };
}
