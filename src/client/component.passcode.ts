import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { PASSCODE_LENGTH } from "../shared/type.app.js";
import { globalStyles } from "./styles.global.js";

@customElement("reading-bee-passcode")
export class ReadingBeePasscode extends LitElement {
  static override styles = [
    globalStyles,
    css`
      .wrap {
        display: grid;
        gap: 1rem;
        justify-items: center;
      }

      .dots {
        display: flex;
        gap: 0.7rem;
      }

      .dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid rgba(244, 234, 213, 0.35);
        background: transparent;
        transition: var(--transition-all);
      }

      .dot.filled {
        background: var(--color-1);
        border-color: var(--color-1);
      }

      .error .dot {
        border-color: var(--color-error);
      }

      .pad {
        display: grid;
        grid-template-columns: repeat(3, 72px);
        gap: 0.7rem;
      }

      .key {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #221e18;
        border: 1px solid var(--color-panel-border);
        font-size: 1.4rem;
        font-weight: 700;
      }

      .key:active {
        transform: scale(0.96);
        background: #2c261f;
      }

      .key.ghost {
        background: transparent;
        border-color: transparent;
        color: var(--color-primary-text-muted);
      }

      .hint {
        margin: 0;
        text-align: center;
      }
    `,
  ];

  @property({ type: String }) override title = "Enter passcode";
  @property({ type: String }) hint = "Instructor passcode";
  @state() private value = "";
  @state() private error = false;

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onKey);
  }

  override render(): TemplateResult {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];
    return html`
      <div class="wrap">
        <h2>${this.title}</h2>
        <p class="hint">${this.hint}</p>
        <div class="dots ${this.error ? "error" : ""}">
          ${[0, 1, 2, 3].map(
            (index) => html`
              <div class="dot ${index < this.value.length ? "filled" : ""}"></div>
            `,
          )}
        </div>
        <div class="pad">
          ${keys.map((key) => {
            if (key === "clear") {
              return html`
                <button class="key ghost" @click=${this.clear}>Clear</button>
              `;
            }
            if (key === "del") {
              return html`
                <button class="key ghost" @click=${this.backspace}>⌫</button>
              `;
            }
            return html`
              <button class="key" @click=${() => this.press(key)}>${key}</button>
            `;
          })}
        </div>
      </div>
    `;
  }

  shake(): void {
    this.error = true;
    this.value = "";
    setTimeout(() => {
      this.error = false;
    }, 500);
  }

  reset(): void {
    this.value = "";
    this.error = false;
  }

  private clear = (): void => {
    this.value = "";
    this.error = false;
  };

  private backspace = (): void => {
    this.value = this.value.slice(0, -1);
  };

  private onKey = (event: KeyboardEvent): void => {
    if (event.key >= "0" && event.key <= "9") {
      event.preventDefault();
      this.press(event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.backspace();
    } else if (event.key === "Escape") {
      this.clear();
    }
  };

  private press(digit: string): void {
    if (this.value.length >= PASSCODE_LENGTH) return;
    this.value += digit;
    this.error = false;
    if (this.value.length === PASSCODE_LENGTH) {
      this.dispatchEvent(new CustomEvent("complete", { detail: { value: this.value }, bubbles: true, composed: true }));
    }
  }
}
