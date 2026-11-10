import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pending = new Map();
const events = new Map();
const requests = [];
const runtimeErrors = [];
let chrome, server, profile, origin, session, sequence = 0;

function command(method, params = {}, sessionId = session) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out: ${method}`));
    }, 10000);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
}

function event(method) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      events.delete(method);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 10000);
    events.set(method, value => { clearTimeout(timer); resolve(value); });
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression: typeof expression === 'function' ? `(${expression})()` : expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

async function navigate() {
  const loaded = event('Page.loadEventFired');
  await command('Page.navigate', { url: origin });
  await loaded;
}

async function search(query) {
  await evaluate(`(() => {
    const input = document.querySelector('#q');
    input.value = ${JSON.stringify(query)};
    input.form.requestSubmit();
  })()`);
}

async function resultLinks() {
  return evaluate(() => [...document.querySelectorAll('#search-results li a')].map(a => a.getAttribute('href')));
}

before(async () => {
  server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
      response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(body);
    } catch { response.writeHead(404).end(); }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}/`;
  profile = await mkdtemp(join(tmpdir(), 'portfolio-test-'));
  chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-pipe', `--user-data-dir=${profile}`], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
  let buffer = '';
  chrome.stdio[4].on('data', data => {
    buffer += data.toString();
    let boundary;
    while ((boundary = buffer.indexOf('\0')) !== -1) {
      const message = JSON.parse(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 1);
      if (message.id) {
        const waiter = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) waiter?.reject(new Error(message.error.message));
        else waiter?.resolve(message.result);
      } else if (message.sessionId === session) {
        if (message.method === 'Network.requestWillBeSent') requests.push(message.params);
        if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params);
        const listener = events.get(message.method);
        events.delete(message.method);
        listener?.(message.params);
      }
    }
  });
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' }, undefined);
  ({ sessionId: session } = await command('Target.attachToTarget', { targetId, flatten: true }, undefined));
  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Network.setBlockedURLs', { urls: ['https://*'] });
});

