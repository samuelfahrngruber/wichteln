import { test, expect } from "@playwright/test";

async function addNames(page, names) {
  for (const name of names) {
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.locator("form button").click();
  }
}

test("shared games stay stable across languages, reloads, and browser contexts", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await addNames(page, ["Änne 🎁", "Ben", "Clara", "David"]);
  await page.getByRole("button", { name: "Add both directions", exact: true }).click();
  await expect(page.locator("li")).toHaveCount(6);
  await page.getByRole("button", { name: "Deutsch", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("button", { name: "Deutsch", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Erstellen", exact: true }).click();
  const link = await page.getByLabel("Spiellink", { exact: true }).inputValue();
  await page.getByRole("link", { name: "Spiel öffnen" }).click();
  await expect(page.locator(".card")).toHaveCount(4);
  await page.locator("#card-0").click();
  const first = await page.locator("#card-0").innerText();
  expect(first).toMatch(/^Hallo Änne 🎁/);
  expect(first).not.toContain("für Ben");
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCount(1);
  await page.locator("#card-1").click();
  await expect(page.locator("#card-0")).toHaveText("Änne 🎁");
  await expect(page.locator("#card-1")).not.toContainText("für Änne 🎁");
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCount(1);
  await page.locator("#card-1").press("Space");
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCount(0);
  await page.locator("#card-0").press("Enter");
  await expect(page.locator("#card-0")).toHaveText(first);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  try {
    const other = await context.newPage();
    await other.goto(link);
    await expect(other.locator('.card[aria-pressed="true"]')).toHaveCount(0);
    await other.locator("#card-0").click();
    await expect(other.locator("#card-0")).toHaveText(first);
  } finally {
    await context.close();
  }
  await page.reload();
  await expect(page.locator('.card[aria-pressed="true"]')).toHaveCount(0);
  await page.locator("#card-0").click();
  await expect(page.locator("#card-0")).toHaveText(first);
  const gameBefore = new URLSearchParams(new URL(page.url()).hash.slice(1)).get("game");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator("#card-0")).toContainText("Hello Änne 🎁");
  expect(new URLSearchParams(new URL(page.url()).hash.slice(1)).get("game")).toBe(gameBefore);
});

test("directed exclusions, impossible games, and participant removal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("at least two");
  await addNames(page, ["Alice", "Bob"]);
  await page.getByRole("button", { name: "Add", exact: true }).last().click();
  await expect(page.locator("li")).toHaveCount(3);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No draw is possible");
  await addNames(page, ["Carol"]);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.getByRole("link", { name: "Open game", exact: true }).click();
  await page.locator("#card-0").click();
  await expect(page.locator("#card-0")).toContainText("for Carol");
  await page.locator("#card-1").click();
  await expect(page.locator("#card-1")).toContainText("for Alice");
  await page.getByRole("link", { name: "Create a new game" }).click();
  await page.getByRole("button", { name: "Remove: Alice", exact: true }).click();
  await expect(page.locator("li")).toHaveCount(2);
  await expect(page.getByLabel("Game link", { exact: true })).toHaveCount(0);
  await addNames(page, ["Bob"]);
  await expect(page.getByRole("status")).toContainText("different name");
});

test("invalid links show an error and allow starting a new game", async ({ page }) => {
  await page.goto("/#game=broken");
  await expect(page.getByRole("alert")).toContainText("invalid");
  await page.getByRole("link", { name: "Create a new game" }).click();
  await expect(page.getByRole("heading", { name: "Create a game" })).toBeVisible();
});
