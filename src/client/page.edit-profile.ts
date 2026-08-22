import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { avatarStyle, profileInitial } from "../shared/colors.js";
import { formatTeacherDate, recentLabel, TeacherMeter, TeacherRecent, teacherSnapshot } from "../shared/teacher.js";
import { StoreController } from "./controller.store.js";
import { SuccessEvent } from "./event.success.js";
import { WarningEvent } from "./event.warning.js";
import { backIcon } from "./icons.js";
import { navigate, profileIdFromPath } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.instructor-gate.js";
import "./component.level-badge.js";

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
        width: min(720px, 100%);
        min-width: 0;
        margin: 0 auto;
        padding: 1.1rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
        display: grid;
        gap: 0.9rem;
        align-content: start;
      }

      .hero {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.9rem;
        align-items: center;
        padding: 1rem 1.05rem;
        border-radius: 22px;
        background: radial-gradient(420px 160px at 0% 0%, rgba(232, 184, 74, 0.16), transparent 62%), #1a1713;
        border: 1px solid var(--color-panel-border);
      }

      .ring {
        width: 84px;
        height: 84px;
        border-radius: 50%;
        padding: 4px;
        background: conic-gradient(var(--color-1) calc(var(--progress) * 1%), #2a251e 0);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 1.8rem;
        line-height: 1;
        box-shadow: inset 0 0 0 3px #1a1713;
      }

      .who {
        min-width: 0;
      }

      .who h2 {
        margin: 0 0 0.15rem;
        font-size: 1.45rem;
      }

      .who p {
        margin: 0;
        font-size: 0.88rem;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.5rem;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        background: rgba(232, 184, 74, 0.12);
        border: 1px solid rgba(232, 184, 74, 0.32);
        color: var(--color-1);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .chip.mix {
        color: var(--color-practice);
        background: rgba(90, 166, 232, 0.12);
        border-color: rgba(90, 166, 232, 0.35);
      }

      .chip.boost {
        color: var(--color-warning);
        background: rgba(240, 195, 106, 0.12);
        border-color: rgba(240, 195, 106, 0.35);
      }

      .progress {
        padding: 1.1rem 1.15rem 1.2rem;
        border-radius: 22px;
        background: radial-gradient(480px 180px at 100% 0%, rgba(232, 184, 74, 0.14), transparent 58%), #1a1713;
        border: 1px solid var(--color-panel-border);
      }

      .kicker {
        margin: 0 0 0.35rem;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--color-1);
      }

      .progress-top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.35rem;
      }

      .figure {
        font-size: 2.6rem;
        font-weight: 800;
        letter-spacing: -0.05em;
        line-height: 0.95;
        color: var(--color-1);
      }

      .levels {
        display: grid;
        justify-items: end;
        gap: 0.1rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--color-primary-text-muted);
        padding-bottom: 0.2rem;
      }

      .levels b {
        color: var(--color-primary-text);
        font-size: 0.92rem;
      }

      .progress h3 {
        margin: 0 0 0.35rem;
        font-size: 1.28rem;
        letter-spacing: -0.03em;
      }

      .progress .lede {
        margin: 0 0 1rem;
        font-size: 0.92rem;
      }

      .meter {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 0.85rem;
      }

      .meter:last-of-type {
        margin-bottom: 0.55rem;
      }

      .meter-top {
        display: flex;
        justify-content: space-between;
        gap: 0.6rem;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .meter-top span {
        color: var(--color-primary-text-muted);
        font-weight: 600;
      }

      .track {
        height: 10px;
        border-radius: 999px;
        background: #2a251e;
        overflow: hidden;
      }

      .track > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--color-1), #f3d27a);
      }

      .note {
        margin: 0.15rem 0 0;
        font-size: 0.82rem;
        line-height: 1.4;
      }

      .now {
        padding: 0.95rem 1.05rem 1.05rem;
        border-radius: 20px;
        background: #120f0c;
        border: 1px solid var(--color-panel-border);
      }

      .now .prompt {
        margin: 0.15rem 0 0;
        font-family: var(--font-reading);
        font-size: 1.35rem;
        font-weight: 500;
        color: var(--color-primary-text);
        line-height: 1.35;
      }

      .recent {
        display: grid;
        gap: 0.45rem;
      }

      .pills {
        display: grid;
        gap: 0.45rem;
      }

      .pill {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0.55rem 0.75rem;
        border-radius: 14px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        min-width: 0;
      }

      .mark {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-primary-text-muted);
        box-shadow: 0 0 0 3px rgba(138, 129, 117, 0.16);
      }

      .pill.right .mark {
        background: var(--color-success);
        box-shadow: 0 0 0 3px rgba(125, 206, 130, 0.18);
      }

      .pill.wrong .mark {
        background: var(--color-practice);
        box-shadow: 0 0 0 3px rgba(90, 166, 232, 0.18);
      }

      .pill.wayTooEasy .mark {
        background: var(--color-1);
        box-shadow: 0 0 0 3px rgba(232, 184, 74, 0.18);
      }

      .pill .txt {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--font-reading);
        font-weight: 500;
      }

      .pill .kind {
        color: var(--color-primary-text-muted);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.55rem;
      }

      @media (min-width: 640px) {
        .stats {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }
      }

      .stat {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 0.12rem;
        padding: 0.75rem 0.35rem;
        border-radius: 16px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
      }

      .stat b {
        font-size: 1.15rem;
        color: var(--color-primary-text);
      }

      .stat span {
        color: var(--color-primary-text-muted);
        font-size: 0.7rem;
        font-weight: 700;
      }

      .split {
        display: grid;
        gap: 0.9rem;
      }

      @media (min-width: 640px) {
        .split {
          grid-template-columns: 1fr 1fr;
        }
      }

      .panel {
        padding: 1rem 1.05rem;
        border-radius: 20px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
      }

      .panel h3 {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
      }

      .row {
        display: flex;
        justify-content: space-between;
        gap: 0.8rem;
        padding: 0.42rem 0;
        border-bottom: 1px solid rgba(244, 234, 213, 0.06);
        font-size: 0.9rem;
      }

      .row:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      .row span {
        color: var(--color-primary-text-muted);
      }

      .row b {
        font-weight: 800;
        text-align: right;
      }

      .admin {
        display: grid;
        gap: 0.55rem;
      }

      .admin input {
        font-size: 1.05rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }
    `,
  ];

  @state() private profileId = "";
  @state() private name = "";

  constructor() {
    super();
    new StoreController(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.profileId = profileIdFromPath() ?? "";
    const profile = appStore.state.profiles.find((item) => item.id === this.profileId);
    this.name = profile?.name ?? "";
    if (!profile) {
      navigate("settings");
    }
  }

  override render(): TemplateResult {
    const profile = appStore.state.profiles.find((item) => item.id === this.profileId);
    if (!profile) {
      return html`
        <div class="page"><p>No profile found.</p></div>
      `;
    }
    const snap = teacherSnapshot(profile, appStore.state.currentProfileId);
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${this.close}>${backIcon}</button>
          <h1>Teacher view</h1>
        </header>
        <div class="body">
          <reading-bee-instructor-gate>
            <section class="hero">
              <div class="ring" style="--progress:${snap.progressPercent}">
                <div class="avatar" style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}>
                  ${profileInitial(profile.name)}
                </div>
              </div>
              <div class="who">
                <h2>${profile.name}</h2>
                <p>${snap.bandLabel}</p>
                ${
                  snap.tags.length
                    ? html`
                        <div class="chips">${snap.tags.map((tag) => this.chip(tag))}</div>
                      `
                    : ""
                }
              </div>
              <reading-bee-level-badge .level=${profile.level}></reading-bee-level-badge>
            </section>

            <section class="progress">
              <p class="kicker">Next level</p>
              <div class="progress-top">
                <div class="figure">${snap.figure}</div>
                ${
                  snap.atMaxLevel
                    ? ""
                    : html`
                        <div class="levels">
                          <span>Badge ${snap.level}</span>
                          <b>Level ${snap.nextLevel}</b>
                        </div>
                      `
                }
              </div>
              <h3>${snap.headline}</h3>
              <p class="lede">${snap.detail}</p>
              ${snap.meters.map((meter) => this.meter(meter))}
              <p class="note">${snap.note}</p>
            </section>

            ${
              snap.currentText
                ? html`
                    <section class="now">
                      <p class="kicker">Now reading</p>
                      <p class="prompt">${snap.currentText}</p>
                    </section>
                  `
                : ""
            }
            ${
              snap.recent.length
                ? html`
                    <section class="panel recent">
                      <h3>Recent answers</h3>
                      <div class="pills">${snap.recent.map((item) => this.recent(item))}</div>
                    </section>
                  `
                : ""
            }

            <section class="stats">
              ${this.stat(snap.stats.read, "Texts")} ${this.stat(snap.stats.right, "Right")}
              ${this.stat(snap.stats.wrong, "Wrong")} ${this.stat(snap.stats.skip, "Skipped")}
              ${this.stat(snap.stats.wayTooEasy, "Easy")} ${this.stat(snap.stats.accuracy, "Accuracy")}
            </section>

            <div class="split">
              <section class="panel">
                <h3>Learning</h3>
                <div class="row">
                  <span>Badge level</span>
                  <b>${snap.level}</b>
                </div>
                <div class="row">
                  <span>Working level</span>
                  <b>${snap.workingLevel}</b>
                </div>
                <div class="row">
                  <span>Best streak</span>
                  <b>${snap.maxCorrectStreak}</b>
                </div>
                <div class="row">
                  <span>Mastered texts</span>
                  <b>${snap.mastered}</b>
                </div>
                <div class="row">
                  <span>Support mix</span>
                  <b>
                    ${snap.reviewMode ? `On · ${snap.wrongStreak} miss${snap.wrongStreak === 1 ? "" : "es"}` : "Off"}
                  </b>
                </div>
                <div class="row">
                  <span>Boost</span>
                  <b>${snap.boostActive ? `On · level ${snap.workingLevel}` : "Off"}</b>
                </div>
              </section>
              <section class="panel">
                <h3>Rewards & activity</h3>
                <div class="row">
                  <span>Coins on hand</span>
                  <b>${snap.coins}</b>
                </div>
                <div class="row">
                  <span>Coins earned</span>
                  <b>${snap.coinsEarned}</b>
                </div>
                <div class="row">
                  <span>Peak in bank</span>
                  <b>${snap.peakCoins}</b>
                </div>
                <div class="row">
                  <span>Coins spent</span>
                  <b>${snap.spent}</b>
                </div>
                <div class="row">
                  <span>Shop items</span>
                  <b>${snap.items}</b>
                </div>
                <div class="row">
                  <span>Achievements</span>
                  <b>${snap.achievements} / ${snap.achievementTotal}</b>
                </div>
                <div class="row">
                  <span>Today</span>
                  <b>${snap.readsToday} read${snap.readsToday === 1 ? "" : "s"}</b>
                </div>
                <div class="row">
                  <span>This week</span>
                  <b>${snap.readsWeek}</b>
                </div>
                <div class="row">
                  <span>Last active</span>
                  <b>${snap.lastActiveAt ? formatTeacherDate(snap.lastActiveAt) : "Not yet"}</b>
                </div>
                <div class="row">
                  <span>Added</span>
                  <b>${formatTeacherDate(snap.createdAt)}</b>
                </div>
              </section>
            </div>

            <section class="panel admin">
              <h3>Teacher tools</h3>
              <input
                type="text"
                maxlength="40"
                aria-label="Student name"
                .value=${this.name}
                @input=${this.onName}
                @keydown=${this.onKey} />
              <div class="actions">
                <button class="ghost-btn" @click=${this.saveName}>Save name</button>
                ${
                  snap.isCurrent
                    ? html`
                        <button class="primary-btn" @click=${() => navigate("reading")}>Back to reading</button>
                      `
                    : html`
                        <button class="primary-btn" @click=${this.useProfile}>Use this profile</button>
                      `
                }
              </div>
            </section>
          </reading-bee-instructor-gate>
        </div>
      </div>
    `;
  }

  private chip(tag: string): TemplateResult {
    const kind = tag === "Support mix" ? "mix" : tag === "Boost" ? "boost" : "";
    return html`
      <span class="chip ${kind}">${tag}</span>
    `;
  }

  private meter(meter: TeacherMeter): TemplateResult {
    const percent = Math.min(100, Math.round((meter.value / meter.max) * 100));
    return html`
      <div class="meter">
        <div class="meter-top">
          <strong>${meter.label}</strong>
          <span>${meter.value} / ${meter.max}</span>
        </div>
        <div class="track"><span style="width:${percent}%"></span></div>
      </div>
    `;
  }

  private recent(item: TeacherRecent): TemplateResult {
    return html`
      <div class="pill ${item.result}">
        <span class="mark"></span>
        <span class="txt">${item.text}</span>
        <span class="kind">${recentLabel(item.result)}</span>
      </div>
    `;
  }

  private stat(value: number | string, label: string): TemplateResult {
    return html`
      <div class="stat">
        <b>${value}</b>
        <span>${label}</span>
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
      this.saveName();
    }
  };

  private saveName = (): void => {
    if (!this.name.trim()) {
      dispatch(this, WarningEvent("Enter a name"));
      return;
    }
    if (!this.profileId) return;
    appStore.renameProfile(this.profileId, this.name);
    dispatch(this, SuccessEvent("Name updated"));
  };

  private useProfile = (): void => {
    if (!this.profileId) return;
    appStore.switchProfile(this.profileId);
    navigate("reading");
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-edit-profile": ReadingBeeEditProfile;
  }
}
