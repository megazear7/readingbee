import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { COLOR_PAIRS } from "../shared/colors.js";
import { Profile, ReadingBand } from "../shared/type.app.js";
import { downloadIcon, plusIcon, trashIcon } from "./icons.js";
import { ReadingBeeModal } from "./component.modal.js";
import { ReadingBeePasscode } from "./component.passcode.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import "./component.modal.js";
import "./component.passcode.js";

const BANDS: { id: ReadingBand; label: string }[] = [
  { id: "words", label: "I read words" },
  { id: "phrases", label: "I read phrases" },
  { id: "sentences", label: "I read sentences" },
  { id: "books", label: "I read books" },
];

@customElement("reading-bee-settings")
export class ReadingBeeSettings extends LitElement {
  static override styles = [
    globalStyles,
    css`
      h2 {
        margin-top: 1.4rem;
      }

      .stack {
        display: grid;
        gap: 0.8rem;
      }

      .profile-card {
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        border-radius: 18px;
        padding: 0.9rem;
        display: grid;
        gap: 0.7rem;
      }

      .profile-top {
        display: flex;
        align-items: center;
        gap: 0.7rem;
      }

      .swatch {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex: 0 0 auto;
      }

      .grow {
        flex: 1;
      }

      .level {
        color: var(--color-1);
        font-size: 0.88rem;
        font-weight: 700;
      }

      .pairs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
        gap: 0.4rem;
      }

      .pair {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid transparent;
      }

      .pair[selected] {
        border-color: #fff;
      }

      .danger {
        margin-top: 1.6rem;
        padding: 1rem;
        border-radius: 18px;
        border: 1px solid rgba(232, 93, 76, 0.35);
        background: rgba(232, 93, 76, 0.06);
      }

      .confirm {
        display: grid;
        gap: 0.8rem;
      }
    `,
  ];

  @query("reading-bee-modal") private modal!: ReadingBeeModal;
  @query("reading-bee-passcode") private pad?: ReadingBeePasscode;
  @state() private unlocked = false;
  @state() private creating = false;
  @state() private pendingPasscode = "";
  @state() private newName = "";
  @state() private newBand: ReadingBand = "words";
  @state() private updatingPasscode = false;
  @state() private passcodeStep: "current" | "next" | "confirm" = "current";
  @state() private nextPasscode = "";
  @state() private confirmWipe = false;

  override render(): TemplateResult {
    return html`
      <reading-bee-modal wide @ModelClosing=${this.reset}>
        <slot name="open-button" slot="open-button"></slot>
        <div slot="body">${this.unlocked ? this.settingsView() : this.gateView()}</div>
      </reading-bee-modal>
    `;
  }

  open(): void {
    void this.modal.open();
  }

  private gateView(): TemplateResult {
    const creating = this.creating || !appStore.hasPasscode();
    return html`
      <reading-bee-passcode
        title=${creating ? (this.pendingPasscode ? "Confirm passcode" : "Create passcode") : "Settings"}
        hint=${creating ? "This passcode unlocks settings and profile switching" : "Enter the instructor passcode"}
        @complete=${creating ? this.onCreate : this.onUnlock}></reading-bee-passcode>
    `;
  }

  private settingsView(): TemplateResult {
    if (this.updatingPasscode) {
      return html`
        <reading-bee-passcode
          title=${this.passcodeTitle()}
          hint="4-digit instructor passcode"
          @complete=${this.onUpdatePasscode}></reading-bee-passcode>
      `;
    }
    if (this.confirmWipe) {
      return html`
        <div class="confirm">
          <h2>Delete all app data?</h2>
          <p>This cannot be undone. Every profile, result, and setting will be permanently deleted.</p>
          <reading-bee-passcode
            title="Re-enter passcode"
            hint="Confirm with the instructor passcode"
            @complete=${this.onWipe}></reading-bee-passcode>
          <button class="ghost-btn" @click=${() => (this.confirmWipe = false)}>Cancel</button>
        </div>
      `;
    }
    return html`
      <h1>Settings</h1>
      <button class="ghost-btn" @click=${() => (this.updatingPasscode = true)}>Update passcode</button>
      <h2>Profiles</h2>
      <div class="stack">${appStore.state.profiles.map((profile) => this.profileCard(profile))}</div>
      <h2>Add profile</h2>
      <div class="stack">
        <input type="text" maxlength="40" placeholder="Profile name" .value=${this.newName} @input=${this.onNewName} />
        <select @change=${this.onNewBand}>
          ${BANDS.map(
            (band) => html`
              <option value=${band.id} ?selected=${this.newBand === band.id}>${band.label}</option>
            `,
          )}
        </select>
        <button class="primary-btn" @click=${this.addProfile}>${plusIcon} Add profile</button>
      </div>
      <h2>App data</h2>
      <button class="ghost-btn" @click=${this.download}>${downloadIcon} Download JSON</button>
      <div class="danger">
        <h2>Danger zone</h2>
        <p>Permanently delete all Reading Bee data on this device.</p>
        <button class="danger-btn" @click=${() => (this.confirmWipe = true)}>${trashIcon} Delete all app data</button>
      </div>
    `;
  }

