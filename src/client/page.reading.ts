import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { avatarStyle, profileInitial } from "../shared/colors.js";
import { ReadingText, ResultKind } from "../shared/type.app.js";
import { StoreController } from "./controller.store.js";
import { checkIcon, gearIcon, xIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
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

      .screen {
        min-height: 100dvh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        padding: calc(0.7rem + env(safe-area-inset-top)) 1.2rem calc(2.4rem + env(safe-area-inset-bottom));
      }

      header {
        display: flex;
        justify-content: flex-end;
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
      }

      .icon-btn {
        color: var(--color-primary-text-muted);
        opacity: 0.72;
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
      }

      .muted:hover {
        opacity: 0.9;
      }

      .icon-btn svg {
        width: 22px;
        height: 22px;
      }
    `,
  ];

  @state() private outgoing: ReadingText | null = null;
  private locked = false;

  constructor() {
    super();
    new StoreController(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
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
      <div class="screen">
        <header>
          <button class="icon-btn" aria-label="Settings" @click=${this.openSettings}>${gearIcon}</button>
          <reading-bee-profile-modal>
            <button
              slot="open-button"
              class="avatar"
              aria-label="Profile"
              style=${avatarStyle(profile.primaryColor, profile.secondaryColor)}>
              ${profileInitial(profile.name)}
            </button>
          </reading-bee-profile-modal>
        </header>
        <div class="stage">
          <div class="prompt ${this.outgoing ? "enter" : ""}" data-kind=${text.kind}>${text.text}</div>
          ${
            this.outgoing
              ? html`
                  <div class="prompt leave" data-kind=${this.outgoing.kind}>${this.outgoing.text}</div>
                `
              : ""
          }
        </div>
        <footer>
          <div class="action">
            <button class="score-btn yes" aria-label="Correct" @click=${() => this.record("right")}>
              ${checkIcon}
            </button>
            <button class="muted" @click=${() => this.record("wayTooEasy")}>Way too easy</button>
          </div>
          <div class="action">
            <button class="score-btn no" aria-label="Incorrect" @click=${() => this.record("wrong")}>${xIcon}</button>
            <button class="muted" @click=${() => this.record("skip")}>Skip</button>
          </div>
        </footer>
      </div>
    `;
  }

  private openSettings = (): void => {
    navigate("settings");
  };

  private record(result: ResultKind): void {
    if (this.locked) return;
    const current = appStore.currentText;
    if (!current) return;
    this.locked = true;
    this.outgoing = current;
    appStore.record(result);
    window.setTimeout(() => {
      this.outgoing = null;
      this.locked = false;
    }, 360);
  }

  private onKey = (event: KeyboardEvent): void => {
    if (document.body.style.overflow === "hidden") {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) {
      return;
    }
    if (event.key === "Enter" || event.key === "c" || event.key === "ArrowRight") {
      this.record("right");
    } else if (event.key === "x" || event.key === "ArrowLeft") {
      this.record("wrong");
    } else if (event.key === "s") {
      this.record("skip");
    } else if (event.key === "e") {
      this.record("wayTooEasy");
    }
  };
}
