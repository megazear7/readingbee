import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { xIcon } from "./icons.js";
import { globalStyles } from "./styles.global.js";
import z from "zod";

export const ToastType = z.enum(["error", "warning", "success", "info"]);
export type ToastType = z.infer<typeof ToastType>;

@customElement("reading-bee-toast")
export class ReadingBeeToast extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        position: fixed;
        top: calc(var(--size-large) + env(safe-area-inset-top));
        right: var(--size-large);
        z-index: 10000;
        display: none;
        max-width: min(90vw, 360px);
        padding: 0.9rem 1rem;
        border-radius: 16px;
        box-shadow: var(--shadow-active);
        color: var(--color-primary-text);
        font-size: var(--font-small);
      }

      :host([visible]) {
        display: block;
      }

      :host([type="error"]) {
        background-color: var(--color-error);
      }

      :host([type="warning"]) {
        background-color: var(--color-warning);
        color: #1a1408;
      }

      :host([type="success"]) {
        background-color: var(--color-success);
        color: #102012;
      }

      :host([type="info"]) {
        background-color: var(--color-secondary-surface);
        border: 1px solid var(--color-panel-border);
      }

      .toast-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .close-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        color: inherit;
        opacity: 0.7;
      }
    `,
  ];

  @property({ type: String }) message = "";
  @property({ type: String, reflect: true }) type: ToastType = "info";
  @property({ type: Boolean, reflect: true }) visible = false;

  override render(): TemplateResult {
    return html`
      <div class="toast-content">
        <div>${this.message}</div>
        <button class="close-button" aria-label="Dismiss" @click=${this.handleClose}>${xIcon}</button>
      </div>
    `;
  }

  show(message: string, type: ToastType, duration: number = 4000): void {
    this.message = message;
    this.type = type;
    this.visible = true;
    setTimeout(() => {
      this.visible = false;
    }, duration);
  }

  private handleClose(): void {
    this.visible = false;
  }
}