  private profileCard(profile: Profile): TemplateResult {
    return html`
      <div class="profile-card">
        <div class="profile-top">
          <div
            class="swatch"
            style="background: linear-gradient(135deg, ${profile.primaryColor} 0 50%, ${profile.secondaryColor} 50% 100%);"></div>
          <input class="grow" .value=${profile.name} @change=${(event: Event) => this.rename(profile.id, event)} />
          <div class="level">Lv ${profile.level}</div>
          <button class="muted-btn" aria-label="Remove profile" @click=${() => appStore.removeProfile(profile.id)}>
            ${trashIcon}
          </button>
        </div>
        <div class="pairs">
          ${COLOR_PAIRS.map(
            (pair, index) => html`
              <button
                class="pair"
                ?selected=${profile.colorPairIndex === index}
                style="background: linear-gradient(135deg, ${pair.primary} 0 50%, ${pair.secondary} 50% 100%);"
                aria-label="Color pair ${index + 1}"
                @click=${() => appStore.recolorProfile(profile.id, index)}></button>
            `,
          )}
        </div>
      </div>
    `;
  }

  private passcodeTitle(): string {
    if (this.passcodeStep === "current") return "Current passcode";
    if (this.passcodeStep === "next") return "New passcode";
    return "Confirm new passcode";
  }

  private onUnlock = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.pad?.shake();
      return;
    }
    this.unlocked = true;
  };

  private onCreate = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!this.pendingPasscode) {
      this.pendingPasscode = value;
      this.creating = true;
      this.pad?.reset();
      return;
    }
    if (value !== this.pendingPasscode) {
      this.pendingPasscode = "";
      this.pad?.shake();
      return;
    }
    appStore.setPasscode(value);
    this.unlocked = true;
  };

  private onUpdatePasscode = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (this.passcodeStep === "current") {
      if (!appStore.verifyPasscode(value)) {
        this.pad?.shake();
        return;
      }
      this.passcodeStep = "next";
      this.pad?.reset();
      return;
    }
    if (this.passcodeStep === "next") {
      this.nextPasscode = value;
      this.passcodeStep = "confirm";
      this.pad?.reset();
      return;
    }
    if (value !== this.nextPasscode) {
      this.nextPasscode = "";
      this.passcodeStep = "next";
      this.pad?.shake();
      return;
    }
    appStore.setPasscode(value);
    this.updatingPasscode = false;
    this.passcodeStep = "current";
    this.nextPasscode = "";
  };

  private onWipe = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.pad?.shake();
      return;
    }
    appStore.wipeAll();
    void this.modal.close();
  };

  private onNewName = (event: Event): void => {
    this.newName = (event.target as HTMLInputElement).value;
  };

  private onNewBand = (event: Event): void => {
    this.newBand = (event.target as HTMLSelectElement).value as ReadingBand;
  };

  private addProfile = (): void => {
    if (!this.newName.trim()) return;
    appStore.addProfile(this.newName, this.newBand);
    this.newName = "";
  };

  private rename(id: string, event: Event): void {
    appStore.renameProfile(id, (event.target as HTMLInputElement).value);
  }

  private download = (): void => {
    const blob = new Blob([appStore.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reading-bee-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  private reset = (): void => {
    this.unlocked = false;
    this.creating = false;
    this.pendingPasscode = "";
    this.updatingPasscode = false;
    this.passcodeStep = "current";
    this.nextPasscode = "";
    this.confirmWipe = false;
  };
}
