import { test, expect } from '@playwright/test';

test.describe('Interactive cards CSS wiring', () => {
  test('spring-driven vars map to visible styles', async ({ page }) => {
    await page.goto('/test-cards');

    const card = page.locator('.cards').first();
    const shine = card.locator('.card__shine');
    const glare = card.locator('.card__glare');
    const rotator = card.locator('.card__rotator');

    // Ensure interactive mode for CSS overrides
    await card.evaluate((el) => el.classList.add('interactive'));

    // Background parallax follows --background-x/y
    await card.evaluate((el) => {
      el.setAttribute('style', `--background-x: 66%; --background-y: 22%;`);
    });
    await expect(shine).toHaveCSS('background-position', '66% 22%');

    // Glare gradient center follows --glare-x/y
    await card.evaluate((el) => {
      el.setAttribute('style', `${el.getAttribute('style') || ''}; --glare-x: 33%; --glare-y: 77%;`);
    });
    const glareBg = await glare.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(glareBg).toContain('at 33% 77%');

    // Rotation transform reflects --rotate-x/y
    await card.evaluate((el) => {
      el.setAttribute('style', `${el.getAttribute('style') || ''}; --rotate-x: 14deg; --rotate-y: -9deg;`);
    });
    const transform = await rotator.evaluate((el) => getComputedStyle(el).transform);
    expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
  });
});

