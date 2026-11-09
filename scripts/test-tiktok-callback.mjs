import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../public/tiktok/callback/callback.js', import.meta.url), 'utf8');
function run(query) {
  const status = {textContent: ''};
  const link = {hidden: true};
  const history = [];
  const context = createContext({ URLSearchParams, location: {search: query, pathname: '/tiktok/callback/'},
    history: {replaceState: (...args) => history.push(args)},
    document: {getElementById: id => id === 'status' ? status : link} });
  new Script(source).runInContext(context);
  return {status, link, history};
}
const state = 's'.repeat(43);
test('valid callback returns only to fixed loopback with fragment and clears public query', () => {
  const result = run(`?state=${state}&auth_code=synthetic-code`);
  const link = new URL(result.link.href);
  assert.equal(link.origin, 'http://127.0.0.1:54867');
  assert.equal(link.pathname, '/return/');
  assert.equal(link.search, '');
  assert.deepEqual(JSON.parse(decodeURIComponent(link.hash.slice(1))), {state, auth_code:'synthetic-code'});
  assert.equal(result.link.hidden, false);
  assert.deepEqual(result.history[0], [null, '', '/tiktok/callback/']);
});
test('denial excludes untrusted provider error text', () => {
  const result = run(`?state=${state}&error=denied&error_description=%3Cscript%3E`);
  assert.deepEqual(JSON.parse(decodeURIComponent(new URL(result.link.href).hash.slice(1))), {state, error:'access_denied'});
  assert(!result.status.textContent.includes('<script>'));
});
test('invalid duplicate oversized missing and conflicting parameters never create a return link', () => {
  for (const query of ['', '?auth_code=code', `?state=${state}&state=${state}&auth_code=code`,
    `?state=${state}&auth_code=code&next=https://evil.test`,
    `?state=${state}&auth_code=code&error=denied`, `?state=${state}&auth_code=`,
    `?state=${state}&auth_code=${'x'.repeat(2049)}`, `?state=${state}&auth_code=a%0Ab`]) {
    const result = run(query);
    assert.equal(result.link.hidden, true, query.slice(0,100));
    assert.equal(result.link.href, undefined);
    assert.equal(result.history.length, 1);
  }
});
test('standalone page has no analytics, embedded secret, storage or dynamic return destination', () => {
  const page = readFileSync(new URL('../public/tiktok/callback/index.html', import.meta.url), 'utf8');
  assert(page.includes('noindex,nofollow'));
  assert(page.includes('no-referrer'));
  assert(!/https?:\/\//.test(page));
  assert(!/fetch\(|localStorage|sessionStorage|client_secret|access_token/.test(source));
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert(config.rewrites.some(x => x.source === '/tiktok/callback/' && x.destination === '/tiktok/callback/index.html'));
  const headers = config.headers.find(x => x.source === '/tiktok/callback/:path*').headers;
  assert(headers.some(x => x.key === 'Cache-Control' && x.value === 'no-store'));
  assert(headers.some(x => x.key === 'Content-Security-Policy' && x.value.includes("frame-ancestors 'none'")));
});
