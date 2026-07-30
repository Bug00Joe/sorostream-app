import { test, expect } from '@playwright/test';

test.describe('Stream Flow E2E', () => {
  test('navigation from home to dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Launch App');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('navigate to create stream page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=+ New Stream');
    await expect(page).toHaveURL('/stream/new');
    await expect(page.locator('h1')).toContainText('Create Stream');
  });

  test('create stream form renders all fields', async ({ page }) => {
    await page.goto('/stream/new');
    
    // Check all form fields are present
    await expect(page.getByPlaceholder('G...')).toBeVisible();
    await expect(page.getByPlaceholder('100')).toBeVisible();
    await expect(page.getByLabel('Days')).toBeVisible();
    await expect(page.getByLabel('Hours')).toBeVisible();
    await expect(page.getByLabel('Minutes')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Stream' })).toBeVisible();
  });

  test('flow rate preview appears when amount and duration are set', async ({ page }) => {
    await page.goto('/stream/new');
    
    // Fill in amount
    await page.getByPlaceholder('100').fill('100');
    
    // Set duration
    await page.getByLabel('Days').fill('1');
    
    // Wait for flow rate preview to appear
    await expect(page.getByText('Flow Rate Preview')).toBeVisible();
    await expect(page.getByText(/Per second/)).toBeVisible();
    await expect(page.getByText(/Per hour/)).toBeVisible();
  });

  test('view stream detail page', async ({ page }) => {
    await page.goto('/stream/123');
    
    await expect(page.locator('h1')).toContainText('Stream #123');
    await expect(page.getByRole('button', { name: 'Withdraw' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('full happy path: home → dashboard → create → view', async ({ page }) => {
    // Start at home
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Stream Money Like Data');
    
    // Navigate to dashboard
    await page.click('text=Launch App');
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate to create stream
    await page.click('text=+ New Stream');
    await expect(page).toHaveURL('/stream/new');
    
    // Fill in form (without submitting since SDK is mocked)
    await page.getByPlaceholder('G...').fill('GB7TJKR6KZ3L3LYPZNAZQJR4HGLJ4E7MSTFJZXQZ2RL4QJKZKSX6JQJ5');
    await page.getByPlaceholder('100').fill('100');
    await page.getByLabel('Days').fill('1');
    
    // Verify flow rate preview appears
    await expect(page.getByText('Flow Rate Preview')).toBeVisible();
    
    // Navigate to a stream detail page (simulating after creation)
    await page.goto('/stream/123');
    await expect(page.getByRole('button', { name: 'Withdraw' })).toBeVisible();
  });
});
