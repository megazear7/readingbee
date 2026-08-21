import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { profileStats } from "../shared/algorithm.js";
import { avatarStyle, profileInitial } from "../shared/colors.js";
import { Profile } from "../shared/type.app.js";
import { ReadingBeeModal } from "./component.modal.js";
import { ReadingBeePasscode } from "./component.passcode.js";
import { StoreController } from "./controller.store.js";
import { SuccessEvent } from "./event.success.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.modal.js";
import "./component.passcode.js";

@customElement("reading-bee-profile-modal")
export class ReadingBeeProfileModal extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .hero {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 0.45rem;
        margin-bottom: 1.2rem;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        box-shadow: var(--shadow-normal);
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 1.85rem;
        line-height: 1;
      }

      .level {
        font-size: 0.95rem;
        color: var(--color-1);
        font-weight: 700;
      }

      .bar {
        width: min(220px, 70%);
        height: 8px;
        border-radius: 999px;
        background: #2a251e;
        overflow: hidden;
      }

      .bar span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, var(--color-1), #f3d27a);
      }

      .stats {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.45rem;
        margin: 1rem 0 1.3rem;
      }

      .stat {
        display: flex;
        flex-direction: row-reverse;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.6rem;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        border-radius: 16px;
        padding: 0.7rem 0.9rem;
      }

      .stat b {
        font-size: 1.15rem;
      }

      .stat span {
        color: var(--color-primary-text-muted);
        font-size: 0.82rem;
      }

      @media (min-width: 600px) {
        .stats {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .stat {
          display: grid;
          flex-direction: unset;
          justify-items: center;
          text-align: center;
          padding: 0.7rem 0.3rem;
          gap: 0.12rem;
        }

        .stat b {
          font-size: 1.1rem;
        }

        .stat span {
          font-size: 0.72rem;
        }
      }

      .list {
        display: grid;
        gap: 0.55rem;
      }

      .row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem;
        border-radius: 16px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        width: 100%;
        text-align: left;
      }

      .row[current] {
        border-color: var(--color-1);
      }

      .mini {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        flex: 0 0 auto;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 0.72rem;
        line-height: 1;
      }

      .meta {
        display: grid;
      }

      .meta small {
        color: var(--color-primary-text-muted);
      }
    `,
  ];

  @query("reading-bee-modal") private modal!: ReadingBeeModal;
  @state() private switchingTo: string | null = null;
  @state() private creatingPasscode = false;
  @state() private pendingPasscode = "";

  constructor() {
    super();
    new StoreController(this);
  }

  override render(): TemplateResult {
    const profile = appStore.currentProfile;
    if (!profile) return html``;
    const stats = profileStats(profile);
    const progress = `${profile.level}%`;
    return html`
      <reading-bee-modal @ModelClosing=${this.reset}>
        <slot name="open-button" slot="open-button"></slot>
        <div slot="body">
          ${
            this.switchingTo
              ? this.passcodeView()
              : html`
                  <div class="hero">
                    <div class="avatar" style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}>
                      ${profileInitial(profile.name)}
                    </div>
                    <h2>${profile.name}</h2>
                    <div class="level">Level ${profile.level}</div>
                    <div class="bar"><span style="width:${progress}"></span></div>
                  </div>
                  <div class="stats">
                    <div class="stat">
                      <b>${stats.read}</b>
                      <span>Texts read</span>
                    </div>
                    <div class="stat">
                      <b>${stats.right}</b>
                      <span>Right</span>
                    </div>
                    <div class="stat">
                      <b>${stats.wrong}</b>
                      <span>Wrong</span>
                    </div>
                    <div class="stat">
                      <b>${stats.skip}</b>
                      <span>Skipped</span>
                    </div>
                    <div class="stat">
                      <b>${stats.wayTooEasy}</b>
                      <span>Easy</span>
                    </div>
                  </div>
                  <h2>Switch profile</h2>
                  <div class="list">
                    ${appStore.state.profiles.map(
                      (item) => html`
                        <button class="row" ?current=${item.id === profile.id} @click=${() => this.requestSwitch(item)}>
                          <div class="mini" style=${avatarStyle(item.primaryColor, item.secondaryColor)}>
                            ${profileInitial(item.name)}
                          </div>
                          <div class="meta">
                            <strong>${item.name}</strong>
                            <small>Level ${item.level}</small>
                          </div>
                        </button>
                      `,
                    )}
                  </div>
                `
          }
        </div>
      </reading-bee-modal>
    `;
  }

  open(): void {
    void this.modal.open();
  }

  private passcodeView(): TemplateResult {
    if (this.creatingPasscode) {
      return html`
        <reading-bee-passcode
          title=${this.pendingPasscode ? "Confirm passcode" : "Create passcode"}
          hint=${this.pendingPasscode ? "Enter it once more" : "Set a 4-digit instructor passcode"}
          @complete=${this.onCreatePasscode}></reading-bee-passcode>
      `;
    }
    return html`
      <reading-bee-passcode
        title="Switch profile"
        hint="Enter the instructor passcode"
        @complete=${this.onUnlock}></reading-bee-passcode>
    `;
  }

  private requestSwitch(profile: Profile): void {
    if (profile.id === appStore.state.currentProfileId) return;
    this.switchingTo = profile.id;
    this.creatingPasscode = !appStore.hasPasscode();
    this.pendingPasscode = "";
  }

  private padFrom(event: Event): ReadingBeePasscode {
    return event.currentTarget as ReadingBeePasscode;
  }

  private onCreatePasscode = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    const pad = this.padFrom(event);
    if (!this.pendingPasscode) {
      this.pendingPasscode = value;
      pad.reset();
      return;
    }
    if (value !== this.pendingPasscode) {
      this.pendingPasscode = "";
      pad.shake();
      return;
    }
    appStore.setPasscode(value);
    this.finishSwitch();
  };

  private onUnlock = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.padFrom(event).shake();
      return;
    }
    this.finishSwitch();
  };

  private finishSwitch(): void {
    if (this.switchingTo) {
      appStore.switchProfile(this.switchingTo);
      dispatch(this, SuccessEvent("Switched profile"));
    }
    this.reset();
    void this.modal.close();
  }

  private reset = (): void => {
    this.switchingTo = null;
    this.creatingPasscode = false;
    this.pendingPasscode = "";
  };
}
