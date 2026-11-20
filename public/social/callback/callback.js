'use strict';
const incoming=location.search;
history.replaceState(null,'',location.pathname);
try{
  if(!incoming||incoming.length>12000)throw Error();
  const params=new URLSearchParams(incoming),keys=[...params.keys()];
  if(new Set(keys).size!==keys.length||keys.some(k=>!['state','code','auth_code','scope','scopes','error','error_reason','error_description'].includes(k)))throw Error();
  const state=params.get('state'),code=params.get('code')||params.get('auth_code'),error=params.get('error');
  if(!/^[A-Za-z0-9_-]{43}$/.test(state||'')||params.has('code')&&params.has('auth_code')||Boolean(code)===Boolean(error)||code&&(code.length>4096||/[\x00-\x1f]/.test(code)))throw Error();
  // Query permissions are not evidence. The server verifies actual grants.
  const payload=error?{state,error:'access_denied'}:{state,code};
  const link=document.getElementById('return');
  link.href='http://127.0.0.1:54967/connect/return/#'+encodeURIComponent(JSON.stringify(payload));link.hidden=false;
  document.getElementById('status').textContent=error?'Access was declined. Return to WMG to close this attempt.':'Sign-in returned. Continue below to verify the exact artist account in WMG.';
}catch{
  document.getElementById('status').textContent='No valid connection was received. Start from the WMG Social Dashboard. Do not share a sign-in code or this page’s address.';
}
