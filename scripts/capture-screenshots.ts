import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

type CaptureOptions = {
  webUrl: string;
  outDir: string;
  adminEmail: string;
  adminPassword: string;
};

function env(name: string, fallback: string) {
  const v = process.env[name];
  return v && v.trim().length ? v.trim() : fallback;
}

async function ensureDir(p: string) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function safeScreenshot(page: any, outPath: string) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath, fullPage: true });
}

async function fillLogin(page: any, email: string, password: string) {
  // Prefer stable testids, but fall back to ids if needed.
  const emailByTestId = page.getByTestId('login-email');
  if (await emailByTestId.count()) {
    await emailByTestId.fill(email);
  } else {
    await page.locator('#email').fill(email);
  }

  const passByTestId = page.getByTestId('login-password');
  if (await passByTestId.count()) {
    await passByTestId.fill(password);
  } else {
    await page.locator('#password').fill(password);
  }
}

async function submitLogin(page: any) {
  const submitByTestId = page.getByTestId('login-submit');
  if (await submitByTestId.count()) {
    await submitByTestId.click();
  } else {
    await page.getByRole('button', { name: /sign in/i }).click();
  }
}

async function run(opts: CaptureOptions) {
  await ensureDir(opts.outDir);

  // Prefer using an already-installed browser (corporate networks can block Playwright downloads).
  // Try Edge first, then Chrome, then fall back to bundled chromium (if available).
  let browser: any;
  try {
    browser = await chromium.launch({ channel: 'msedge' });
  } catch {
    try {
      browser = await chromium.launch({ channel: 'chrome' });
    } catch {
      browser = await chromium.launch();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login
  const candidates = opts.webUrl.includes('localhost:5173')
    ? [opts.webUrl.replace('localhost:5173', 'localhost:5174'), opts.webUrl]
    : [opts.webUrl];

  let loaded = false;
  for (const url of candidates) {
    try {
      await page.goto(`${url}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page
        .locator('[data-testid="login-email"], #email')
        .first()
        .waitFor({ state: 'visible', timeout: 10_000 });
      opts.webUrl = url;
      loaded = true;
      break;
    } catch {
      // try next
    }
  }

  if (!loaded) {
    await safeScreenshot(page, path.join(opts.outDir, '00-login-debug.png'));
    throw new Error('Login page did not render expected fields (see 00-login-debug.png).');
  }

  await fillLogin(page, opts.adminEmail, opts.adminPassword);
  await submitLogin(page);

  try {
    await page.waitForURL('**/dashboard', { timeout: 60_000 });
  } catch {
    await safeScreenshot(page, path.join(opts.outDir, '00-login-failed.png'));
    throw new Error('Login did not reach /dashboard (see 00-login-failed.png).');
  }

  await safeScreenshot(page, path.join(opts.outDir, '01-dashboard.png'));

  // If the seeded admin has no workspace, create one (needed for Notes/Projects screenshots).
  const noWorkspaces = await page.getByText(/no workspaces found/i).count();
  if (noWorkspaces) {
    // Create workspace from dashboard
    await page.getByRole('button', { name: /create workspace/i }).first().click();
    await page.waitForURL('**/workspaces/new', { timeout: 30_000 });

    // Select first organization (if any)
    const orgSelect = page.locator('[data-testid="workspace-organization"], #organizationId');
    await orgSelect.waitFor({ state: 'visible', timeout: 30_000 });
    await orgSelect.selectOption({ index: 1 }); // index 0 is placeholder

    const name = `General Workspace`;
    await page.locator('[data-testid="workspace-name"], #name').fill(name);
    // slug auto-generates; ensure non-empty
    const slugInput = page.locator('[data-testid="workspace-slug"], #slug');
    const slugVal = await slugInput.inputValue();
    if (!slugVal.trim()) {
      await slugInput.fill('general');
    }

    await page.getByRole('button', { name: /create workspace/i }).first().click();
    await page.waitForURL('**/dashboard', { timeout: 60_000 });
    await safeScreenshot(page, path.join(opts.outDir, '01b-dashboard-with-workspace.png'));
  }

  // Ensure workspace-scoped nav shows up (notes/projects links require current workspace).
  try {
    await page
      .locator('[data-testid="nav-notes"], a:has-text(\"Notes\")')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
  } catch {
    const firstWorkspaceByTestId = page.getByTestId('workspace-item').first();
    if (await firstWorkspaceByTestId.count()) {
      await firstWorkspaceByTestId.click();
    } else {
      const firstWorkspaceByRole = page.getByRole('button', { name: /^#/ }).first();
      if (await firstWorkspaceByRole.count()) {
        await firstWorkspaceByRole.click();
      }
    }
  }

  // Notes (may require current workspace selected)
  const notesNav = (await page.getByTestId('nav-notes').count())
    ? page.getByTestId('nav-notes')
    : page.getByRole('link', { name: /notes/i });

  if (await notesNav.count()) {
    await notesNav.first().click();
    await page.waitForURL('**/workspaces/**/notes', { timeout: 30_000 });
    await safeScreenshot(page, path.join(opts.outDir, '02-notes.png'));

    const firstNote = (await page.getByTestId('note-list-item').count())
      ? page.getByTestId('note-list-item').first()
      : page.locator('a[href^="/notes/"]').first();

    if (await firstNote.count()) {
      await firstNote.first().click();
      await page.waitForURL('**/notes/**', { timeout: 30_000 });
      await safeScreenshot(page, path.join(opts.outDir, '03-note.png'));
    }
  }

  // Projects
  const projectsNav = (await page.getByTestId('nav-projects').count())
    ? page.getByTestId('nav-projects')
    : page.getByRole('link', { name: /projects/i });

  if (await projectsNav.count()) {
    await projectsNav.first().click();
    await page.waitForURL('**/projects', { timeout: 30_000 });
    await safeScreenshot(page, path.join(opts.outDir, '04-projects.png'));
  }

  await browser.close();
}

run({
  webUrl: env('TEAMHUB_WEB_URL', 'http://localhost:5173'),
  outDir: env('TEAMHUB_SCREENSHOTS_DIR', path.resolve(process.cwd(), 'docs/screenshots')),
  adminEmail: env('TEAMHUB_ADMIN_EMAIL', 'admin@teamhub.demo'),
  adminPassword: env('TEAMHUB_ADMIN_PASSWORD', 'Admin123!'),
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

