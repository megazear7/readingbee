import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { backIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { globalStyles } from "./styles.global.js";
import "./component.instructor-gate.js";

@customElement("reading-bee-instructions")
export class ReadingBeeInstructions extends LitElement {
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
      }

      h2 {
        margin-top: 1.5rem;
        font-size: 1.05rem;
      }

      p,
      li {
        color: var(--color-primary-text-muted);
        line-height: 1.55;
      }

      ul {
        margin: 0 0 0.8rem;
        padding-left: 1.15rem;
        display: grid;
        gap: 0.45rem;
      }

      kbd {
        display: inline-block;
        padding: 0.08rem 0.4rem;
        border-radius: 8px;
        border: 1px solid var(--color-panel-border);
        background: #221e18;
        color: var(--color-primary-text);
        font-size: 0.82rem;
      }
    `,
  ];

  override render(): TemplateResult {
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${() => navigate("settings")}>${backIcon}</button>
          <h1>Teacher Instructions</h1>
        </header>
        <div class="body">
          <reading-bee-instructor-gate>
            <h2>Reading together</h2>
            <p>
              Reading Bee shows one letter, word, phrase, or sentence at a time. Sit with the student and listen as they
              read.
            </p>
            <ul>
              <li>Tap the green check if they read it correctly ("Mastered this one").</li>
              <li>Tap the blue raindrop if they need more practice. It works the same as a wrong answer.</li>
              <li>Use Skip if you want a different prompt.</li>
              <li>Use Way too easy if the work is far below what they can read.</li>
            </ul>
            <h2>Keyboard shortcuts</h2>
            <ul>
              <li>
                <kbd>←</kbd>
                left arrow — same as the green check
              </li>
              <li>
                <kbd>→</kbd>
                right arrow — same as the blue raindrop
              </li>
              <li>
                <kbd>Enter</kbd>
                or
                <kbd>C</kbd>
                — correct
              </li>
              <li>
                <kbd>X</kbd>
                — incorrect
              </li>
              <li>
                <kbd>S</kbd>
                — skip
              </li>
              <li>
                <kbd>E</kbd>
                — way too easy
              </li>
            </ul>
            <h2>Levels, coins, and the shop</h2>
            <p>
              The gold badge is the student's reading level. After a few correct reads, a gold coin can fly up to the
              top of the screen. A correct read counts fully toward the next coin, and an incorrect read counts half as
              much. Tap the coin count to visit the shop and spend coins on rewards. Collecting more coins, even after
              spending them, reveals more shop rows. The profile circle opens switching and progress.
            </p>
            <h2>Settings</h2>
            <p>
              Settings is locked with a 4-digit instructor passcode. Opening settings from the reading screen always
              asks for the passcode. Use it to add profiles, share a student, change colors, and back up data. After
              unlocking, you can move between settings pages without entering it again until you go back to the reading
              screen.
            </p>
          </reading-bee-instructor-gate>
        </div>
      </div>
    `;
  }
}
