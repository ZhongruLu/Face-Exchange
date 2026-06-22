import { expect, test } from '@playwright/test';

const modes = ['Corporate Face', 'Creative Face', 'Livestream Face', 'Verified Face'];

async function submitLocalImage(page) {
  await page.getByRole('button', { name: 'ENTER SYSTEM' }).click();
  await page.locator('#image-upload').setInputFiles({
    name: 'local-face.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgAAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  await expect(page.getByRole('img', { name: 'Submitted face preview' })).toBeVisible();
  await page.getByRole('button', { name: 'CONTINUE TO SYSTEM PACKAGING' }).click();
}

test('camera button exposes local camera or fallback message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ENTER SYSTEM' }).click();
  await page.getByRole('button', { name: 'USE CAMERA' }).click();
  await expect(page.locator('#camera-message')).toContainText(/Camera is active locally|Camera permission was denied|Camera is unavailable/);
});

for (const mode of modes) {
  test(`complete exchange path with ${mode}`, async ({ page }) => {
    await page.goto('/');
    await submitLocalImage(page);
    await page.getByLabel(mode).check();
    await page.getByRole('button', { name: 'ASSIGN FACE VALUE' }).click();
    await expect(page.getByLabel('Trust fictional interface score')).toBeVisible();
    await page.getByLabel('Trust fictional interface score').fill('33');
    await page.getByLabel('Attention fictional interface score').fill('77');
    await page.getByRole('button', { name: 'REVEAL HIDDEN COSTS' }).click();
    await page.getByLabel('Facial data submitted').check();
    await page.getByLabel('Platform controls circulation').check();
    await expect(page.locator('#cost-message')).toHaveText('HIDDEN COSTS REGISTERED');
    await page.getByRole('button', { name: 'GENERATE EXCHANGE RESULT' }).click();
    await expect(page.getByRole('heading', { name: 'EXCHANGE RESULT' })).toBeVisible();
    await expect(page.locator('#result-panel')).toContainText(mode);
    await expect(page.locator('#result-panel')).toContainText('EXCHANGED');
    await page.getByRole('button', { name: 'CONTINUE TO REFLECTION' }).click();
    await page.getByLabel('the user').check();
    await expect(page.locator('#reflection-response')).toContainText('END OF EXCHANGE PATH');
    await page.getByRole('button', { name: 'START AGAIN' }).click();
    await expect(page.getByRole('heading', { name: 'FACE EXCHANGE' })).toBeVisible();
  });
}

test('mobile layout and keyboard navigation keep the path usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.progress-path')).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'FACE CAPTURE / UPLOAD' })).toBeVisible();
});
