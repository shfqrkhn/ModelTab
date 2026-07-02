import { test, expect } from "@playwright/test";

const liveUrl = process.env.MODELTAB_LIVE_URL || "https://shfqrkhn.github.io/ModelTab/";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 }
]) {
  test(`live GitHub Pages app is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const consoleIssues = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) consoleIssues.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
    });

    await page.setViewportSize(viewport);
    await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".workspace")).toBeVisible();
    await expect(page.locator("#promptInput")).toBeVisible();
    await expect(page.locator("#runtimeNotice")).toContainText("ModelTab direct mode");

    const audit = await page.evaluate(() => ({
      overflowX: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth
      ),
      offscreenVisible: [...document.querySelectorAll("body *")]
        .filter((element) => {
          if (element.closest('.sidebar[aria-hidden="true"], .settings-panel[aria-hidden="true"]')) return false;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
        })
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: String(element.className || "").slice(0, 80),
            text: (element.textContent || "").trim().slice(0, 80),
            left: Math.round(box.left),
            right: Math.round(box.right)
          };
        })
    }));

    expect(audit.overflowX).toBe(0);
    expect(audit.offscreenVisible).toEqual([]);
    expect(consoleIssues).toEqual([]);
  });
}
