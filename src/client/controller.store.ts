import { ReactiveController, ReactiveControllerHost } from "lit";
import { appStore } from "./store.js";

export class StoreController implements ReactiveController {
  private readonly host: ReactiveControllerHost;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected(): void {
    appStore.addEventListener("change", this.onChange);
  }

  hostDisconnected(): void {
    appStore.removeEventListener("change", this.onChange);
  }

  private onChange = (): void => {
    this.host.requestUpdate();
  };
}
