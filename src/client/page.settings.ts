import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { avatarStyle, COLOR_PAIRS, profileInitial } from "../shared/colors.js";
import { sampleTextAtLevel } from "../shared/corpus.js";
import { pictureFor } from "../shared/letter-pictures.js";
import { profileShareUrl, shouldNativeShare } from "../shared/profile-share.js";
import { MAX_LEVEL, MIN_LEVEL, Profile } from "../shared/type.app.js";
import { ReadingBeeModal } from "./component.modal.js";
import { ReadingBeePasscode } from "./component.passcode.js";
import { StoreController } from "./controller.store.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { backIcon, downloadIcon, shareIcon, trashIcon, uploadIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.instructor-gate.js";
import "./component.modal.js";
import "./component.passcode.js";

@customElement("reading-bee-settings")
export class ReadingBeeSettings extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
        max-width: 100%;
        overflow-x: clip;
      }

      .page {
        min-height: 100dvh;
        min-width: 0;
        max-width: 100%;
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
        min-width: 0;
        max-width: 100%;
        margin: 0 auto;
        padding: 1.2rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
      }

      h2 {
        margin-top: 1.6rem;
      }

      .stack {
        display: grid;
        gap: 0.8rem;
        min-width: 0;
      }

      .profile-card {
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        border-radius: 18px;
        padding: 0.9rem;
        display: grid;
        gap: 0.7rem;
        min-width: 0;
      }

      .profile-top {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-width: 0;
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
        min-width: 0;
      }

      .level {
        color: var(--color-1);
        font-size: 0.88rem;
        font-weight: 700;
        padding: 0.35rem 0.7rem;
        min-height: 36px;
        border-radius: 999px;
        border: 1px solid rgba(232, 184, 74, 0.35);
        background: rgba(232, 184, 74, 0.1);
        flex: 0 0 auto;
        white-space: nowrap;
      }

      .level:hover {
        background: rgba(232, 184, 74, 0.2);
        border-color: var(--color-1);
      }

      .level-form {
        display: grid;
        gap: 1rem;
      }

      .level-controls {
        display: grid;
        grid-template-columns: 1fr 5.5rem;
        gap: 0.7rem;
        align-items: center;
      }

      input[type="range"] {
        appearance: none;
        height: 8px;
        padding: 0;
        border-radius: 999px;
        background: #221e18;
        border: 1px solid var(--color-panel-border);
      }

      input[type="range"]::-webkit-slider-thumb {
        appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--color-1);
        box-shadow: 0 0 0 3px rgba(232, 184, 74, 0.2);
        cursor: pointer;
      }

      input[type="range"]::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border: 0;
        border-radius: 50%;
        background: var(--color-1);
        cursor: pointer;
      }

      input[type="number"] {
        text-align: center;
        font-weight: 700;
        padding: 0.7rem 0.4rem;
      }

      .sample {
        min-height: 5.5rem;
        border-radius: 18px;
        background: #120f0c;
        border: 1px solid var(--color-panel-border);
        display: grid;
        place-items: center;
        gap: 0.7rem;
        padding: 1.1rem 1rem;
        text-align: center;
        font-family: var(--font-reading);
        font-weight: 500;
        line-height: 1.35;
      }

      .sample.has-picture {
        min-height: 9rem;
      }

      .sample .picture {
        width: 88px;
        height: 88px;
        object-fit: contain;
        filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35));
      }

      .sample[data-kind="letter"] {
        font-size: 2.6rem;
      }

      .sample[data-kind="word"] {
        font-size: 2rem;
      }

      .sample[data-kind="phrase"] {
        font-size: 1.45rem;
      }

      .sample[data-kind="sentence"],
      .sample[data-kind="book"] {
        font-size: 1.15rem;
      }

      .sample-label {
        margin: 0;
        font-size: 0.88rem;
        color: var(--color-primary-text-muted);
      }

      .pairs {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 0.5rem;
        padding: 0.2rem 0 0.6rem;
      }

      .pair {
        width: 100%;
        min-width: 0;
        aspect-ratio: 1;
        height: auto;
        border-radius: 50%;
        box-shadow: 0 0 0 3px transparent;
        transition:
          box-shadow var(--time-normal) ease,
          transform var(--time-normal) ease;
      }

      .pair:hover {
        transform: scale(1.08);
        box-shadow: 0 0 0 3px var(--color-1);
      }

      .pair[selected] {
        box-shadow: 0 0 0 3px #fff;
      }

      .pair[selected]:hover {
        box-shadow:
          0 0 0 3px #fff,
          0 0 0 6px rgba(232, 184, 74, 0.45);
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

      .danger h2 {
        margin-top: 0;
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

      .icon-delete,
      .icon-share {
        min-width: 40px;
        min-height: 40px;
        padding: 0.35rem;
        flex: 0 0 auto;
      }

      .icon-share:hover {
        color: var(--color-1);
        background: rgba(232, 184, 74, 0.14);
      }

      .icon-delete:hover {
        color: var(--color-danger);
        background: rgba(232, 93, 76, 0.14);
      }

      .data-actions {
        display: flex;
        width: 100%;
        min-width: 0;
      }

      .data-actions .ghost-btn {
        flex: 1;
        border-radius: 0;
        min-width: 0;
        position: relative;
        overflow: hidden;
        padding-left: 0.55rem;
        padding-right: 0.55rem;
      }

      .data-actions .ghost-btn + .ghost-btn {
        margin-left: -1px;
      }

      .data-actions .ghost-btn:first-child {
        border-radius: 18px 0 0 18px;
      }

      .data-actions .ghost-btn:last-child {
        border-radius: 0 18px 18px 0;
      }

      .data-actions .ghost-btn:hover {
        transform: none;
        z-index: 1;
      }

      .skeleton {
        width: 100%;
        min-height: 58px;
        border-radius: 18px;
        border: 2px dashed rgba(244, 234, 213, 0.28);
        background: transparent;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.9rem;
        color: var(--color-primary-text-muted);
        font-weight: 700;
        transition:
          border-color var(--time-normal) ease,
          color var(--time-normal) ease;
      }

      .skeleton:hover {
        border-color: var(--color-1);
        color: var(--color-primary-text);
      }

      .ghost-swatch {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px dashed rgba(244, 234, 213, 0.28);
        flex: 0 0 auto;
        transition: border-color var(--time-normal) ease;
      }

      .skeleton:hover .ghost-swatch {
        border-color: var(--color-1);
      }
    `,
  ];

  @state() private updatingPasscode = false;
  @state() private passcodeStep: "current" | "next" | "confirm" = "current";
  @state() private nextPasscode = "";
  @state() private wipeStep: "none" | "confirm" | "pin" = "none";
  @state() private pendingDeleteId: string | null = null;
  @state() private pendingDeleteName = "";
  @state() private colorPickerProfileId: string | null = null;
  @state() private shareProfileId: string | null = null;
  @state() private shareProfileName = "";
  @state() private levelProfileId: string | null = null;
  @state() private draftLevel = 1;
  @query(".color-modal") private colorModal!: ReadingBeeModal;
  @query(".delete-modal") private deleteModal!: ReadingBeeModal;
  @query(".share-modal") private shareModal!: ReadingBeeModal;
  @query(".level-modal") private levelModal!: ReadingBeeModal;

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
          <reading-bee-instructor-gate>${this.settingsView()}</reading-bee-instructor-gate>
        </div>
        <reading-bee-modal class="color-modal" @ModelClosing=${this.closeColorPicker}>
          <div slot="body">${this.colorPickerBody()}</div>
        </reading-bee-modal>
        <reading-bee-modal class="delete-modal" @ModelClosing=${this.closeDelete}>
          <div slot="body">${this.deleteBody()}</div>
        </reading-bee-modal>
        <reading-bee-modal class="share-modal" @ModelClosing=${this.closeShare}>
          <div slot="body">${this.shareBody()}</div>
        </reading-bee-modal>
        <reading-bee-modal class="level-modal" @ModelClosing=${this.closeLevel}>
          <div slot="body">${this.levelBody()}</div>
        </reading-bee-modal>
      </div>
    `;
  }

  private close = (): void => {
    navigate("reading");
  };

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
      <h2>Profiles</h2>
      <div class="stack">
        ${appStore.state.profiles.map((profile) => this.profileCard(profile))}
        <button class="skeleton" @click=${() => navigate("add-profile")}>
          <span class="ghost-swatch"></span>
          Add Profile
        </button>
      </div>
      <h2>App data</h2>
      <div class="data-actions">
        <button class="ghost-btn" @click=${() => (this.updatingPasscode = true)}>Update passcode</button>
        <button class="ghost-btn" @click=${this.download}>${downloadIcon} Download</button>
        <button class="ghost-btn" @click=${() => navigate("upload")}>${uploadIcon} Upload</button>
      </div>
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
          <div class="level-wrap">
            <button class="level" aria-label="Set exact level" @click=${() => this.openLevel(profile.id)}>
              Lv ${profile.level}
            </button>
          </div>
          <button class="muted-btn icon-share" aria-label="Share profile" @click=${() => this.openShare(profile.id)}>
            ${shareIcon}
          </button>
          <button class="muted-btn icon-delete" aria-label="Remove profile" @click=${() => this.openDelete(profile.id)}>
            ${trashIcon}
          </button>
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

  private levelBody(): TemplateResult {
    const profile = appStore.state.profiles.find((item) => item.id === this.levelProfileId);
    if (!profile) {
      return html``;
    }
    const sample = sampleTextAtLevel(this.draftLevel);
    const picture = sample ? pictureFor(sample) : undefined;
    return html`
      <div class="level-form">
        <h2 class="picker-title">Set exact level</h2>
        <p>Choose a level from ${MIN_LEVEL} to ${MAX_LEVEL} for ${profile.name}.</p>
        <div class="level-controls">
          <input
            type="range"
            min=${MIN_LEVEL}
            max=${MAX_LEVEL}
            .value=${String(this.draftLevel)}
            aria-label="Level slider"
            @input=${this.onDraftLevel} />
          <input
            type="number"
            min=${MIN_LEVEL}
            max=${MAX_LEVEL}
            .value=${String(this.draftLevel)}
            aria-label="Level number"
            @input=${this.onDraftLevel} />
        </div>
        <p class="sample-label">Sample at level ${this.draftLevel}</p>
        <div class="sample ${picture ? "has-picture" : ""}" data-kind=${sample?.kind ?? "word"}>
          <span>${sample?.text ?? ""}</span>
          ${
            picture
              ? html`
                  <img class="picture" src=${picture} alt="" aria-hidden="true" />
                `
              : ""
          }
        </div>
        <div class="confirm-row">
          <button class="ghost-btn" @click=${() => this.levelModal.close()}>Cancel</button>
          <button class="primary-btn" @click=${this.saveLevel}>Save level</button>
        </div>
      </div>
    `;
  }

  private shareBody(): TemplateResult {
    const profile = appStore.state.profiles.find((item) => item.id === this.shareProfileId);
    const name = profile?.name ?? this.shareProfileName;
    if (!name) {
      return html``;
    }
    const nativeShare = shouldNativeShare();
    return html`
      <div class="confirm">
        <h2>Share ${name}</h2>
        <p>
          Send a link to a parent, teacher, or another device. When they open it, Reading Bee will ask if they want to
          add ${name}'s profile and reading history.
        </p>
        <div class="confirm-row">
          <button class="ghost-btn" @click=${() => this.shareModal.close()}>Cancel</button>
          <button class="primary-btn" @click=${() => profile && this.confirmShare(profile)}>
            ${nativeShare ? "Share link" : "Copy link"}
          </button>
        </div>
      </div>
    `;
  }

  private deleteBody(): TemplateResult {
    if (!this.pendingDeleteName) {
      return html``;
    }
    return html`
      <div class="confirm">
        <h2>Delete ${this.pendingDeleteName}?</h2>
        <p>This will permanently remove this profile and their reading history. This cannot be undone.</p>
        <div class="confirm-row">
          <button class="ghost-btn" @click=${() => this.deleteModal.close()}>Cancel</button>
          <button class="danger-btn" @click=${this.confirmDelete}>Delete profile</button>
        </div>
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

  private openLevel(profileId: string): void {
    const profile = appStore.state.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    this.levelProfileId = profile.id;
    this.draftLevel = profile.level;
    void this.levelModal.open();
  }

  private closeLevel = (): void => {
    this.levelProfileId = null;
  };

  private onDraftLevel = (event: Event): void => {
    const raw = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(raw)) return;
    this.draftLevel = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(raw)));
  };

  private saveLevel = async (): Promise<void> => {
    const id = this.levelProfileId;
    if (!id) return;
    appStore.setProfileLevel(id, this.draftLevel);
    await this.levelModal.close();
    dispatch(this, SuccessEvent("Level updated"));
  };

  private openDelete(profileId: string): void {
    const profile = appStore.state.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    this.pendingDeleteId = profile.id;
    this.pendingDeleteName = profile.name;
    void this.deleteModal.open();
  }

  private closeDelete = (): void => {
    this.pendingDeleteId = null;
  };

  private confirmDelete = async (): Promise<void> => {
    const id = this.pendingDeleteId;
    if (!id) return;
    await this.deleteModal.close();
    this.removeProfile(id);
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

  private removeProfile(id: string): void {
    appStore.removeProfile(id);
    this.pendingDeleteId = null;
    dispatch(this, SuccessEvent("Profile removed"));
  }

  private rename(id: string, event: Event): void {
    appStore.renameProfile(id, (event.target as HTMLInputElement).value);
  }

  private openShare(profileId: string): void {
    const profile = appStore.state.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    this.shareProfileId = profile.id;
    this.shareProfileName = profile.name;
    void this.shareModal.open();
  }

  private closeShare = (): void => {
    this.shareProfileId = null;
  };

  private confirmShare = async (profile: Profile): Promise<void> => {
    const url = profileShareUrl(profile);
    try {
      if (shouldNativeShare()) {
        await navigator.share({
          title: "Reading Bee",
          text: `Add ${profile.name}'s Reading Bee profile`,
          url,
        });
        await this.shareModal.close();
        return;
      }
      await navigator.clipboard.writeText(url);
      await this.shareModal.close();
      dispatch(this, SuccessEvent("Link copied"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      dispatch(this, WarningEvent("Could not share this profile"));
    }
  };

  private download = (): void => {
    const blob = new Blob([appStore.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reading-bee-data.json";
    link.click();
    URL.revokeObjectURL(url);
    dispatch(this, SuccessEvent("Backup downloaded"));
  };
}
