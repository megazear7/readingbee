import { html, LitElement, TemplateResult } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { ReadingBeeToast } from "./component.toast.js";
import { SuccessEventName } from "./event.success.js";
import { AppView } from "./event.view.js";
import { pathForView, viewFromPath } from "./nav.js";
import { WarningEventName } from "./event.warning.js";
import { appStore } from "./store.js";
import "./component.onboarding.js";
import "./component.toast.js";
import "./page.reading.js";
import "./page.settings.js";

@customElement("reading-bee-app")
export class ReadingBeeApp extends LitElement {
  @query("reading-bee-toast") private toast!: ReadingBeeToast;
  @state() private view: AppView = viewFromPath();

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    appStore.addEventListener("change", this.onStoreChange);
    document.addEventListener(WarningEventName.value, this.onWarning);
    document.addEventListener(SuccessEventName.value, this.onSuccess);
    window.addEventListener("popstate", this.onPopState);
    this.registerServiceWorker();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    appStore.removeEventListener("change", this.onStoreChange);
    document.removeEventListener(WarningEventName.value, this.onWarning);
    document.removeEventListener(SuccessEventName.value, this.onSuccess);
    window.removeEventListener("popstate", this.onPopState);
  }

  override render(): TemplateResult {
    const ready = Boolean(appStore.currentProfile);
    const page = !ready
      ? html`
          <reading-bee-onboarding></reading-bee-onboarding>
        `
      : this.view === "settings"
        ? html`
            <reading-bee-settings></reading-bee-settings>
          `
        : html`
            <reading-bee-reading></reading-bee-reading>
          `;
    return html`
      ${page}
      <reading-bee-toast></reading-bee-toast>
    `;
  }

  private onStoreChange = (): void => {
    if (!appStore.currentProfile && this.view === "settings") {
      const path = pathForView("reading");
      if (window.location.pathname !== path) {
        window.history.replaceState({ view: "reading" }, "", path);
      }
      this.view = "reading";
    }
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

  private onPopState = (): void => {
    this.view = viewFromPath();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "reading-bee-app": ReadingBeeApp;
  }
}
