// Measurement script for the homepage alignment / SVG-size investigation.
// Run AFTER `npm run dev` is up on http://localhost:3000/.
//
// Reports:
//   1. The computed bounding rect (and intrinsic + computed CSS) of every
//      star SVG in the sample-testimonials preview.
//   2. The total document height.
//   3. Whether the global stylesheet at /_next/static/css/... actually
//      loaded (count of <link rel=stylesheet>).
//   4. Whether Tailwind utility classes resolved (.h-4, .h-6) — by
//      reading getComputedStyle on representative elements.
//
// Outputs JSON to stdout so it can be parsed without manual reading.

const { chromium } = require('playwright');

const URL = process.env.MEASURE_URL || 'http://localhost:3000/';

async function measure(width, height) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push('pageerror: ' + err.message);
  });

  const failedRequests = [];
  page.on('requestfailed', (req) => {
    failedRequests.push(req.url() + ' ' + req.failure()?.errorText);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push('HTTP ' + res.status() + ' ' + res.url());
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

  const report = await page.evaluate(() => {
    // 1. All <svg> elements inside the hero "Sample" preview.
    //    The preview sits inside the [role="img"][aria-label*="Sample testimonial wall"] element.
    const preview = document.querySelector('[role="img"][aria-label*="Sample testimonial wall"]');
    const stars = preview ? Array.from(preview.querySelectorAll('svg')) : [];
    const starInfo = stars.map((s, i) => {
      const cs = getComputedStyle(s);
      const r = s.getBoundingClientRect();
      return {
        index: i,
        intrinsicW: s.getAttribute('width'),
        intrinsicH: s.getAttribute('height'),
        viewBox: s.getAttribute('viewBox'),
        className: s.getAttribute('class'),
        computedW: cs.width,
        computedH: cs.height,
        rectW: Math.round(r.width),
        rectH: Math.round(r.height),
      };
    });

    // 2. Document / scroll dimensions.
    const body = document.body;
    const html = document.documentElement;
    const bodyRect = body.getBoundingClientRect();
    const docHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
    );

    // 3. Stylesheets loaded.
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const cssHrefs = links.map((l) => l.getAttribute('href'));

    // 4. Sanity: do representative Tailwind utilities resolve?
    function probe(selector, prop) {
      const el = document.querySelector(selector);
      if (!el) return { selector, ok: false, reason: 'not found' };
      return {
        selector,
        ok: true,
        [prop]: getComputedStyle(el)[prop],
      };
    }
    const heroBtn = document.querySelector('a[href="/register"]');
    const featureIconWrap = document.querySelector('#features svg');
    const probes = [
      probe('h1', 'fontSize'),
      probe('#features .grid', 'display'),
      featureIconWrap
        ? {
            selector: '#features svg',
            ok: true,
            width: getComputedStyle(featureIconWrap).width,
            height: getComputedStyle(featureIconWrap).height,
          }
        : { selector: '#features svg', ok: false, reason: 'not found' },
    ];
    void heroBtn;

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      docHeight,
      bodyHeight: bodyRect.height,
      starCount: stars.length,
      starInfo,
      cssHrefCount: links.length,
      cssHrefs,
      probes,
    };
  });

  report.failedRequests = failedRequests;
  report.consoleErrors = consoleErrors;
  report.viewport = { width, height };

  await browser.close();
  return report;
}

(async () => {
  const desktop = await measure(1280, 800);
  const mobile = await measure(375, 800);
  console.log(JSON.stringify({ desktop, mobile }, null, 2));
})();
