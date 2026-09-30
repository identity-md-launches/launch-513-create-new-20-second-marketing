const { chromium } = require('/opt/pwmcp/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({headless: true, executablePath: '/opt/ms-playwright/chromium-1246/chrome-linux64/chrome', args: ['--no-sandbox']});
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}, deviceScaleFactor: 1});
  for (const [name, url] of [
    ['home', 'https://pepe2pepe.fun/'],
    ['guide', 'https://pepe2pepe.fun/guide'],
    ['market10', 'https://pepe2pepe.fun/robinhood/market/10'],
    ['market12', 'https://pepe2pepe.fun/robinhood/market/12'],
    ['market3', 'https://pepe2pepe.fun/market/3']
  ]) {
    await page.goto(url, {waitUntil: 'networkidle', timeout: 45000});
    await page.waitForTimeout(3500);
    await page.screenshot({path: `assets/${name}.png`, fullPage: true});
    console.log(`\n${name}: ${page.url()} ${await page.title()}`);
    console.log((await page.locator('body').innerText()).slice(0, 6500));
  }
  await browser.close();
})().catch(error => {console.error(error); process.exitCode = 1});
