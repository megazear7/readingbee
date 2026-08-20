import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { wait } from "../shared/util.wait.js";
import { ModelClosingEvent } from "./event.modal-closing.js";
import { ModelOpeningEvent } from "./event.modal-opening.js";
import { xIcon } from "./icons.js";
import { globalStyles } from "./styles.global.js";
import { dispatch, stopProp } from "./util.events.js";

const ANIMATION_SPEED = 280;

@customElement("reading-bee-modal")
export class ReadingBeeModal extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(6, 5, 4, 0.72);
        backdrop-filter: blur(10px);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        display: none;
        padding: 1rem;
      }

      .modal-content {
        background: var(--color-secondary-surface);
        border: 1px solid var(--color-panel-border);
        border-radius: var(--border-radius-large);
        box-shadow: var(--shadow-active);
        width: min(560px, 100%);
        max-height: min(88vh, 880px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      :host([wide]) .modal-content {
        width: min(720px, 100%);
      }

      .modal-body {
        padding: 0 1.4rem 1.4rem;
        overflow-y: auto;
      }

      .modal-header {
        display: flex;
        justify-content: flex-end;
        padding: 0.7rem 0.7rem 0;
      }

      .close-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: var(--color-primary-text-muted);
        display: grid;
        place-items: center;
      }

      .close-button svg {
        width: 18px;
        height: 18px;
      }

      .close-button:hover {
        color: var(--color-error);
        background: rgba(232, 93, 76, 0.08);
      }

      .modal-backdrop.visible,
      .modal-backdrop.opening {
        display: flex;
      }

      .modal-backdrop.opening .modal-content {
        animation: slideDown ${ANIMATION_SPEED}ms forwards;
      }

      .modal-backdrop.closing .modal-content {
        animation: slideDown ${ANIMATION_SPEED}ms reverse;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-16px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ];

  @property({ type: Boolean }) visible = false;
  @property({ type: Boolean }) opening = false;
  @property({ type: Boolean }) closing = false;
  @property({ type: Boolean, reflect: true }) wide = false;

  override render(): TemplateResult {
    return html`
      <slot name="open-button" @click=${this.openHandler()}></slot>
      <div class="${this.backdropClasses()}" @click=${this.closeHandler()}>
        <div class="modal-content" @click=${stopProp}>
          <div class="modal-header">
            <button class="close-button" aria-label="Close" @click=${this.closeHandler()}>${xIcon}</button>
          </div>
          <div class="modal-body">
            <slot name="body"></slot>
          </div>
        </div>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  backdropClasses(): ReturnType<typeof classMap> {
    return classMap({
      "modal-backdrop": true,
      opening: this.opening,
      closing: this.closing,
      visible: this.visible,
    });
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && (this.visible || this.opening)) {
      void this.close();
    }
  };

  private openHandler(): () => void {
    return () => {
      void this.open();
    };
  }

  async open(): Promise<void> {
    this.opening = true;
    dispatch(this, ModelOpeningEvent());
    await wait(ANIMATION_SPEED);
    this.opening = false;
    this.visible = true;
    window.document.body.style.overflow = "hidden";
  }

  private closeHandler(): () => void {
    return (): void => {
      void this.close();
    };
  }

  async close(): Promise<void> {
    if (!this.visible && !this.opening) return;
    this.closing = true;
    dispatch(this, ModelClosingEvent());
    await wait(ANIMATION_SPEED);
    this.closing = false;
    this.visible = false;
    window.document.body.style.overflow = "auto";
  }
}
