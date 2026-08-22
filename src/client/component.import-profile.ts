import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { READING_BANDS } from "../shared/bands.js";
import { avatarStyle, profileInitial } from "../shared/colors.js";
import { findProfileByName, PROFILE_SHARE_PARAM, readSharedProfileFromSearch } from "../shared/profile-share.js";
import { Profile } from "../shared/type.app.js";
import { ReadingBeeModal } from "./component.modal.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.modal.js";

@customElement("reading-bee-import-profile")
export class ReadingBeeImportProfile extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .preview {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 0.4rem;
        margin: 0.4rem 0 0.4rem;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 700;
        font-size: 1.85rem;
        line-height: 1;
        box-shadow: var(--shadow-normal);
      }

      .level {
        color: var(--color-1);
        font-weight: 700;
        font-size: 0.95rem;
      }

      h2[slot="title"] {
        margin: 0;
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

      .stack {
        display: grid;
        gap: 0.55rem;
      }

      .stack button {
        width: 100%;
      }
    `,
  ];

  @query("reading-bee-modal") private modal!: ReadingBeeModal;
  @state() private pending: Profile | null = null;

  override firstUpdated(): void {
    this.consumeShareLink();
  }

  override render(): TemplateResult {
    const match = this.match();
    const title = this.pending ? (match ? `${this.pending.name} is already here` : `Add ${this.pending.name}?`) : "";
    return html`
      <reading-bee-modal @ModelClosing=${this.onClose}>
        ${
          title
            ? html`
                <h2 slot="title">${title}</h2>
              `
            : ""
        }
        <div slot="body">${this.body(match)}</div>
      </reading-bee-modal>
    `;
  }

  private match(): Profile | undefined {
    if (!this.pending) return undefined;
    return findProfileByName(appStore.state.profiles, this.pending.name, appStore.state.currentProfileId);
  }

  private body(match: Profile | undefined): TemplateResult {
    const profile = this.pending;
    if (!profile) {
      return html``;
    }
    const band = READING_BANDS.find((item) => item.id === profile.band);
    return html`
      <div class="confirm">
        ${
          match
            ? html`
                <p>
                  This device already has a student named ${match.name} (level ${match.level}). You can add this as a
                  new copy, or replace the existing profile and its reading history.
                </p>
              `
            : html`
                <p>This will add their profile and reading history to this device.</p>
              `
        }
        <div class="preview">
          <div class="avatar" style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}>
            ${profileInitial(profile.name)}
          </div>
          <strong>${profile.name}</strong>
          <div class="level">Level ${profile.level}${band ? ` · ${band.label}` : ""}</div>
        </div>
        ${
          match
            ? html`
                <div class="stack">
                  <button class="ghost-btn copy-btn" @click=${this.confirmCopy}>Import as copy</button>
                  <button class="danger-btn replace-btn" @click=${() => this.confirmReplace(match.id)}>
                    Replace existing profile
                  </button>
                  <button class="ghost-btn" @click=${() => this.modal.close()}>Cancel</button>
                </div>
              `
            : html`
                <div class="confirm-row">
                  <button class="ghost-btn" @click=${() => this.modal.close()}>Cancel</button>
                  <button class="primary-btn" @click=${this.confirmCopy}>Add profile</button>
                </div>
              `
        }
      </div>
    `;
  }

  private consumeShareLink(): void {
    const params = new URLSearchParams(window.location.search);
    if (!params.has(PROFILE_SHARE_PARAM)) {
      return;
    }
    const profile = readSharedProfileFromSearch(window.location.search);
    if (!profile) {
      dispatch(this, WarningEvent("This profile link is not valid"));
      this.clearShareQuery();
      return;
    }
    this.pending = profile;
    void this.updateComplete.then(() => {
      void this.modal.open();
    });
  }

  private confirmCopy = async (): Promise<void> => {
    if (!this.pending) return;
    const incoming = this.pending;
    await this.modal.close();
    const imported = appStore.importSharedProfile(incoming);
    this.clearShareQuery();
    dispatch(this, SuccessEvent(`${imported.name} added`));
    navigate("reading");
  };

  private confirmReplace = async (id: string): Promise<void> => {
    if (!this.pending) return;
    const incoming = this.pending;
    await this.modal.close();
    const replaced = appStore.replaceSharedProfile(id, incoming);
    this.clearShareQuery();
    dispatch(this, SuccessEvent(`${replaced.name} updated`));
    navigate("reading");
  };

  private onClose = (): void => {
    this.clearShareQuery();
    this.pending = null;
  };

  private clearShareQuery(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PROFILE_SHARE_PARAM)) {
      return;
    }
    url.searchParams.delete(PROFILE_SHARE_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
}
