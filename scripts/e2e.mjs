import puppeteer from "puppeteer-core";

const BASE = process.env.READING_BEE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const readingProfile = ["reading-bee-reading", "shadow", "reading-bee-profile-modal", "shadow"];

const withPage = async (page, path, fn, ...args) => {
  return page.evaluate(
    (path, fnSource, args) => {
      const walkInner = (steps) => {
        let node = document;
        for (const step of steps) {
          if (step === "shadow") {
            node = node.shadowRoot;
          } else {
            node = node.querySelector(step);
          }
          if (!node) {
            throw new Error(`Missing ${step}`);
          }
        }
        return node;
      };
      const fnImpl = new Function("node", "args", fnSource);
      return fnImpl(walkInner(path), args);
    },
    path,
    fn,
    args,
  );
};

const click = async (page, path) => {
  const handle = await page.evaluateHandle((path) => {
    let node = document;
    for (const step of path) {
      if (step === "shadow") {
        node = node.shadowRoot;
      } else {
        node = node.querySelector(step);
      }
      if (!node) {
        throw new Error(`Missing ${step}`);
      }
    }
    return node;
  }, path);
  const element = handle.asElement();
  if (!element) {
    throw new Error(`No element for ${path.join(" > ")}`);
  }
  const box = await element.boundingBox();
  if (!box) {
    await withPage(page, path, "node.click();");
    return;
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

const textOf = async (page, path) => {
  return withPage(page, path, "return node.textContent.trim();");
};

const typeInto = async (page, path, value) => {
  await withPage(
    page,
    path,
    `node.focus(); node.value = args[0]; node.dispatchEvent(new Event("input", { bubbles: true }));`,
    value,
  );
};

const enterPin = async (page, passcodePath, pin) => {
  for (const digit of pin.split("")) {
    await withPage(
      page,
      passcodePath,
      `const buttons = [...node.shadowRoot.querySelectorAll("button.key")];
       const key = buttons.find((button) => button.textContent.trim() === args[0]);
       if (!key) throw new Error("missing key " + args[0]);
       key.click();`,
      digit,
    );
  }
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--disable-gpu", "--no-sandbox"],
});

let page;
try {
  page = await browser.newPage();
  await page.setViewport({ width: 430, height: 860 });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 20000 });
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    localStorage.clear();
  });
  await page.reload({ waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForSelector("reading-bee-onboarding", { timeout: 10000 });

  await typeInto(page, ["reading-bee-onboarding", "shadow", "input"], "Ava");
  await page.waitForFunction(() => {
    const button = document.querySelector("reading-bee-onboarding")?.shadowRoot?.querySelector("button.primary-btn");
    return Boolean(button && !button.disabled);
  });
  await click(page, ["reading-bee-onboarding", "shadow", "button.primary-btn"]);
  await page.waitForSelector("reading-bee-reading", { timeout: 10000 });

  const firstPrompt = await textOf(page, ["reading-bee-reading", "shadow", ".prompt"]);
  if (!firstPrompt) {
    throw new Error("No reading prompt after onboarding");
  }
  await click(page, ["reading-bee-reading", "shadow", "button.score-btn.yes"]);
  await page.waitForFunction(
    (previous) => {
      const reading = document.querySelector("reading-bee-reading");
      const prompt = reading?.shadowRoot?.querySelector(".prompt");
      return prompt && prompt.textContent.trim() !== previous;
    },
    { timeout: 5000 },
    firstPrompt,
  );
  const secondPrompt = await textOf(page, ["reading-bee-reading", "shadow", ".prompt"]);
  if (secondPrompt === firstPrompt) {
    throw new Error("Prompt did not change after a correct score");
  }

  await sleep(250);
  await click(page, ["reading-bee-reading", "shadow", "button.score-btn.no"]);
  await sleep(250);
  await click(page, ["reading-bee-reading", "shadow", ".action:last-child .muted"]);
  await sleep(250);
  await click(page, ["reading-bee-reading", "shadow", ".action:first-child .muted"]);
  await sleep(250);

  await click(page, ["reading-bee-reading", "shadow", "button.avatar"]);
  await page.waitForFunction(() => {
    const modal = document
      .querySelector("reading-bee-reading")
      ?.shadowRoot?.querySelector("reading-bee-profile-modal")
      ?.shadowRoot?.querySelector("reading-bee-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    return backdrop?.classList.contains("visible") || backdrop?.classList.contains("opening");
  });
  const profileName = await textOf(page, [...readingProfile, "h2"]);
  if (profileName !== "Ava") {
    throw new Error(`Profile modal showed ${profileName}`);
  }
  const statLabels = await withPage(
    page,
    readingProfile,
    `return [...node.querySelectorAll(".stat span")].map((el) => el.textContent.trim()).join("|");`,
  );
  if (statLabels !== "Texts read|Right|Wrong|Skipped|Easy") {
    throw new Error(`Profile stats were ${statLabels}`);
  }
  await withPage(page, [...readingProfile, "reading-bee-modal", "shadow", "button.close-button"], "node.click();");
  await page.waitForFunction(() => document.body.style.overflow !== "hidden");

  await sleep(400);
  await click(page, ["reading-bee-reading", "shadow", 'button[aria-label="Settings"]']);
  await page.waitForFunction(() => window.location.pathname.startsWith("/settings"), { timeout: 8000 });
  await page.waitForSelector("reading-bee-settings", { timeout: 10000 });
  const settingsPasscode = [
    "reading-bee-settings",
    "shadow",
    "reading-bee-instructor-gate",
    "shadow",
    "reading-bee-passcode",
  ];
  await enterPin(page, settingsPasscode, "1234");
  await page.waitForFunction(() => {
    const pad = document
      .querySelector("reading-bee-settings")
      ?.shadowRoot?.querySelector("reading-bee-instructor-gate")
      ?.shadowRoot?.querySelector("reading-bee-passcode");
    const title = pad?.shadowRoot?.querySelector("h2")?.textContent;
    return title?.includes("Confirm");
  });
  await enterPin(page, settingsPasscode, "1234");
  await page.waitForFunction(() => {
    const gate = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector("reading-bee-instructor-gate");
    const pad = gate?.shadowRoot?.querySelector("reading-bee-passcode");
    const card = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector(".profile-card");
    return !pad && Boolean(card);
  });

  await click(page, ["reading-bee-settings", "shadow", "button.skeleton"]);
  await page.waitForSelector("reading-bee-add-profile", { timeout: 10000 });
  await page.waitForFunction(() => {
    const gate = document
      .querySelector("reading-bee-add-profile")
      ?.shadowRoot?.querySelector("reading-bee-instructor-gate");
    const pad = gate?.shadowRoot?.querySelector("reading-bee-passcode");
    const input = document.querySelector("reading-bee-add-profile")?.shadowRoot?.querySelector("input");
    return Boolean(input) && !pad;
  });
  await typeInto(page, ["reading-bee-add-profile", "shadow", "input"], "Max");
  await page.waitForFunction(() => {
    const button = document.querySelector("reading-bee-add-profile")?.shadowRoot?.querySelector("button.primary-btn");
    return Boolean(button && !button.disabled);
  });
  await withPage(
    page,
    ["reading-bee-add-profile", "shadow", "button.primary-btn"],
    "node.scrollIntoView(); node.click();",
  );
  await page.waitForFunction(() => window.location.pathname === "/settings", { timeout: 8000 });
  await page.waitForSelector("reading-bee-settings", { timeout: 10000 });
  await page.waitForFunction(() => {
    const gate = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector("reading-bee-instructor-gate");
    const pad = gate?.shadowRoot?.querySelector("reading-bee-passcode");
    const cards = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelectorAll(".profile-card");
    return !pad && (cards?.length ?? 0) >= 2;
  });

  const shareCount = await withPage(
    page,
    ["reading-bee-settings", "shadow"],
    "return node.querySelectorAll('button.icon-share').length;",
  );
  if (shareCount < 2) {
    throw new Error(`Expected share buttons, found ${shareCount}`);
  }

  await click(page, ["reading-bee-settings", "shadow", "button.icon-share"]);
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector(".share-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    return backdrop?.classList.contains("visible");
  });
  const shareTitle = await textOf(page, ["reading-bee-settings", "shadow", ".share-modal", "h2"]);
  if (!shareTitle.startsWith("Share ")) {
    throw new Error(`Share modal showed ${shareTitle}`);
  }
  await click(page, ["reading-bee-settings", "shadow", ".share-modal", "button.ghost-btn"]);
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector(".share-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    const closing =
      backdrop?.classList.contains("visible") ||
      backdrop?.classList.contains("opening") ||
      backdrop?.classList.contains("closing");
    return !closing && document.body.style.overflow !== "hidden";
  });

  await click(page, ["reading-bee-settings", "shadow", "button.icon-delete"]);
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector(".delete-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    return backdrop?.classList.contains("visible");
  });
  const deleteTitle = await textOf(page, ["reading-bee-settings", "shadow", ".delete-modal", "h2"]);
  if (!deleteTitle.startsWith("Delete ")) {
    throw new Error(`Delete modal showed ${deleteTitle}`);
  }
  await click(page, ["reading-bee-settings", "shadow", ".delete-modal", "button.ghost-btn"]);
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-settings")?.shadowRoot?.querySelector(".delete-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    const closing = backdrop?.classList.contains("visible") || backdrop?.classList.contains("opening") || backdrop?.classList.contains("closing");
    return !closing && document.body.style.overflow !== "hidden";
  });

  await click(page, ["reading-bee-settings", "shadow", "button.back"]);
  await page.waitForSelector("reading-bee-reading", { timeout: 10000 });

  await click(page, ["reading-bee-reading", "shadow", "button.avatar"]);
  await withPage(
    page,
    readingProfile,
    `const rows = [...node.querySelectorAll("button.row")];
     const max = rows.find((row) => row.textContent.includes("Max"));
     if (!max) throw new Error("Max profile missing");
     max.click();`,
  );
  await page.waitForFunction(() =>
    Boolean(
      document
        .querySelector("reading-bee-reading")
        ?.shadowRoot?.querySelector("reading-bee-profile-modal")
        ?.shadowRoot?.querySelector("reading-bee-passcode"),
    ),
  );
  await enterPin(
    page,
    ["reading-bee-reading", "shadow", "reading-bee-profile-modal", "shadow", "reading-bee-passcode"],
    "1234",
  );
  await page.waitForFunction(() => {
    const reading = document.querySelector("reading-bee-reading");
    const prompt = reading?.shadowRoot?.querySelector(".prompt");
    return Boolean(prompt?.textContent.trim());
  });

  const sharedProfile = {
    id: "share-sam",
    name: "Sam",
    colorPairIndex: 2,
    primaryColor: "#5BA4E8",
    secondaryColor: "#CDE6F7",
    band: "words",
    level: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    currentTextId: null,
    lastTextId: null,
    recentTextIds: [],
    boostActive: false,
    boostLevel: 1,
    correctStreak: 0,
    wrongStreak: 0,
    textStats: {},
    events: [],
  };
  await page.goto(`${BASE}/?profile=${encodeURIComponent(JSON.stringify(sharedProfile))}`, {
    waitUntil: "networkidle0",
    timeout: 20000,
  });
  await page.waitForSelector("reading-bee-import-profile", { timeout: 10000 });
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-import-profile")?.shadowRoot?.querySelector("reading-bee-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    return backdrop?.classList.contains("visible");
  });
  const importTitle = await textOf(page, ["reading-bee-import-profile", "shadow", "h2"]);
  if (importTitle !== "Add Sam?") {
    throw new Error(`Import modal showed ${importTitle}`);
  }
  await click(page, ["reading-bee-import-profile", "shadow", "button.primary-btn"]);
  await page.waitForFunction(() => {
    const modal = document.querySelector("reading-bee-import-profile")?.shadowRoot?.querySelector("reading-bee-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    const closing =
      backdrop?.classList.contains("visible") ||
      backdrop?.classList.contains("opening") ||
      backdrop?.classList.contains("closing");
    return !closing;
  });
  await page.waitForSelector("reading-bee-reading", { timeout: 10000 });
  await page.waitForFunction(() => {
    const reading = document.querySelector("reading-bee-reading");
    const prompt = reading?.shadowRoot?.querySelector(".prompt");
    return Boolean(prompt?.textContent.trim());
  });
  await click(page, ["reading-bee-reading", "shadow", "button.avatar"]);
  await page.waitForFunction(() => {
    const modal = document
      .querySelector("reading-bee-reading")
      ?.shadowRoot?.querySelector("reading-bee-profile-modal")
      ?.shadowRoot?.querySelector("reading-bee-modal");
    const backdrop = modal?.shadowRoot?.querySelector(".modal-backdrop");
    return backdrop?.classList.contains("visible") || backdrop?.classList.contains("opening");
  });
  const importedName = await textOf(page, [...readingProfile, "h2"]);
  if (importedName !== "Sam") {
    throw new Error(`Imported profile showed ${importedName}`);
  }

  console.log("e2e ok");
  console.log(JSON.stringify({ firstPrompt, secondPrompt }, null, 2));
} catch (error) {
  console.error("e2e failed:", error);
  if (page) {
    await page.screenshot({ path: "/tmp/reading-bee-e2e.png", fullPage: true });
    console.error("screenshot: /tmp/reading-bee-e2e.png");
  }
  process.exitCode = 1;
} finally {
  await browser.close();
}