beforeEach(async () => {
  await command('Emulation.setScriptExecutionDisabled', { value: false });
  await command('Network.setBlockedURLs', { urls: ['https://*'] });
  await command('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate();
});

after(async () => {
  if (chrome && chrome.exitCode === null) {
    const exited = once(chrome, 'exit');
    chrome.kill();
    await exited;
  }
  if (server) await new Promise(resolve => server.close(resolve));
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

test('presents Owner as the current role with a future start date without erasing Shopify achievements', async () => {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  assert.match(html, /Staff Software Engineer, Identity and Access Management/);
  assert.match(html, /Dec 2026 - Present/);
  assert.doesNotMatch(html, /joining Owner|joining <a|incoming|starting Dec|I'll be working/i);
  assert.match(html, /Oct 2021 - Nov 2026/);
  assert.doesNotMatch(html, /Technologies used at Shopify/);
  assert.doesNotMatch(html, /Staff Engineer(?: in|,) Security Engineering at Shopify|Shopify Security Engineering is open|Oct 2021 - Present/);
  const metadata = await evaluate(() => [document.title, ...[...document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]')].map(meta => meta.content)]);
  assert.ok(metadata.every(text => text.includes('Owner')));
  assert.ok(await evaluate(() => !!document.querySelector('#work a[href="https://www.owner.com/"]')));
  for (const id of ['broker', 'front-door', 'dbsc', 'approval']) {
    assert.ok(await evaluate(`!!document.getElementById(${JSON.stringify(id)})`));
  }
  assert.match(html, /Filed three issues against the W3C specification/);
});

test('document title uses the full current Owner role', async () => {
  assert.equal(await evaluate(() => document.title), 'Mohamed Beydoun | Staff Software Engineer, Identity and Access Management at Owner');
});

test('Open Graph title uses the full current Owner role', async () => {
  assert.equal(await evaluate(() => document.querySelector('meta[property="og:title"]').content), 'Mohamed Beydoun | Staff Software Engineer, Identity and Access Management at Owner');
});

test('first bio paragraph uses the current Owner role', async () => {
  const bio = await evaluate(() => document.querySelector('#barrhaven .with-photo > div > p').textContent);
  assert.match(bio, /I'm Mohamed, a Staff Software Engineer in Identity and Access Management at Owner\./);
});

test('subtitle contains only the role and company without a date', async () => {
  const subtitle = await evaluate(() => document.querySelector('.hero-label p').textContent);
  assert.equal(subtitle, 'Staff Software Engineer, Identity and Access Management at Owner');
  assert.doesNotMatch(subtitle, /2026|dec|joining|starting/i);
});

test('search is labeled, local, and initially empty', async () => {
  const state = await evaluate(() => {
    const form = document.querySelector('form[role="search"]');
    return { action: form.action, label: document.querySelector('label[for="q"]').textContent, hidden: form.hidden, results: document.querySelector('#search-results')?.hidden, tab: !!form.querySelector('[name="tab"]') };
  });
  assert.ok(state.action.startsWith(origin));
  assert.equal(state.label, 'Search this website');
  assert.equal(state.hidden, false);
  assert.equal(state.results, true);
  assert.equal(state.tab, false);
});

test('matches section content and focuses the accessible results heading', async () => {
  await search('credential broker');
  assert.ok((await resultLinks()).includes('#work'));
  assert.equal(await evaluate(() => document.activeElement.id), 'search-results-title');
  assert.match(await evaluate(() => document.querySelector('#search-results').textContent), /credentials|credential/i);
});

test('finds the Owner announcement, education, contact and photo credits', async () => {
  for (const [query, anchor] of [['Owner', '#work'], ['McGill', '#education'], ['mohamed.beydoun1098@gmail.com', '#contact'], ['Markwrogers', '#credits'], ['Credentials now arrive on time', '#news']]) {
    await search(query);
    assert.ok((await resultLinks()).includes(anchor), `${query} should include ${anchor}`);
  }
});

test('matches every term case-insensitively after normalizing whitespace', async () => {
  await search('  CrEdEnTiAl   BrOkEr  ');
  assert.ok((await resultLinks()).includes('#work'));
  await search('credential nonexistenttermxyz');
  assert.deepEqual(await resultLinks(), []);
  assert.match(await evaluate(() => document.querySelector('#search-results').textContent), /no (results|matches)/i);
});

test('indexes text in closed details and opens each matching detail on repeated activation', async () => {
  await evaluate(() => document.querySelectorAll('#work details').forEach(detail => { detail.open = false; }));
  await search('government-ID credential');
  assert.ok((await resultLinks()).includes('#work'));
  await evaluate(() => document.querySelector('#search-results a[href="#work"]').click());
  assert.ok(await evaluate(() => document.querySelector('#broker').open));
  assert.ok(await evaluate(() => [...document.querySelectorAll('#work details')].find(d => d.textContent.includes('government-ID')).open));
  assert.equal(await evaluate(() => document.activeElement.id), 'work');
  await evaluate(() => document.querySelector('#broker').open = false);
  await evaluate(() => document.querySelector('#search-results a[href="#work"]').click());
  assert.ok(await evaluate(() => document.querySelector('#broker').open));
});

test('opens an enclosing detail whose only search match is in a nested detail', async () => {
  const initial = await evaluate(() => {
    const broker = document.querySelector('#broker');
    const outer = document.createElement('details');
    outer.id = 'broker-context';
    const summary = document.createElement('summary');
    summary.textContent = 'Additional background';
    broker.before(outer);
    outer.append(summary, broker);
    broker.open = false;
    outer.open = false;
    return [broker.open, outer.open];
  });
  assert.deepEqual(initial, [false, false]);
  await search('credential broker');
  assert.ok((await resultLinks()).includes('#work'));
  await evaluate(() => document.querySelector('#search-results a[href="#work"]').click());
  const opened = await evaluate(() => [document.querySelector('#broker').open, document.querySelector('#broker-context').open]);
  assert.deepEqual(opened, [true, true]);
});

test('treats HTML-like queries as plain text without creating elements', async () => {
  await search('<img src=x onerror="window.searchInjected=true">');
  assert.deepEqual(await resultLinks(), []);
  assert.equal(await evaluate(() => !!window.searchInjected), false);
  assert.equal(await evaluate(() => !!document.querySelector('#search-results img')), false);
  await search('[');
  assert.deepEqual(await resultLinks(), []);
});

test('reports an empty query and clears previous matches', async () => {
  await search('Owner');
  await search('   ');
  assert.deepEqual(await resultLinks(), []);
  assert.match(await evaluate(() => document.querySelector('#search-results').textContent), /enter|type/i);
});

test('clear control resets results and restores input focus', async () => {
  await search('Owner');
  await evaluate(() => document.querySelector('#clear-search').click());
  assert.equal(await evaluate(() => document.querySelector('#q').value), '');
  assert.equal(await evaluate(() => document.querySelector('#search-results').hidden), true);
  assert.equal(await evaluate(() => document.activeElement.id), 'q');
  assert.deepEqual(await resultLinks(), []);
  await search('Owner');
  await evaluate(() => { const input = document.querySelector('#q'); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await evaluate(() => document.querySelector('#search-results').hidden), true);
});

test('supports keyboard submission and result navigation', async () => {
  await evaluate(() => { const input = document.querySelector('#q'); input.value = 'credential broker'; input.focus(); });
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate(() => document.activeElement.id), 'search-results-title');
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.ok(await evaluate(() => document.activeElement.matches('#search-results li a')));
  await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
  await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate(() => document.activeElement.id), 'news');
});

test('submitting search makes no navigation, fetch or XHR request', async () => {
  const start = requests.length;
  await search('credential broker');
  await evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));
  assert.deepEqual(requests.slice(start).filter(request => ['Document', 'Fetch', 'XHR'].includes(request.type)), []);
  assert.equal(await evaluate(() => location.origin + location.pathname), origin);
});

test('search does not overflow a 390px mobile viewport', async () => {
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await search('x'.repeat(250));
  assert.ok(await evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await search('Owner');
  assert.ok(await evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
});

test('failed search script leaves a hidden form and useful fallback', async () => {
  await command('Network.setBlockedURLs', { urls: ['https://*', '*search.js*'] });
  await navigate();
  const state = await evaluate(() => ({ form: getComputedStyle(document.querySelector('form[role="search"]')).display, fallback: getComputedStyle(document.querySelector('#search-fallback')).display, text: document.querySelector('#search-fallback').textContent }));
  assert.equal(state.form, 'none');
  assert.notEqual(state.fallback, 'none');
  assert.match(state.text, /browser.*find/i);
});

test('disabled JavaScript leaves a hidden form and useful fallback', async () => {
  await command('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate();
  const state = await evaluate(() => ({ form: getComputedStyle(document.querySelector('form[role="search"]')).display, fallback: getComputedStyle(document.querySelector('#search-fallback')).display }));
  assert.equal(state.form, 'none');
  assert.notEqual(state.fallback, 'none');
});

test('preserves existing internal anchors and reports no script exceptions', async () => {
  const missing = await evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.hash.slice(1)).filter(id => id && !document.getElementById(id)));
  assert.deepEqual(missing, []);
  assert.deepEqual(runtimeErrors, []);
});
