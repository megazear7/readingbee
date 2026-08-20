import { html, LitElement, TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { SuccessEventName } from "./event.success.js";
import { WarningEventName } from "./event.warning.js";
import { ReadingBeeToast } from "./component.toast.js";
import { appStore } from "./store.js";
import "./component.onboarding.js";
import "./component.toast.js";
import "./page.reading.js";

@customElement("reading-bee-app")
export class ReadingBeeApp extends LitElement {
  @query("reading-bee-toast") private toast!: ReadingBeeToast;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    appStore.addEventListener("change", this.onStoreChange);
    document.addEventListener(WarningEventName.value, this.onWarning);
    document.addEventListener(SuccessEventName.value, this.onSuccess);
    this.registerServiceWorker();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    appStore.removeEventListener("change", this.onStoreChange);
    document.removeEventListener(WarningEventName.value, this.onWarning);
    document.removeEventListener(SuccessEventName.value, this.onSuccess);
  }

  override render(): TemplateResult {
    const ready = Boolean(appStore.currentProfile);
    return html`
      ${
        ready
          ? html`
              <reading-bee-reading></reading-bee-reading>
            `
          : html`
              <reading-bee-onboarding></reading-bee-onboarding>
            `
      }
      <reading-bee-toast></reading-bee-toast>
    `;
  }

  private onStoreChange = (): void => {
    this.requestUpdate();
  };

  private onWarning = (event: Event): void => {
    const customEvent = event as CustomEvent<{ message: string }>;
    this.toast.show(customEvent.detail.message, "warning");
  };

  private onSuccess = (event: Event): void => {
    const customEvent = event as CustomEvent<{ message: string }>;
    this.toast.show(customEvent.detail.message, "success");
  };

  private registerServiceWorker(): void {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-app": ReadingBeeApp;
  }
}
