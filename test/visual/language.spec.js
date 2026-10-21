const { test, expect } = require("@playwright/test");

const home = process.env.LANGUAGE_TEST_HOME || "/al-folio/";

async function openHomepage(page, suffix = "") {
  await page.addInitScript(() => window.localStorage.setItem("theme", "light"));
  await page.route("**/livereload.js*", (route) => route.abort());
  await page.goto(`${home}${suffix}`, { waitUntil: "domcontentloaded" });
}

test("language control is ready before deferred page scripts finish loading", async ({ page }) => {
  let deferredScript;
  await page.addInitScript(() => {
    localStorage.setItem("site-language", "ja");
    window.languageTestDomReady = false;
    document.addEventListener("DOMContentLoaded", () => (window.languageTestDomReady = true));
  });
  await page.route("**/livereload.js*", (route) => route.abort());
  await page.route("**/assets/js/common.js*", (route) => {
    deferredScript = route;
  });
  try {
    await page.goto(home, { waitUntil: "commit" });
    await expect.poll(() => Boolean(deferredScript)).toBe(true);
    const japaneseButton = page.getByRole("button", { name: "Switch to Japanese", exact: true });
    await expect(japaneseButton).toBeVisible();
    await expect(japaneseButton).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => window.languageTestDomReady)).toBe(false);
    await page.getByRole("button", { name: "Switch to English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-site-language", "en");
    expect(await page.evaluate(() => window.languageTestDomReady)).toBe(false);
  } finally {
    if (deferredScript) await deferredScript.continue();
  }
  await page.waitForLoadState("domcontentloaded");
});

