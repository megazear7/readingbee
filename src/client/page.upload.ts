import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { AppState } from "../shared/type.app.js";
import { parseAppDataJson } from "../shared/storage.js";
import { ReadingBeeModal } from "./component.modal.js";
import { SuccessEvent } from "./event.success.js";
import { backIcon, uploadIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.instructor-gate.js";
import "./component.modal.js";

@customElement("reading-bee-upload")
export class ReadingBeeUpload extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .page {
        min-height: 100dvh;
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
        margin: 0 auto;
        padding: 1.4rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
        display: grid;
        gap: 1.1rem;
        align-content: start;
      }

      .lede {
        margin: 0;
      }

      .drop {
        display: grid;
        justify-items: center;
        gap: 0.55rem;
        padding: 2.4rem 1.4rem;
        border-radius: 24px;
        border: 2px dashed rgba(244, 234, 213, 0.22);
        background: radial-gradient(circle at 50% 0%, rgba(232, 184, 74, 0.08), transparent 62%), #14110e;
        color: var(--color-primary-text-muted);
        text-align: center;
        cursor: pointer;
        transition:
          border-color 180ms ease,
          background 180ms ease,
          transform 180ms ease;
      }

      .drop:hover,
      .drop.dragging {
        border-color: var(--color-1);
        border-style: solid;
        color: var(--color-primary-text);
        transform: translateY(-1px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
      }

      .drop.ready {
        border-color: var(--color-success);
        border-style: solid;
        color: var(--color-primary-text);
      }

      .drop.error {
        border-color: var(--color-danger);
      }

      .drop-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: rgba(232, 184, 74, 0.12);
        color: var(--color-1);
      }

      .drop-icon svg {
        width: 26px;
        height: 26px;
      }

      .drop strong {
        font-size: 1.1rem;
        color: var(--color-primary-text);
      }

      .browse {
        color: var(--color-1);
        font-weight: 700;
      }

      .file-meta {
        font-size: 0.9rem;
      }

      .hidden {
        display: none;
      }

      h2[slot="title"] {
        margin: 0;
      }

      .confirm {
        display: grid;
        gap: 0.9rem;
      }

      .confirm-row {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
    `,
  ];

  @query("reading-bee-modal") private modal!: ReadingBeeModal;
  @query("input[type='file']") private fileInput!: HTMLInputElement;
  @state() private dragging = false;
  @state() private fileName = "";
  @state() private error = "";
  @state() private parsed: AppState | null = null;
  private dragDepth = 0;

  override render(): TemplateResult {
    const ready = this.parsed !== null;
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${() => navigate("settings")}>${backIcon}</button>
          <h1>Upload</h1>
        </header>
        <div class="body">
          <reading-bee-instructor-gate>
            <p class="lede">Restore a Reading Bee backup. This will replace the data on this device.</p>
            <button
              class="drop ${this.dragging ? "dragging" : ""} ${ready ? "ready" : ""} ${this.error ? "error" : ""}"
              @click=${this.openPicker}
              @dragenter=${this.onDragEnter}
              @dragover=${this.onDragOver}
              @dragleave=${this.onDragLeave}
              @drop=${this.onDrop}>
              <span class="drop-icon">${uploadIcon}</span>
              ${
                ready
                  ? html`
                      <strong>${this.fileName}</strong>
                      <span class="file-meta">
                        ${this.parsed!.profiles.length} profile${this.parsed!.profiles.length === 1 ? "" : "s"} ready to
                        restore
                      </span>
                      <span class="browse">Choose a different file</span>
                    `
                  : html`
                      <strong>Drop your backup here</strong>
                      <span>JSON files from Reading Bee Download</span>
                      <span class="browse">or click to browse</span>
                    `
              }
            </button>
            ${
              this.error
                ? html`
                    <p class="lede" style="color: var(--color-danger)">${this.error}</p>
                  `
                : ""
            }
            <button class="primary-btn" ?disabled=${!ready} @click=${this.openConfirm}>Submit</button>
            <input class="hidden" type="file" accept="application/json,.json" @change=${this.onFileInput} />
          </reading-bee-instructor-gate>
        </div>
        <reading-bee-modal>
          <h2 slot="title">Replace all app data?</h2>
          <div slot="body" class="confirm">
            <p>
              This will permanently replace every profile, result, and setting on this device with the uploaded backup.
              This cannot be undone.
            </p>
            <div class="confirm-row">
              <button class="ghost-btn" @click=${() => this.modal.close()}>Cancel</button>
              <button class="danger-btn" @click=${this.confirmImport}>Replace data</button>
            </div>
          </div>
        </reading-bee-modal>
      </div>
    `;
  }

  private openPicker = (): void => {
    this.fileInput.click();
  };

  private onDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth += 1;
    this.dragging = true;
  };

  private onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  };

  private onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragging = false;
    }
  };

  private onDrop = (event: DragEvent): void => {
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      void this.readFile(file);
    }
  };

  private onFileInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.readFile(file);
    }
    input.value = "";
  };

  private async readFile(file: File): Promise<void> {
    this.error = "";
    this.parsed = null;
    this.fileName = file.name;
    try {
      const text = await file.text();
      this.parsed = parseAppDataJson(text);
    } catch {
      this.error = "This file is not a valid Reading Bee backup.";
    }
  }

  private openConfirm = (): void => {
    if (!this.parsed) return;
    void this.modal.open();
  };

  private confirmImport = async (): Promise<void> => {
    if (!this.parsed) return;
    await this.modal.close();
    appStore.importState(this.parsed);
    dispatch(this, SuccessEvent("Backup restored"));
    navigate("reading");
  };
}
