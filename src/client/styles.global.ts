import { css } from "lit";

export const globalStyles = css`
  :host {
    font-family: var(--font-family);
    color: var(--color-primary-text);
  }

  h1,
  h2,
  h3 {
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 0.6rem;
  }

  h1 {
    font-size: 1.8rem;
  }

  h2 {
    font-size: 1.25rem;
  }

  p {
    margin: 0 0 0.8rem;
    color: var(--color-primary-text-muted);
  }

  button {
    font: inherit;
    cursor: pointer;
    border: 0;
    background: none;
    color: inherit;
  }

  input,
  select {
    font: inherit;
    color: var(--color-primary-text);
    background: #221e18;
    border: 1px solid var(--color-panel-border);
    border-radius: 14px;
    padding: 0.85rem 1rem;
    width: 100%;
    outline: none;
  }

  input:focus,
  select:focus {
    border-color: var(--color-1);
    box-shadow: 0 0 0 3px rgba(232, 184, 74, 0.18);
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn,
  .muted-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 48px;
    padding: 0.7rem 1.1rem;
    border-radius: 999px;
    transition: var(--transition-all);
  }

  .primary-btn {
    background: var(--color-1);
    color: #1a1408;
    font-weight: 700;
  }

  .primary-btn:hover {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  .ghost-btn {
    background: #221e18;
    border: 1px solid var(--color-panel-border);
  }

  .danger-btn {
    background: rgba(232, 93, 76, 0.12);
    color: var(--color-danger);
    border: 1px solid rgba(232, 93, 76, 0.35);
  }

  .muted-btn {
    color: var(--color-primary-text-muted);
    font-size: 0.95rem;
  }

  .muted-btn:hover {
    color: var(--color-primary-text);
  }
`;
