export function canonical(value) {
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.port)throw new Error('INVALID_URL');
 if(u.hostname==='keuzehulp.best'&&u.pathname==='/api/shop/distuit'&&/^[a-f0-9]{24}$/.test(u.searchParams.get('id')||''))return u.origin+u.pathname+'?id='+u.searchParams.get('id');
 throw new Error('INVALID_TRACKED_DESTINATION');
}

const EDITOR = 'https://flipboard.com/@Hnkjn2020/magazines/sid%2Fglpu0v0iy%2Fhnkjn2020/edit';
export function storageState(encoded) {
  if (!encoded || encoded.length > 1500000) throw new Error('FLIPBOARD_LOGIN_REQUIRED');
  let state;
  try { state = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')); } catch { throw new Error('FLIPBOARD_LOGIN_REQUIRED'); }
  const own = host => host === 'flipboard.com' || host.endsWith('.flipboard.com');
  const cookies = (Array.isArray(state.cookies) ? state.cookies : []).filter(x => own(String(x.domain).replace(/^\./, '')));
  const origins = (Array.isArray(state.origins) ? state.origins : []).filter(x => { try { return own(new URL(x.origin).hostname); } catch { return false; } });
  if (!cookies.length) throw new Error('FLIPBOARD_LOGIN_REQUIRED');
  return { cookies, origins };
}
export class FlipboardBrowser {
  constructor(encoded) { this.state = storageState(encoded); }
  async open() {
    if (this.page) return;
    const [{ default: chromium }, { chromium: playwright }] = await Promise.all([import('@sparticuz/chromium'), import('playwright-core')]);
    this.browser = await playwright.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
    this.context = await this.browser.newContext({ storageState: this.state, viewport: { width: 1440, height: 1000 } });
    this.page = await this.context.newPage();
    const response = await this.page.goto(EDITOR, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (response?.status() === 429) throw new Error('FLIPBOARD_RATE_LIMIT');
    await this.assertAccount();
  }
  async assertAccount() {
    if (/login|signup/.test(new URL(this.page.url()).pathname)) throw new Error('FLIPBOARD_LOGIN_REQUIRED');
    if (await this.page.locator('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenges.cloudflare"]').count()) throw new Error('FLIPBOARD_CAPTCHA');
    try { await this.page.getByRole('button', { name: /Avatar.*Kadoly/i }).waitFor({ state: 'visible', timeout: 15000 }); }
    catch { throw new Error('FLIPBOARD_LOGIN_REQUIRED'); }
    if (!this.page.url().includes('/@Hnkjn2020/magazines/')) throw new Error('WRONG_FLIPBOARD_MAGAZINE');
  }
  async observed(url) {
    const destinations = await this.page.locator('a[href*="/redirect"]').evaluateAll(nodes => nodes.map(node => {
      try { return new URL(node.href).searchParams.get('url'); } catch { return null; }
    }).filter(Boolean));
    return destinations.find(value => { try { return canonical(value) === canonical(url); } catch { return false; } });
  }
  async add(url, beforeSubmit) {
    await this.open(); await this.assertAccount();
    const prior = await this.observed(url);
    if (prior) return { verified: true, observedUrl: prior, alreadyPresent: true };
    const input = this.page.getByPlaceholder('Add a URL', { exact: true });
    await input.fill(url, { timeout: 15000 });
    // Persist the uncertain boundary BEFORE the action that can publish.
    await beforeSubmit();
    await input.press('Enter');
    const target = canonical(url);
    const visibleDestination = expected => [...document.querySelectorAll('a[href*="/redirect"]')].some(node => {
      try { const raw = new URL(node.href).searchParams.get('url'); const u = new URL(raw); return u.origin + u.pathname+'?id='+u.searchParams.get('id') === expected; }
      catch { return false; }
    });
    await this.page.waitForFunction(visibleDestination, target, { timeout: 30000 });
    // A transient preview is insufficient: verify the stored card after reload.
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    await this.assertAccount();
    await this.page.waitForFunction(visibleDestination, target, { timeout: 20000 });
    const observedUrl = await this.observed(url);
    if (!observedUrl) throw new Error('PUBLICATION_NOT_VERIFIED');
    return { verified: true, observedUrl };
  }
  async close() { await this.browser?.close(); }
}
