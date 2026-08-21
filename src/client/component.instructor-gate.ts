import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { StoreController } from "./controller.store.js";
import { SuccessEvent } from "./event.success.js";
import { ReadingBeePasscode } from "./component.passcode.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { dispatch } from "./util.events.js";
import "./component.passcode.js";

@customElement("reading-bee-instructor-gate")
export class ReadingBeeInstructorGate extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: contents;
      }

      slot {
        display: contents;
      }

      .gate {
        min-height: 60dvh;
        width: 100%;
        display: grid;
        place-items: center;
      }
    `,
  ];

  @state() private creating = false;
  @state() private pendingPasscode = "";

  constructor() {
    super();
    new StoreController(this);
  }

  override render(): TemplateResult {
    if (appStore.instructorUnlocked) {
      return html`
        <slot></slot>
      `;
    }
    const creating = this.creating || !appStore.hasPasscode();
    return html`
      <div class="gate">
        <reading-bee-passcode
          title=${creating ? (this.pendingPasscode ? "Confirm passcode" : "Create passcode") : "Enter passcode"}
          hint=${creating ? "This passcode unlocks settings and profile switching" : "Enter the instructor passcode"}
          @complete=${creating ? this.onCreate : this.onUnlock}></reading-bee-passcode>
      </div>
    `;
  }

  private padFrom(event: Event): ReadingBeePasscode {
    return event.currentTarget as ReadingBeePasscode;
  }

  private onUnlock = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    if (!appStore.verifyPasscode(value)) {
      this.padFrom(event).shake();
      return;
    }
    appStore.unlockInstructor();
  };

  private onCreate = (event: Event): void => {
    const value = (event as CustomEvent<{ value: string }>).detail.value;
    const pad = this.padFrom(event);
    if (!this.pendingPasscode) {
      this.pendingPasscode = value;
      this.creating = true;
      pad.reset();
      return;
    }
    if (value !== this.pendingPasscode) {
      this.pendingPasscode = "";
      pad.shake();
      return;
    }
    appStore.setPasscode(value);
    appStore.unlockInstructor();
    dispatch(this, SuccessEvent("Passcode saved"));
  };
}
