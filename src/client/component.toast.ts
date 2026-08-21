import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { wait } from "../shared/util.wait.js";
import { xIcon } from "./icons.js";
import { globalStyles } from "./styles.global.js";
import z from "zod";

export const ToastType = z.enum(["error", "warning", "success", "info"]);
export type ToastType = z.infer<typeof ToastType>;

const TOAST_ANIMATION = 280;

@customElement("reading-bee-toast")
export class ReadingBeeToast extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        position: fixed;
        top: calc(4.6rem + env(safe-area-inset-top));
        left: 50%;
        z-index: 10000;
        width: min(calc(100vw - 2rem), 380px);
        padding: 0.85rem 0.85rem 0.85rem 1rem;
        border-radius: 16px;
        background: #1a1713;
        color: var(--color-primary-text);
        font-size: 0.95rem;
        line-height: 1.35;
        font-weight: 700;
        box-shadow: var(--shadow-active);
        border: 1px solid var(--color-panel-border);
        border-left-width: 4px;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translate(-50%, -10px);
        transition:
          opacity var(--time-normal) ease,
          transform var(--time-normal) ease,
          visibility var(--time-normal) ease;
      }

      :host([visible]) {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transform: translate(-50%, 0);
      }

      :host([closing]) {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translate(-50%, -10px);
      }

      :host([type="error"]) {
        border-left-color: var(--color-error);
        background: linear-gradient(90deg, rgba(232, 93, 76, 0.14), #1a1713 28%);
      }

      :host([type="warning"]) {
        border-left-color: var(--color-warning);
        background: linear-gradient(90deg, rgba(240, 195, 106, 0.16), #1a1713 28%);
      }

      :host([type="success"]) {
        border-left-color: var(--color-success);
        background: linear-gradient(90deg, rgba(125, 206, 130, 0.16), #1a1713 28%);
      }

      :host([type="info"]) {
        border-left-color: var(--color-1);
      }

      .toast-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .close-button {
        width: 32px;
        height: 32px;
        flex: 0 0 auto;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--color-primary-text-muted);
        transition:
          color var(--time-normal) ease,
          background var(--time-normal) ease;
      }

      .close-button svg {
        width: 14px;
        height: 14px;
      }

      .close-button:hover {
        color: var(--color-primary-text);
        background: rgba(244, 234, 213, 0.08);
      }

      @media (prefers-reduced-motion: reduce) {
        :host {
          transform: translate(-50%, 0);
          transition:
            opacity var(--time-normal) ease,
            visibility var(--time-normal) ease;
        }
      }
    `,
  ];

  @property({ type: String }) message = "";
  @property({ type: String, reflect: true }) type: ToastType = "info";
  @property({ type: Boolean, reflect: true }) visible = false;
  @property({ type: Boolean, reflect: true }) closing = false;
  private hideTimer: number | undefined;
  private showGeneration = 0;

  override render(): TemplateResult {
    return html`
      <div class="toast-content">
        <div>${this.message}</div>
        <button class="close-button" aria-label="Dismiss" @click=${this.handleClose}>${xIcon}</button>
      </div>
    `;
  }

  show(message: string, type: ToastType, duration?: number): void {
    window.clearTimeout(this.hideTimer);
    this.showGeneration += 1;
    this.message = message;
    this.type = type;
    this.closing = false;
    this.visible = true;
    const hold = duration ?? (type === "warning" || type === "error" ? 4500 : 2800);
    this.hideTimer = window.setTimeout(() => {
      void this.dismiss();
    }, hold);
  }

  private handleClose(): void {
    void this.dismiss();
  }

  private async dismiss(): Promise<void> {
    if (!this.visible || this.closing) return;
    window.clearTimeout(this.hideTimer);
    const generation = this.showGeneration;
    this.closing = true;
    await wait(TOAST_ANIMATION);
    if (generation !== this.showGeneration) return;
    this.visible = false;
    this.closing = false;
  }
}
