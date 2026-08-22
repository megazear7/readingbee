import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
  hiddenShopRow,
  SHOP_COLUMNS,
  SHOP_ITEMS,
  ShopItem,
  shopTeaseCount,
  visibleShopCount,
} from "../shared/shop-items.js";
import { StoreController } from "./controller.store.js";
import { backIcon } from "./icons.js";
import { navigate } from "./nav.js";
import { appStore } from "./store.js";
import { globalStyles } from "./styles.global.js";
import { playCoinSounds } from "./coin-sounds.js";
import "./component.achievement-flight.js";
import "./component.coin-spend.js";
import "./component.level-badge.js";

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

      .header-right {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }

      .badge-btn {
        width: 52px;
        height: 58px;
        padding: 0;
        border-radius: 12px;
        transition: transform var(--time-normal) ease;
      }

      .badge-btn:hover {
        transform: scale(1.06);
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

      .grid,
      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }

      .catalog {
        display: grid;
        gap: 0.75rem;
      }

      .row {
        position: relative;
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
        transition: var(--transition-all);
      }

      .card.buyable:hover {
        transform: translateY(-1px) scale(1.03);
        border-color: var(--color-1);
        background: #221e18;
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

      .card.mystery {
        pointer-events: none;
        position: relative;
        overflow: hidden;
      }

      .card.mystery .name,
      .card.mystery .meta {
        visibility: hidden;
      }

      .card.mystery::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
      }

      .row.mystery-1 .card img {
        filter: blur(6px) grayscale(0.4) brightness(0.7);
        opacity: 0.55;
      }

      .row.mystery-1 .card::after {
        background: rgba(12, 11, 9, 0.28);
      }

      .row.mystery-2 .card img {
        filter: blur(12px) grayscale(0.8) brightness(0.35);
        opacity: 0.28;
      }

      .row.mystery-2 .card::after {
        background: rgba(12, 11, 9, 0.62);
      }

      .row.mystery-3 .card img {
        opacity: 0;
      }

      .row.mystery-3 .card::after {
        background: #14110e;
      }

      .tease {
        position: absolute;
        inset: 0;
        z-index: 2;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 0.6rem 1rem;
        text-align: center;
        font-weight: 700;
        font-size: 0.95rem;
        line-height: 1.3;
        color: var(--color-primary-text);
        text-shadow: 0 2px 14px rgba(12, 11, 9, 0.95);
        pointer-events: none;
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
  @state() private spending = false;
  @state() private spendCount = 0;
  @state() private pendingSpend = 0;
  @state() private spendOriginX = 0;
  @state() private spendOriginY = 0;
  @state() private flyingAchievement = "";
  @state() private achievementOriginX = 0;
  @state() private achievementOriginY = 0;
  @state() private achievementTargetX = 0;
  @state() private achievementTargetY = 0;
  private pendingAchievements: string[] = [];
  private achievementOriginFrom: { x: number; y: number } | null = null;

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
    const reveal = visibleShopCount(profile.coinsEarned);
    const teaseUntil = shopTeaseCount(profile.coinsEarned);
    const rows: { items: ShopItem[]; start: number }[] = [];
    for (let index = 0; index < teaseUntil; index += SHOP_COLUMNS) {
      rows.push({ items: SHOP_ITEMS.slice(index, index + SHOP_COLUMNS), start: index });
    }
    return html`
      <div class="page">
        <header>
          <button class="back" aria-label="Back" @click=${() => navigate("reading")}>${backIcon}</button>
          <h1>Shop</h1>
          <div class="header-right">
            <button class="badge-btn" aria-label="Achievements" @click=${() => navigate("achievements")}>
              <reading-bee-level-badge .level=${profile.level}></reading-bee-level-badge>
            </button>
            <div class="coins">
              <span class="coin-dot"></span>
              ${profile.coins + this.pendingSpend}
            </div>
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
                  <div class="grid">${owned.map((item) => this.card(item, profile.coins, true, false))}</div>
                `
          }
          <h2>Rewards</h2>
          <p class="lede">Tap a colorful item to buy it. Gray items cost more coins than you have right now.</p>
          <div class="catalog">
            ${rows.map((row) => {
              const hidden = hiddenShopRow(row.start, reveal);
              return html`
                <div class="row ${hidden === null ? "" : `mystery-${hidden + 1}`}">
                  ${row.items.map((item) => this.card(item, profile.coins, false, hidden !== null))}
                  ${
                    hidden === 1
                      ? html`
                          <p class="tease">Earn more coins to see more items</p>
                        `
                      : ""
                  }
                </div>
              `;
            })}
          </div>
        </div>
      </div>
      ${
        this.spending
          ? html`
              <reading-bee-coin-spend
                .originX=${this.spendOriginX}
                .originY=${this.spendOriginY}
                .count=${this.spendCount}
                @coin-left=${this.onCoinLeft}
                @done=${this.onSpendDone}></reading-bee-coin-spend>
            `
          : ""
      }
      ${
        this.flyingAchievement
          ? html`
              <reading-bee-achievement-flight
                .achievementId=${this.flyingAchievement}
                .originX=${this.achievementOriginX}
                .originY=${this.achievementOriginY}
                .targetX=${this.achievementTargetX}
                .targetY=${this.achievementTargetY}
                @done=${this.onAchievementDone}></reading-bee-achievement-flight>
            `
          : ""
      }
    `;
  }

  private card(item: ShopItem, coins: number, inventory: boolean, mystery: boolean): TemplateResult {
    const owned = Boolean(appStore.currentProfile?.inventory.includes(item.id));
    const buyable = !owned && !mystery && coins >= item.cost;
    const locked = !owned && !mystery && !buyable;
    const classes = [
      "card",
      buyable && !inventory ? "buyable" : "",
      locked ? "locked" : "",
      owned && !inventory ? "sold" : "",
      mystery ? "mystery" : "",
      this.poppingId === item.id ? "popping" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return html`
      <button
        class=${classes}
        data-item=${item.id}
        ?disabled=${mystery}
        @click=${() => this.onItem(item, inventory, mystery)}>
        <img src=${item.image} alt=${mystery ? "" : item.name} />
        <span class="name">${item.name}</span>
        <span class="meta">
          ${owned && !inventory ? "Already purchased" : `${item.cost} coin${item.cost === 1 ? "" : "s"}`}
        </span>
      </button>
    `;
  }

  private onItem = (item: ShopItem, inventory: boolean, mystery = false): void => {
    if (mystery || this.spending) return;
    if (inventory) {
      this.play(item.id);
      return;
    }
    if (appStore.currentProfile?.inventory.includes(item.id)) return;
    const previousAchievements = appStore.currentProfile?.achievements ?? [];
    if (!appStore.buyItem(item.id)) return;
    const earned = (appStore.currentProfile?.achievements ?? []).filter((id) => !previousAchievements.includes(id));
    this.pendingAchievements = [...this.pendingAchievements, ...earned];
    this.startSpend(item);
  };

  private startSpend(item: ShopItem): void {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      playCoinSounds(item.cost);
      this.play(item.id);
      this.playNextAchievement();
      return;
    }
    const source = this.renderRoot.querySelector(`[data-item="${item.id}"]`);
    if (source instanceof HTMLElement) {
      const rect = source.getBoundingClientRect();
      this.achievementOriginFrom = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    const counter = this.renderRoot.querySelector(".coins");
    if (counter instanceof HTMLElement) {
      const rect = counter.getBoundingClientRect();
      this.spendOriginX = rect.left + 18;
      this.spendOriginY = rect.top + rect.height / 2;
    } else {
      this.spendOriginX = window.innerWidth - 64;
      this.spendOriginY = 36;
    }
    this.spendCount = item.cost;
    this.pendingSpend = item.cost;
    this.spending = true;
    this.play(item.id);
  }

  private onCoinLeft = (): void => {
    this.pendingSpend = Math.max(0, this.pendingSpend - 1);
  };

  private onSpendDone = (): void => {
    this.spending = false;
    this.pendingSpend = 0;
    this.spendCount = 0;
    this.playNextAchievement();
  };

  private playNextAchievement(): void {
    if (this.flyingAchievement || this.pendingAchievements.length === 0) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.pendingAchievements = [];
      return;
    }
    const next = this.pendingAchievements[0];
    this.pendingAchievements = this.pendingAchievements.slice(1);
    const origin = this.achievementOriginFrom;
    this.achievementOriginX = origin?.x ?? window.innerWidth / 2;
    this.achievementOriginY = origin?.y ?? window.innerHeight * 0.55;
    const badge = this.renderRoot.querySelector("reading-bee-level-badge");
    if (badge instanceof HTMLElement) {
      const rect = badge.getBoundingClientRect();
      this.achievementTargetX = rect.left + rect.width / 2;
      this.achievementTargetY = rect.top + rect.height / 2;
    } else {
      this.achievementTargetX = window.innerWidth - 140;
      this.achievementTargetY = 44;
    }
    this.flyingAchievement = next;
  }

  private onAchievementDone = (): void => {
    this.flyingAchievement = "";
    window.setTimeout(() => this.playNextAchievement(), 120);
  };

  private play(id: string): void {
    this.poppingId = id;
    window.setTimeout(() => {
      if (this.poppingId === id) this.poppingId = null;
    }, 560);
  }
}
