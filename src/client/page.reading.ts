import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { avatarStyle, profileInitial } from "../shared/colors.js";
import { pictureFor } from "../shared/letter-pictures.js";
import { ReadingText, ResultKind } from "../shared/type.app.js";
import { StoreController } from "./controller.store.js";
import { checkIcon, gearIcon, xIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import "./component.coin-flight.js";
import "./component.level-badge.js";
import "./component.level-up.js";
import "./component.profile-modal.js";

@customElement("reading-bee-reading")
export class ReadingBeeReading extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .screen.is-celebrating header {
        pointer-events: none;
      }

      .screen {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: calc(0.7rem + env(safe-area-inset-top)) 1.2rem calc(2.4rem + env(safe-area-inset-bottom));
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.55rem;
        position: relative;
        z-index: 30;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 0.55rem;
      }

      .icon-btn,
      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: grid;
        place-items: center;
      }

      .avatar {
        font-weight: 700;
        font-size: 1.05rem;
        line-height: 1;
        letter-spacing: 0;
        box-shadow: 0 0 0 3px transparent;
        transition:
          box-shadow var(--time-normal) ease,
          transform var(--time-normal) ease;
      }

      .avatar:hover {
        transform: scale(1.08);
        box-shadow: 0 0 0 3px var(--color-1);
      }

      .coins {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 36px;
        padding: 0.15rem 0.65rem 0.15rem 0.3rem;
        border-radius: 999px;
        background: #1a1713;
        border: 1px solid rgba(232, 184, 74, 0.35);
        color: var(--color-1);
        font-weight: 800;
        transition:
          transform var(--time-normal) ease,
          border-color var(--time-normal) ease;
      }

      .coins:hover {
        transform: scale(1.06);
        border-color: var(--color-1);
      }

      .coin-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff6c8, #e8b84a 58%, #9a6c1e);
        box-shadow: inset 0 0 0 1px rgba(255, 246, 200, 0.4);
      }

      .icon-btn {
        color: var(--color-primary-text-muted);
        opacity: 0.72;
        transition:
          opacity var(--time-normal) ease,
          color var(--time-normal) ease;
      }

      .icon-btn:hover {
        opacity: 1;
        color: var(--color-primary-text);
      }

      .stage {
        display: grid;
        place-items: center;
        padding: 1rem;
        overflow: hidden;
        width: 100%;
      }

      .prompt {
        grid-area: 1 / 1;
        font-family: var(--font-reading);
        font-weight: 500;
        text-align: center;
        line-height: 1.35;
        letter-spacing: 0.01em;
        max-width: 18ch;
        text-wrap: pretty;
        display: grid;
        justify-items: center;
        align-content: center;
        gap: 0.75rem;
      }

      .prompt.has-picture {
        max-width: min(16rem, 72vw);
      }

      .glyph {
        display: block;
      }

      .picture {
        width: min(42vw, 176px);
        height: min(42vw, 176px);
        object-fit: contain;
        filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.38));
      }

      .prompt[data-kind="letter"] {
        font-size: clamp(3.4rem, 14vw, 6.2rem);
        max-width: 8ch;
        letter-spacing: 0.04em;
      }

      .prompt[data-kind="letter"].has-picture {
        font-size: clamp(2.4rem, 9vw, 4.2rem);
        max-width: min(16rem, 72vw);
      }

      .prompt[data-kind="word"] {
        font-size: clamp(2.4rem, 8vw, 4.6rem);
        max-width: 12ch;
      }

      .prompt[data-kind="phrase"] {
        font-size: clamp(1.8rem, 6vw, 3.2rem);
        max-width: 16ch;
      }

      .prompt[data-kind="sentence"] {
        font-size: clamp(1.45rem, 4.6vw, 2.4rem);
        max-width: 24ch;
      }

      .prompt[data-kind="book"] {
        font-size: clamp(1.2rem, 3.4vw, 1.85rem);
        max-width: 32ch;
        line-height: 1.5;
      }

      .prompt.leave {
        animation: slideOutLeft 360ms ease forwards;
        pointer-events: none;
      }

      .prompt.enter {
        animation: slideInRight 360ms ease forwards;
      }

      @keyframes slideOutLeft {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-48vw);
        }
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(48vw);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .prompt.leave,
        .prompt.enter {
          animation: none;
        }
      }

      footer {
        display: flex;
        justify-content: center;
        gap: 1.4rem;
      }

      .action {
        display: grid;
        justify-items: center;
        gap: 0.85rem;
        min-width: 88px;
      }

      .score-btn {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        transition: var(--transition-all);
      }

      .yes {
        background: rgba(125, 206, 130, 0.14);
        color: var(--color-success);
        box-shadow:
          0 0 0 1px rgba(125, 206, 130, 0.25),
          0 10px 30px rgba(125, 206, 130, 0.08);
      }

      .no {
        background: rgba(232, 93, 76, 0.12);
        color: var(--color-error);
        box-shadow:
          0 0 0 1px rgba(232, 93, 76, 0.25),
          0 10px 30px rgba(232, 93, 76, 0.08);
      }

      .score-btn:hover {
        transform: translateY(-2px) scale(1.02);
      }

      .score-btn:active {
        transform: scale(0.96);
      }

      .score-btn svg {
        width: 36px;
        height: 36px;
      }

      .muted {
        color: var(--color-primary-text-muted);
        opacity: 0.55;
        font-size: 0.92rem;
        letter-spacing: 0.02em;
        text-align: center;
        line-height: 1.2;
        white-space: nowrap;
        transition:
          opacity var(--time-normal) ease,
          color var(--time-normal) ease;
      }

      .muted:hover {
        opacity: 0.9;
      }

      .ripple {
        position: fixed;
        width: 88px;
        height: 88px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 8;
        transform: translate(-50%, -50%) scale(1);
        animation: scoreRipple 560ms ease-out forwards;
      }

      .ripple.yes {
        background: radial-gradient(
          circle,
          rgba(125, 206, 130, 0.42) 0%,
          rgba(125, 206, 130, 0.12) 42%,
          transparent 70%
        );
        box-shadow: 0 0 0 3px rgba(125, 206, 130, 0.45);
      }

      .ripple.no {
        background: radial-gradient(circle, rgba(232, 93, 76, 0.4) 0%, rgba(232, 93, 76, 0.12) 42%, transparent 70%);
        box-shadow: 0 0 0 3px rgba(232, 93, 76, 0.45);
      }

      @keyframes scoreRipple {
        0% {
          opacity: 0.95;
          transform: translate(-50%, -50%) scale(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2.6);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ripple {
          animation: none;
        }
      }

      .icon-btn svg {
        width: 22px;
        height: 22px;
      }
    `,
  ];

  @state() private outgoing: ReadingText | null = null;
  @state() private ripples: { id: number; kind: "yes" | "no"; x: number; y: number }[] = [];
  @state() private celebrating = false;
  @state() private celebrateLevel = 1;
  @state() private badgeX = 0;
  @state() private badgeY = 0;
  @state() private flyingCoin = false;
  @state() private coinOriginX = 0;
  @state() private coinOriginY = 0;
  @state() private coinTargetX = 0;
  @state() private coinTargetY = 0;
  @state() private outgoingPicture: string | undefined;
  private locked = false;
  private pendingLevelUp = 0;
  private rippleSeq = 0;

  constructor() {
    super();
    new StoreController(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    appStore.lockInstructor();
    window.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onKey);
  }

  override render(): TemplateResult {
    const profile = appStore.currentProfile;
    const text = appStore.currentText;
    if (!profile || !text) {
      return html`
        <div class="screen"><p>No reading text available.</p></div>
      `;
    }
    return html`
      <div class="screen ${this.celebrating ? "is-celebrating" : ""}">
        <header>
          <button class="icon-btn" aria-label="Settings" @click=${this.openSettings}>${gearIcon}</button>
          <div class="header-right">
            <reading-bee-level-badge .level=${profile.level}></reading-bee-level-badge>
            <button class="coins" aria-label="Shop" @click=${() => navigate("shop")}>
              <span class="coin-dot"></span>
              ${profile.coins}
            </button>
            <reading-bee-profile-modal>
              <button
                slot="open-button"
                class="avatar"
                aria-label="Profile"
                style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}>
                ${profileInitial(profile.name)}
              </button>
            </reading-bee-profile-modal>
          </div>
        </header>
        <div class="stage">
          ${this.promptView(text, this.outgoing ? "enter" : "")}
          ${this.outgoing ? this.promptView(this.outgoing, "leave") : ""}
        </div>
        <footer>
          <div class="action">
            <button class="score-btn yes" aria-label="Correct" @click=${(event: Event) => this.record("right", event)}>
              ${checkIcon}
            </button>
            <button class="muted" @click=${() => this.record("wayTooEasy")}>Way too easy</button>
          </div>
          <div class="action">
            <button class="score-btn no" aria-label="Incorrect" @click=${(event: Event) => this.record("wrong", event)}>
              ${xIcon}
            </button>
            <button class="muted" @click=${() => this.record("skip")}>Skip</button>
          </div>
        </footer>
        ${this.ripples.map(
          (ripple) => html`
            <span class="ripple ${ripple.kind}" style="left:${ripple.x}px;top:${ripple.y}px"></span>
          `,
        )}
        ${
          this.flyingCoin
            ? html`
                <reading-bee-coin-flight
                  .originX=${this.coinOriginX}
                  .originY=${this.coinOriginY}
                  .targetX=${this.coinTargetX}
                  .targetY=${this.coinTargetY}
                  @done=${this.onCoinDone}></reading-bee-coin-flight>
              `
            : ""
        }
        ${
          this.celebrating
            ? html`
                <reading-bee-level-up
                  .level=${this.celebrateLevel}
                  .originX=${this.badgeX}
                  .originY=${this.badgeY}
                  @done=${this.onCelebrateDone}></reading-bee-level-up>
              `
            : ""
        }
      </div>
    `;
  }

  private promptView(text: ReadingText, extraClass: string): TemplateResult {
    const picture =
      extraClass === "leave" ? this.outgoingPicture : pictureFor(text, appStore.currentProfile ?? undefined);
    return html`
      <div class="prompt ${extraClass} ${picture ? "has-picture" : ""}" data-kind=${text.kind}>
        <span class="glyph">${text.text}</span>
        ${
          picture
            ? html`
                <img class="picture" src=${picture} alt="" aria-hidden="true" decoding="async" fetchpriority="high" />
              `
            : ""
        }
      </div>
    `;
  }

  private openSettings = (): void => {
    appStore.lockInstructor();
    navigate("settings");
  };

  private record(result: ResultKind, event?: Event): void {
    if (this.locked || this.celebrating) return;
    const current = appStore.currentText;
    if (!current) return;
    if (result === "right" || result === "wrong") {
      this.spawnRipple(result === "right" ? "yes" : "no", event);
    }
    const previousLevel = appStore.currentProfile?.level ?? 0;
    this.locked = true;
    this.outgoingPicture = pictureFor(current, appStore.currentProfile ?? undefined);
    this.outgoing = current;
    const { awardedCoin } = appStore.record(result);
    if (awardedCoin && !this.flyingCoin) {
      this.startCoinFlight(event);
    }
    const nextLevel = appStore.currentProfile?.level ?? 0;
    this.pendingLevelUp = nextLevel > previousLevel ? nextLevel : 0;
    window.setTimeout(() => {
      this.outgoing = null;
      this.outgoingPicture = undefined;
      if (this.pendingLevelUp) {
        this.startCelebration(this.pendingLevelUp);
        this.pendingLevelUp = 0;
      } else {
        this.locked = false;
      }
    }, 360);
  }

  private startCelebration(level: number): void {
    const badge = this.renderRoot.querySelector("reading-bee-level-badge");
    if (badge instanceof HTMLElement) {
      const rect = badge.getBoundingClientRect();
      this.badgeX = rect.left + rect.width / 2;
      this.badgeY = rect.top + rect.height / 2;
    }
    this.celebrateLevel = level;
    this.celebrating = true;
  }

  private onCelebrateDone = (): void => {
    this.celebrating = false;
    this.locked = false;
  };

  private startCoinFlight(event?: Event): void {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const source =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget
        : this.renderRoot.querySelector(".score-btn.yes");
    const target = this.renderRoot.querySelector(".coins");
    if (source instanceof HTMLElement) {
      const rect = source.getBoundingClientRect();
      this.coinOriginX = rect.left + rect.width / 2;
      this.coinOriginY = rect.top + rect.height / 2;
    }
    if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      this.coinTargetX = rect.left + 14;
      this.coinTargetY = rect.top + rect.height / 2;
    } else {
      this.coinTargetX = window.innerWidth - 120;
      this.coinTargetY = 36;
    }
    this.flyingCoin = true;
  }

  private onCoinDone = (): void => {
    this.flyingCoin = false;
  };

  private spawnRipple(kind: "yes" | "no", event?: Event): void {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const source =
      event?.currentTarget instanceof HTMLElement
        ? event.currentTarget
        : this.renderRoot.querySelector(kind === "yes" ? ".score-btn.yes" : ".score-btn.no");
    if (!(source instanceof HTMLElement)) {
      return;
    }
    const rect = source.getBoundingClientRect();
    const id = ++this.rippleSeq;
    this.ripples = [...this.ripples, { id, kind, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }];
    window.setTimeout(() => {
      this.ripples = this.ripples.filter((ripple) => ripple.id !== id);
    }, 560);
  }

  private onKey = (event: KeyboardEvent): void => {
    if (document.body.style.overflow === "hidden") {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
      return;
    }
    if (event.key === "Enter" || event.key === "c" || event.key === "ArrowLeft") {
      this.record("right");
    } else if (event.key === "x" || event.key === "ArrowRight") {
      this.record("wrong");
    } else if (event.key === "s") {
      this.record("skip");
    } else if (event.key === "e") {
      this.record("wayTooEasy");
    }
  };
}
