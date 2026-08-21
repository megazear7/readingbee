import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import { SHOP_ITEMS, ShopItem } from "../shared/shop-items.js";
import { StoreController } from "./controller.store.js";
import { backIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";

@customElement("reading-bee-shop")
export class ReadingBeeShop extends LitElement {
  static override styles = [
    globalStyles,
    css`
      :host {
        display: block;
        min-height: 100%;
      }

      .page {
        min-height: 100dvh;
        min-width: 0;
        max-width: 100%;
        overflow-x: clip;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      header {
        position: sticky;
        top: 0;
        z-index: 2;
        display: grid;
        grid-template-columns: 44px 1fr auto;
        align-items: center;
        gap: 0.6rem;
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

      .coins {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 36px;
        padding: 0.2rem 0.7rem 0.2rem 0.35rem;
        border-radius: 999px;
        background: #1a1713;
        border: 1px solid rgba(232, 184, 74, 0.35);
        color: var(--color-1);
        font-weight: 800;
      }

      .coin-dot {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #fff6c8, #e8b84a 58%, #9a6c1e);
        box-shadow: inset 0 0 0 1px rgba(255, 246, 200, 0.4);
      }

      .body {
        width: min(720px, 100%);
        min-width: 0;
        margin: 0 auto;
        padding: 1.2rem 1.2rem calc(2rem + env(safe-area-inset-bottom));
      }

      h2 {
        margin-top: 0.4rem;
      }

      .lede {
        margin-bottom: 1.1rem;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
        gap: 0.75rem;
      }

      .card {
        display: grid;
        justify-items: center;
        gap: 0.35rem;
        padding: 0.7rem 0.55rem 0.8rem;
        border-radius: 18px;
        background: #1a1713;
        border: 1px solid var(--color-panel-border);
        min-width: 0;
        text-align: center;
      }

      .card img {
        width: 88px;
        height: 88px;
        object-fit: contain;
      }

      .card.locked img,
      .card.sold img {
        filter: grayscale(1);
        opacity: 0.62;
      }

      .card.popping img {
        animation: itemPop 560ms ease;
      }

      @keyframes itemPop {
        0% {
          transform: scale(1) rotate(0deg);
        }
        35% {
          transform: scale(1.22) rotate(-8deg);
        }
        70% {
          transform: scale(0.94) rotate(6deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }

      .name {
        font-weight: 700;
        font-size: 0.88rem;
        line-height: 1.2;
      }

      .meta {
        font-size: 0.78rem;
        color: var(--color-primary-text-muted);
      }

      .card.buyable .meta {
        color: var(--color-1);
        font-weight: 700;
      }

      .empty {
        color: var(--color-primary-text-muted);
        margin: 0 0 1.2rem;
      }
    `,
  ];

  @state() private poppingId: string | null = null;

  constructor() {
    super();
    new StoreController(this);
  }

  override render(): TemplateResult {
    const profile = appStore.currentProfile;
    if (!profile) {
      return html`
        <div class="page"><p>No profile selected.</p></div>
      `;
    }
    const owned = SHOP_ITEMS.filter((item) => profile.inventory.includes(item.id));
    const catalog = SHOP_ITEMS;
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${() => navigate("reading")}>${backIcon}</button>
          <h1>Shop</h1>
          <div class="coins">
            <span class="coin-dot"></span>
            ${profile.coins}
          </div>
        </header>
        <div class="body">
          <h2>Your items</h2>
          ${
            owned.length === 0
              ? html`
                  <p class="empty">Nothing here yet. Earn coins by reading, then pick a reward below.</p>
                `
              : html`
                  <div class="grid">${owned.map((item) => this.card(item, profile.coins, true))}</div>
                `
          }
          <h2>Rewards</h2>
          <p class="lede">Tap a colorful item to buy it. Gray items cost more coins than you have right now.</p>
          <div class="grid">${catalog.map((item) => this.card(item, profile.coins, false))}</div>
        </div>
      </div>
    `;
  }

  private card(item: ShopItem, coins: number, inventory: boolean): TemplateResult {
    const owned = Boolean(appStore.currentProfile?.inventory.includes(item.id));
    const buyable = !owned && coins >= item.cost;
    const locked = !owned && !buyable;
    const classes = [
      "card",
      buyable && !inventory ? "buyable" : "",
      locked ? "locked" : "",
      owned && !inventory ? "sold" : "",
      this.poppingId === item.id ? "popping" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return html`
      <button class=${classes} @click=${() => this.onItem(item, inventory)}>
        <img src=${item.image} alt=${item.name} />
        <span class="name">${item.name}</span>
        <span class="meta">
          ${owned && !inventory ? "Already purchased" : `${item.cost} coin${item.cost === 1 ? "" : "s"}`}
        </span>
      </button>
    `;
  }

  private onItem = (item: ShopItem, inventory: boolean): void => {
    if (inventory) {
      this.play(item.id);
      return;
    }
    if (appStore.currentProfile?.inventory.includes(item.id)) return;
    if (!appStore.buyItem(item.id)) return;
    this.play(item.id);
  };

  private play(id: string): void {
    this.poppingId = id;
    window.setTimeout(() => {
      if (this.poppingId === id) this.poppingId = null;
    }, 560);
  }
}
