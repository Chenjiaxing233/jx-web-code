import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/React Monaco Editor/);
});

test('sidebar is visible', async ({ page }) => {
  await page.goto('/');
  const sidebar = page.locator('.sidebar');
  await expect(sidebar).toBeVisible();
});

test('editor is visible', async ({ page }) => {
  await page.goto('/');
  const editor = page.locator('.editor-panel');
  await expect(editor).toBeVisible();
});
