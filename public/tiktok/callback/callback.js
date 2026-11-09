'use strict';
// No network calls, storage, analytics, third-party scripts or configurable destination.
const query = location.search;
history.replaceState(null, '', location.pathname);
const status = document.getElementById('status');
try {
  if (query.length > 12000) throw new Error();
  const params = new URLSearchParams(query);
  if (!query) throw new Error();
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length || keys.some(k => !['state','auth_code','error','error_description'].includes(k))) throw new Error();
  const state = params.get('state');
  if (!/^[A-Za-z0-9_-]{43}$/.test(state || '')) throw new Error();
  const code = params.get('auth_code');
  const error = params.get('error');
  if (Boolean(code) === Boolean(error) || (code && (code.length > 2048 || /[\x00-\x1f]/.test(code)))) throw new Error();
  const payload = error ? {state, error:'access_denied'} : {state, auth_code:code};
  const link = document.getElementById('return');
  // A fragment is not transmitted in the loopback HTTP request or access logs.
  link.href = 'http://127.0.0.1:54867/return/#' + encodeURIComponent(JSON.stringify(payload));
  link.hidden = false;
  status.textContent = error ? 'TikTok access was declined. Return to WMG to close this attempt.'
    : 'TikTok has returned your sign-in. Continue below so WMG can verify the artist account.';
} catch {
  status.textContent = 'No valid connection was received. Start from the WMG connection launcher on your computer.';
}
