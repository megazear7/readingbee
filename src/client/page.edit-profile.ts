import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { backIcon } from "./icons.js";
import { navigate, profileIdFromPath } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.instructor-gate.js";

@customElement("reading-bee-edit-profile")
export class ReadingBeeEditProfile extends LitElement {
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

      .body {
        width: min(640px, 100%);
        margin: 0 auto;
        padding: 1.7rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
        display: grid;
        gap: 1.5rem;
        align-content: start;
      }

      h2 {
        margin: 0.15rem 0 0;
        font-size: 0.92rem;
        font-weight: 400;
        letter-spacing: 0;
        color: var(--color-primary-text-muted);
      }

      .section {
        display: grid;
        gap: 0.35rem;
      }

      input[type="text"] {
        font-size: 1.45rem;
        padding: 0.95rem 1rem;
      }

      .primary-btn {
        width: 100%;
        margin-top: 0.4rem;
        font-size: 1.25rem;
        padding: 0.4rem 1rem;
        min-height: 0;
      }
    `,
  ];

  @state() private name = "";
  @state() private profileId = "";
  @query("input") private input?: HTMLInputElement;

  override connectedCallback(): void {
    super.connectedCallback();
    this.profileId = profileIdFromPath() ?? "";
    const profile = appStore.state.profiles.find((item) => item.id === this.profileId);
    this.name = profile?.name ?? "";
    if (!profile) {
      navigate("settings");
    }
  }

  override firstUpdated(): void {
    this.input?.focus();
    this.input?.select();
  }

  override render(): TemplateResult {
    const canSave = this.name.trim().length > 0;
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${this.close}>${backIcon}</button>
          <h1>Edit name</h1>
        </header>
        <div class="body">
          <reading-bee-instructor-gate>
            <div class="section">
              <h2>Profile name</h2>
              <input
                type="text"
                maxlength="40"
                placeholder="Student name"
                .value=${this.name}
                @input=${this.onName}
                @keydown=${this.onKey} />
            </div>
            <button class="primary-btn" ?disabled=${!canSave} @click=${this.save}>Save name</button>
          </reading-bee-instructor-gate>
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

  private onKey = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      this.save();
    }
  };

  private save = (): void => {
    if (!this.name.trim()) {
      dispatch(this, WarningEvent("Enter a name"));
      return;
    }
    if (!this.profileId) return;
    appStore.renameProfile(this.profileId, this.name);
    dispatch(this, SuccessEvent("Name updated"));
    navigate("settings");
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-edit-profile": ReadingBeeEditProfile;
  }
}
