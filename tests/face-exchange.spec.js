import { expect, test } from '@playwright/test';

const modes = ['Professional Face', 'Trustworthy Face', 'Young Face', 'Passport Face', 'Influencer Face', 'Premium Face'];

async function moveToStation(page, stationLabel) {
  await expect(page.locator('#station-readout')).toContainText(stationLabel);
}

async function openAccessibleNav(page) {
  const nav = page.locator('.accessible-nav');
  if (!(await nav.evaluate((element) => element.open))) {
    await page.getByText('Keyboard navigation').click();
  }
}

async function enterActiveDoor(page) {
  await openAccessibleNav(page);
  await page.getByRole('button', { name: 'ENTER NEARBY NODE' }).click();
}

async function enterStation(page, stationLabel, stepsFromCurrent) {
  for (let index = 0; index < stepsFromCurrent; index += 1) {
    await openAccessibleNav(page);
    await page.getByRole('button', { name: 'NEXT NODE' }).click();
  }
  await moveToStation(page, stationLabel);
  await enterActiveDoor(page);
}

async function submitLocalImage(page) {
  await enterStation(page, '02 SUBMIT', 1);
  await expect(page.getByRole('heading', { name: 'SUBMIT FACE MATERIAL' })).toBeVisible();
  await page.locator('#image-upload').setInputFiles({
    name: 'local-face.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgAAAAABJRU5ErkJggg==',
      'base64',
    ),
  });
  await expect(page.getByRole('img', { name: 'Submitted face preview' })).toBeVisible();
  await page.getByRole('button', { name: 'CONTINUE TO NEXT ROOM' }).click();
  await moveToStation(page, '03 CLASSIFY');
  await enterActiveDoor(page);
}

test('corridor starts with doors only and hides room content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.three-corridor canvas, .fallback-corridor:not([hidden])')).toBeVisible();
  await expect(page.locator('#station-readout')).toHaveText('01 INTRO');
  await expect(page.getByText('SCROLL / W / S TO MOVE')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'SUBMIT FACE MATERIAL' })).not.toBeVisible();
  await expect(page.locator('#image-upload')).not.toBeVisible();
  await expect(page.getByText('Professional Face')).not.toBeVisible();
  await expect(page.locator('#value-grid')).not.toBeVisible();
  await expect(page.locator('#cost-message')).not.toBeVisible();
});

test('camera button exposes local camera or fallback message inside Submit Room', async ({ page }) => {
  await page.goto('/');
  await enterStation(page, '02 SUBMIT', 1);
  await page.getByRole('button', { name: 'USE CAMERA' }).click();
  await expect(page.locator('#camera-message')).toContainText(/Camera is active locally|Camera permission was denied|Camera is unavailable/);
});

for (const mode of modes) {
  test(`complete room path with ${mode}`, async ({ page }) => {
    await page.goto('/');
    await submitLocalImage(page);
    await page.getByLabel(mode).check();
    await page.getByRole('button', { name: 'CONTINUE TO NEXT ROOM' }).click();
    await moveToStation(page, '04 VALUE');
    await enterActiveDoor(page);
    await expect(page.getByLabel('Trust Index fictional interface score')).toBeVisible();
    await page.getByLabel('Trust Index fictional interface score').fill('33');
    await page.getByLabel('Attention Demand fictional interface score').fill('77');
    await page.getByRole('button', { name: 'CONTINUE TO NEXT ROOM' }).click();
    await moveToStation(page, '05 AUCTION');
    await enterActiveDoor(page);
    await expect(page.getByRole('heading', { name: 'AUCTION THE FACE VALUE' })).toBeVisible();
    await expect(page.locator('#auction-message')).toContainText('HIGHEST FICTIONAL BID');
    await page.getByRole('button', { name: 'CONTINUE TO NEXT ROOM' }).click();
    await moveToStation(page, '06 COST');
    await enterActiveDoor(page);
    await page.getByLabel('Facial data submitted').check();
    await page.getByLabel('Platform controls circulation').check();
    await expect(page.locator('#cost-message')).toHaveText('HIDDEN COSTS REGISTERED');
    await page.getByRole('button', { name: 'CONTINUE TO NEXT ROOM' }).click();
    await moveToStation(page, '07 REFLECT');
    await enterActiveDoor(page);
    await expect(page.getByRole('heading', { name: 'WHO OWNS THE MARKET VALUE OF A FACE?' })).toBeVisible();
    await expect(page.locator('#result-panel')).toContainText(mode);
    await expect(page.locator('#result-panel')).toContainText('EXCHANGED');
    await page.getByLabel('the user').check();
    await expect(page.locator('#reflection-response')).toContainText('END OF EXCHANGE PATH');
    await page.getByRole('button', { name: 'START AGAIN' }).click();
    await expect(page.getByRole('heading', { name: 'FACE EXCHANGE' })).toBeVisible();
  });
}

test('return to corridor and mobile door navigation work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.three-corridor canvas, .fallback-corridor:not([hidden])')).toBeVisible();
  await enterActiveDoor(page);
  await expect(page.getByRole('heading', { name: 'FACE EXCHANGE' })).toBeVisible();
  await expect(page.getByText('FACE EXCHANGE is a fictional market where faces become digital value.')).toBeVisible();
  await page.getByRole('button', { name: 'RETURN TO CORRIDOR' }).click();
  await expect(page.locator('.three-corridor canvas, .fallback-corridor:not([hidden])')).toBeVisible();
  await expect(page.locator('[data-room="enterRoom"]')).not.toBeVisible();
  await openAccessibleNav(page);
  await page.getByRole('button', { name: 'NEXT NODE' }).click();
  await expect(page.locator('#station-readout')).toHaveText('02 SUBMIT');
});
