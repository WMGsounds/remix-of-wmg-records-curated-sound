import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {transform} from 'esbuild';
import {createHash} from 'node:crypto';

const callback=readFileSync(new URL('../public/social/callback/callback.js',import.meta.url),'utf8');
const state='s'.repeat(43);
function run(query){
  const status={textContent:''},link={hidden:true},history=[];
  new Script(callback).runInContext(createContext({URLSearchParams,location:{search:query,pathname:'/social/callback/'},
    history:{replaceState:(...a)=>history.push(a)},document:{getElementById:id=>id==='status'?status:link}}));
  return {status,link,history};
}
test('all official callbacks clear the query and return only fixed local state/code',()=>{
  for(const field of ['code','auth_code']){
    const r=run('?state='+state+'&'+field+'=synthetic&scope=untrusted');const url=new URL(r.link.href);
    assert.equal(url.origin,'http://127.0.0.1:54967');assert.equal(url.pathname,'/connect/return/');assert.equal(url.search,'');
    assert.deepEqual(JSON.parse(decodeURIComponent(url.hash.slice(1))),{state,code:'synthetic'});
    assert.deepEqual(r.history[0],[null,'','/social/callback/']);
  }
  for(const q of ['', '?code=synthetic','?state='+state+'&code=a&code=b','?state='+state+'&code=a&auth_code=b',
    '?state='+state+'&code=a&next=https://evil.invalid','?state='+state+'&code=a%0Ab','?state='+state+'&code='+'a'.repeat(4097)])assert.equal(run(q).link.hidden,true);
});
const compiled=await transform(readFileSync(new URL('../api/notion/_tiktokDelivery.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm',target:'es2022'});
const delivery=await import('data:text/javascript;base64,'+Buffer.from(compiled.code).toString('base64'));
function request(extra={}){
  const date=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const q=new URLSearchParams({sha:'a'.repeat(64),'X-Amz-Algorithm':'AWS4-HMAC-SHA256','X-Amz-Credential':'A'.repeat(32)+'/'+date.slice(0,8)+'/auto/s3/aws4_request',
    'X-Amz-Date':date,'X-Amz-Expires':'900','X-Amz-SignedHeaders':'host','X-Amz-Signature':'b'.repeat(64),...extra});
  return new Request('https://www.wmgsounds.com/api/image-proxy?'+q);
}
test('delivery fixes the private bucket/object and refuses injection, duplicates, expiry and write methods',async()=>{
  const target=delivery.deliveryTarget(request());const url=new URL(target.url);
  assert.equal(url.hostname,'3367ee7259ad608394401af7b2799f1e.r2.cloudflarestorage.com');
  assert.equal(url.pathname,'/wmg-publisher-media/prepared/'+'a'.repeat(64)+'.mp4');
  let calls=0;const saved=globalThis.fetch;globalThis.fetch=async()=>{calls++;throw Error()};
  try{
    for(const r of [request({url:'https://evil.invalid/'}),request({sha:'../other'}),request({'X-Amz-Expires':'901'}),
      new Request(request().url+'&sha='+'c'.repeat(64)),new Request(request().url,{method:'POST'})])assert.notEqual((await delivery.GET(r)).status,200);
    assert.throws(()=>delivery.deliveryTarget(request(),Date.now()+901_000));assert.equal(calls,0);
  }finally{globalThis.fetch=saved}
});
test('delivery streams more than 4.5 MB without buffering and supports HEAD/cancellation',async()=>{
  const saved=globalThis.fetch;const bytes=Buffer.alloc(6*1024*1024,37);let cancelled=false;
  globalThis.fetch=async(url,options)=>{
    assert.equal(options.redirect,'error');assert.equal(new URL(url).hostname,'3367ee7259ad608394401af7b2799f1e.r2.cloudflarestorage.com');
    let offset=0;return new Response(new ReadableStream({pull(c){if(offset===bytes.length){c.close();return}c.enqueue(bytes.subarray(offset,offset+=65536))},cancel(){cancelled=true}}),{
      headers:{'Content-Length':String(bytes.length),'Content-Type':'video/mp4'}});
  };
  try{
    const response=await delivery.GET(request());assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
    const hash=createHash('sha256');let size=0;for await(const chunk of response.body){hash.update(chunk);size+=chunk.length}
    assert.equal(size,bytes.length);assert.equal(hash.digest('hex'),createHash('sha256').update(bytes).digest('hex'));
    const head=await delivery.HEAD(new Request(request().url,{method:'HEAD'}));assert.equal(head.body,null);assert(cancelled);
  }finally{globalThis.fetch=saved}
});
