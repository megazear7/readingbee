import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { avatarStyle, COLOR_PAIRS, profileInitial } from "../shared/colors.js";
import { Profile, ReadingBand } from "../shared/type.app.js";
import { ReadingBeeModal } from "./component.modal.js";
import { ReadingBeePasscode } from "./component.passcode.js";
import { StoreController } from "./controller.store.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { backIcon, downloadIcon, plusIcon, trashIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
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
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: calc(0.7rem + env(safe-area-inset-top)) 1rem 0.8rem;
        background: linear-gradient(to bottom, #0c0b09 70%, rgba(12, 11, 9, 0.86));
        border-bottom: 1px solid var(--color-panel-border);
      }

      header h1 {
        margin: 0;
        font-size: 1.2rem;
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
      }

      .gate {
        min-height: 60dvh;
        display: grid;
        place-items: center;
      }

      h2 {
        margin-top: 1.6rem;
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
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 0.9rem;
        line-height: 1;
        border: 2px solid rgba(244, 234, 213, 0.35);
        cursor: pointer;
      }

      .swatch:hover {
        border-color: var(--color-1);
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
        grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
        gap: 0.7rem;
        padding: 0.2rem 0 0.6rem;
      }

      .pair {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid transparent;
        justify-self: center;
      }

      .pair[selected] {
        border-color: #fff;
      }

      .picker-title {
        margin: 0 0 0.8rem;
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

      .confirm-row {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .remove-confirm {
        font-size: 0.85rem;
        color: var(--color-danger);
      }
    `,
  ];

  @state() private unlocked = false;
  @state() private creating = false;
  @state() private pendingPasscode = "";
  @state() private newName = "";
  @state() private newBand: ReadingBand = "words";
  @state() private updatingPasscode = false;
  @state() private passcodeStep: "current" | "next" | "confirm" = "current";
  @state() private nextPasscode = "";
  @state() private wipeStep: "none" | "confirm" | "pin" = "none";
  @state() private pendingDeleteId: string | null = null;
  @state() private colorPickerProfileId: string | null = null;
  @query("reading-bee-modal") private colorModal!: ReadingBeeModal;

  constructor() {
    super();
    new StoreController(this);
  }

  override render(): TemplateResult {
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${this.close}>${backIcon}</button>
          <h1>Settings</h1>
        </header>
        <div class="body">
          ${
            this.unlocked
              ? this.settingsView()
              : html`
                  <div class="gate">${this.gateView()}</div>
                `
          }
        </div>
        <reading-bee-modal @ModelClosing=${this.closeColorPicker}>
          <div slot="body">${this.colorPickerBody()}</div>
        </reading-bee-modal>
      </div>
    `;
  }

  private close = (): void => {
    navigate("reading");
  };

  private gateView(): TemplateResult {
    const creating = this.creating || !appStore.hasPasscode();
    return html`
      <reading-bee-passcode
        title=${creating ? (this.pendingPasscode ? "Confirm passcode" : "Create passcode") : "Enter passcode"}
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
    if (this.wipeStep === "confirm") {
      return html`
        <div class="confirm">
          <h2>Delete all app data?</h2>
          <p>This cannot be undone. Every profile, result, and setting will be permanently deleted.</p>
          <div class="confirm-row">
            <button class="ghost-btn" @click=${() => (this.wipeStep = "none")}>Cancel</button>
            <button class="danger-btn" @click=${() => (this.wipeStep = "pin")}>Yes, delete everything</button>
          </div>
        </div>
      `;
    }
    if (this.wipeStep === "pin") {
      return html`
        <div class="confirm">
          <h2>Re-enter passcode</h2>
          <p>Enter the instructor passcode to permanently delete all data.</p>
          <reading-bee-passcode
            title="Confirm delete"
            hint="4-digit passcode"
            @complete=${this.onWipe}></reading-bee-passcode>
          <button class="ghost-btn" @click=${() => (this.wipeStep = "none")}>Cancel</button>
        </div>
      `;
    }
    return html`
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
        <button class="primary-btn" ?disabled=${!this.newName.trim()} @click=${this.addProfile}>
          ${plusIcon} Add profile
        </button>
      </div>
      <h2>App data</h2>
      <button class="ghost-btn" @click=${this.download}>${downloadIcon} Download JSON</button>
      <div class="danger">
        <h2>Danger zone</h2>
        <p>Permanently delete all Reading Bee data on this device.</p>
        <button class="danger-btn" @click=${() => (this.wipeStep = "confirm")}>${trashIcon} Delete all app data</button>
      </div>
    `;
  }

  private profileCard(profile: Profile): TemplateResult {
    return html`
      <div class="profile-card">
        <div class="profile-top">
          <button
            class="swatch"
            aria-label="Change color"
            style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}
            @click=${() => this.openColorPicker(profile.id)}>
            ${profileInitial(profile.name)}
          </button>
          <input class="grow" .value=${profile.name} @change=${(event: Event) => this.rename(profile.id, event)} />
          <div class="level">Lv ${profile.level}</div>
          ${
            this.pendingDeleteId === profile.id
              ? html`
                  <span class="remove-confirm">
                    <button class="danger-btn" @click=${() => this.removeProfile(profile.id)}>Delete</button>
                    <button class="muted-btn" @click=${() => (this.pendingDeleteId = null)}>Cancel</button>
                  </span>
                `
              : html`
                  <button
                    class="muted-btn"
                    aria-label="Remove profile"
                    @click=${() => (this.pendingDeleteId = profile.id)}>
                    ${trashIcon}
                  </button>
                `
          }
        </div>
      </div>
    `;
  }

  private colorPickerBody(): TemplateResult {
    const profile = appStore.state.profiles.find((item) => item.id === this.colorPickerProfileId);
    if (!profile) {
      return html``;
    }
    return html`
      <h2 class="picker-title">Choose a color</h2>
      <div class="pairs">
        ${COLOR_PAIRS.map(
          (pair, index) => html`
            <button
              class="pair"
              ?selected=${profile.colorPairIndex === index}
              style="background: linear-gradient(135deg, ${pair.primary} 0 50%, ${pair.secondary} 50% 100%);"
              aria-label="Color pair ${index + 1}"
              @click=${() => this.pickColor(profile.id, index)}></button>
          `,
        )}
      </div>
    `;
  }

  private openColorPicker(profileId: string): void {
    this.colorPickerProfileId = profileId;
    void this.colorModal.open();
  }

  private closeColorPicker = (): void => {
    this.colorPickerProfileId = null;
  };

  private pickColor(profileId: string, index: number): void {
    appStore.recolorProfile(profileId, index);
    void this.colorModal.close();
  }

  private passcodeTitle(): string {
    if (this.passcodeStep === "current") return "Current passcode";
    if (this.passcodeStep === "next") return "New passcode";
    return "Confirm new passcode";
  }

  private padFrom(event: Event): ReadingBeePasscode {
    return event.currentTarget as ReadingBeePasscode;
  }

  private onUnlock = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.padFrom(event).shake();
      return;
    }
    this.unlocked = true;
  };

  private onCreate = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    const pad = this.padFrom(event);
    if (!this.pendingPasscode) {
      this.pendingPasscode = value;
      this.creating = true;
      pad.reset();
      return;
    }
    if (value !== this.pendingPasscode) {
      this.pendingPasscode = "";
      pad.shake();
      return;
    }
    appStore.setPasscode(value);
    this.unlocked = true;
    dispatch(this, SuccessEvent("Passcode saved"));
  };

  private onUpdatePasscode = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    const pad = this.padFrom(event);
    if (this.passcodeStep === "current") {
      if (!appStore.verifyPasscode(value)) {
        pad.shake();
        return;
      }
      this.passcodeStep = "next";
      pad.reset();
      return;
    }
    if (this.passcodeStep === "next") {
      this.nextPasscode = value;
      this.passcodeStep = "confirm";
      pad.reset();
      return;
    }
    if (value !== this.nextPasscode) {
      this.nextPasscode = "";
      this.passcodeStep = "next";
      pad.shake();
      return;
    }
    appStore.setPasscode(value);
    this.updatingPasscode = false;
    this.passcodeStep = "current";
    this.nextPasscode = "";
    dispatch(this, SuccessEvent("Passcode updated"));
  };

  private onWipe = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.padFrom(event).shake();
      return;
    }
    appStore.wipeAll();
    navigate("reading");
  };

  private onNewName = (event: Event): void => {
    this.newName = (event.target as HTMLInputElement).value;
  };

  private onNewBand = (event: Event): void => {
    this.newBand = (event.target as HTMLSelectElement).value as ReadingBand;
  };

  private addProfile = (): void => {
    if (!this.newName.trim()) {
      dispatch(this, WarningEvent("Enter a profile name"));
      return;
    }
    appStore.addProfile(this.newName, this.newBand);
    this.newName = "";
    dispatch(this, SuccessEvent("Profile added"));
  };

  private removeProfile(id: string): void {
    appStore.removeProfile(id);
    this.pendingDeleteId = null;
    dispatch(this, SuccessEvent("Profile removed"));
  }

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
    dispatch(this, SuccessEvent("Downloaded reading-bee-data.json"));
  };
}