test("language switch translates the whole homepage without replacing the document", async ({ page }) => {
  await openHomepage(page);
  await expect(page.getByRole("heading", { name: "Education", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "News", exact: true })).toBeVisible();
  const englishButton = page.getByRole("button", { name: "Switch to English", exact: true });
  const japaneseButton = page.getByRole("button", { name: "Switch to Japanese", exact: true });
  await expect(englishButton).toHaveText("EN");
  await expect(japaneseButton).toHaveText("JP");
  await expect(englishButton).toHaveAttribute("aria-pressed", "true");
  await expect(japaneseButton).toHaveAttribute("aria-pressed", "false");
  const activeBackground = await englishButton.evaluate((node) => getComputedStyle(node).backgroundColor);
  const inactiveBackground = await japaneseButton.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(activeBackground).not.toBe(inactiveBackground);
  const originalUrl = page.url();
  const subtitle = await page.locator(".post-header .desc").innerText();
  await expect(page.locator('nav a[href*="/ja/"]')).toHaveCount(0);
  await page.evaluate(() => {
    window.languageTestDocument = document;
    window.languageTestProfile = document.querySelector(".profile img");
  });
  await page.getByRole("button", { name: "Abs", exact: true }).first().click();
  const abstract = page.locator(".publications .abstract.hidden").first();
  await expect(abstract).toHaveClass(/open/);

  await page.getByRole("button", { name: "Switch to Japanese", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(japaneseButton).toHaveAttribute("aria-pressed", "true");
  await expect(englishButton).toHaveAttribute("aria-pressed", "false");
  expect(await japaneseButton.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(activeBackground);
  expect(await englishButton.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(inactiveBackground);
  await japaneseButton.click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator(".post-header .desc")).toHaveText(subtitle);
  await expect(page.locator(".post-header .desc")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ニュース", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "more »", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "研究分野", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "経歴", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "研究業績", exact: true })).toBeVisible();
  await expect(page.locator('.clearfix [data-site-language="ja"]')).toContainText("スウォームロボティクス");
  await expect(page.getByRole("heading", { name: "Education", exact: true })).not.toBeVisible();
  expect(await page.locator(".homepage-education").innerText()).toContain("博士（自動制御・システム工学）");
  expect(await page.locator("#experience + .card").innerText()).toContain("シニアリサーチアソシエイト");
  expect(await page.locator("#experience + .card").innerText()).toContain("現在");
  expect(await page.locator(".news:visible").innerText()).toContain("出版されました");
  expect(page.url()).toBe(originalUrl);
  await expect(abstract).toHaveClass(/open/);
  expect(
    await page.evaluate(() => window.languageTestDocument === document && window.languageTestProfile === document.querySelector(".profile img"))
  ).toBe(true);

  await page.getByRole("button", { name: "Switch to English", exact: true }).press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(englishButton).toHaveAttribute("aria-pressed", "true");
  await expect(japaneseButton).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("heading", { name: "Education", exact: true })).toBeVisible();
  expect(await page.locator(".homepage-education").innerText()).toContain("2019–2024");
  expect(await page.locator("#experience + .card").innerText()).toContain("Senior Research Associate");
});

test("news expands into a scrollable archive and closes in both languages", async ({ page }) => {
  await openHomepage(page);
  const originalUrl = page.url();
  const section = page.locator("[data-news]");
  const viewport = section.locator(".homepage-news-items");
  const total = await section.locator('.news[data-site-language="en"] tr').count();
  expect(total).toBeGreaterThan(5);
  for (const language of ["English", "Japanese"]) {
    await page.getByRole("button", { name: `Switch to ${language}`, exact: true }).click();
    const rows = section.locator(".news:visible tr:visible");
    await expect(rows).toHaveCount(5);
    const more = section.getByRole("button", { name: "more »", exact: true });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.press("Enter");
    await expect(rows).toHaveCount(total);
    const close = section.getByRole("button", { name: "« close", exact: true });
    await expect(close).toHaveAttribute("aria-expanded", "true");
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === "auto")).toBe(true);
    await viewport.scrollIntoViewIfNeeded();
    await viewport.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(rows.last()).toBeInViewport();
    if (language === "English") {
      await page.getByRole("button", { name: "Switch to Japanese", exact: true }).click();
      await expect(close).toHaveAttribute("aria-expanded", "true");
      await expect(rows).toHaveCount(total);
    }
    await close.click();
    await expect(rows).toHaveCount(5);
    await expect(more).toHaveAttribute("aria-expanded", "false");
    expect(await viewport.evaluate((el) => el.scrollTop)).toBe(0);
    expect(page.url()).toBe(originalUrl);
  }
});

test("language preference persists across reloads and navigation", async ({ page }) => {
  await openHomepage(page);
  await page.getByRole("button", { name: "Switch to Japanese", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
  await page.goto(`${home}publications/`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Switch to English", exact: true })).toBeVisible();
  await page.goto(home, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
});

test("old Japanese links open Japanese mode on the main page", async ({ page }) => {
  await openHomepage(page);
  await page.goto(`${home}ja/`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(home);
  expect(new URL(page.url()).searchParams.has("lang")).toBe(false);
});

test("language switching works when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "site-language") throw new DOMException("Storage blocked", "SecurityError");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "site-language") throw new DOMException("Storage blocked", "SecurityError");
      return setItem.call(this, key, value);
    };
  });
  await openHomepage(page);
  await page.getByRole("button", { name: "Switch to Japanese", exact: true }).click();
  await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Switch to English", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Education", exact: true })).toBeVisible();
});

test("language control fits the top bar on narrow screens in both themes", async ({ page }) => {
  await openHomepage(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
      const button = page.getByRole("button", { name: "Switch to Japanese", exact: true });
      await expect(button).toBeVisible();
      const buttonBox = await button.boundingBox();
      const menuBox = await page.locator(".navbar-toggler-main").boundingBox();
      expect(buttonBox.x).toBeGreaterThanOrEqual(0);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(menuBox.x);
      expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
      await button.click();
      await expect(page.getByRole("heading", { name: "学歴", exact: true })).toBeVisible();
      const japaneseBox = await page.getByRole("button", { name: "Switch to English", exact: true }).boundingBox();
      expect(japaneseBox.x + japaneseBox.width).toBeLessThanOrEqual((await page.locator(".navbar-toggler-main").boundingBox()).x);
      await page.getByRole("button", { name: "Switch to English", exact: true }).click();
    }
  }
});

test("English remains readable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto(home, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Education", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "学歴", exact: true })).not.toBeVisible();
    await expect(page.locator("[data-language-toggle]:visible")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "more »", exact: true })).toHaveAttribute("href", `${home}news/`);
  } finally {
    await context.close();
  }
});
