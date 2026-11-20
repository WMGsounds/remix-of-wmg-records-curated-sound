/** Stream only an already signed, short-lived approved R2 object. No bucket key. */
const R2='https://3367ee7259ad608394401af7b2799f1e.r2.cloudflarestorage.com';
const BUCKET='wmg-publisher-media';
const MAX_BYTES=100_000_000;
const KEYS=['X-Amz-Algorithm','X-Amz-Credential','X-Amz-Date','X-Amz-Expires','X-Amz-SignedHeaders','X-Amz-Signature'];
const security={'Cache-Control':'private, no-store, max-age=0','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, noarchive'};

export function deliveryTarget(request:Request,now=Date.now()){
  const url=new URL(request.url),params=url.searchParams,keys=[...params.keys()];
  if(keys.length!==7||new Set(keys).size!==keys.length||keys.some(k=>k!=='sha'&&!KEYS.includes(k)))throw Error('invalid_delivery');
  const sha=params.get('sha')||'',date=params.get('X-Amz-Date')||'',ttl=params.get('X-Amz-Expires')||'',credential=params.get('X-Amz-Credential')||'';
  if(!/^[a-f0-9]{64}$/.test(sha)||!/^\d{8}T\d{6}Z$/.test(date)||!/^\d{1,3}$/.test(ttl)||Number(ttl)<60||Number(ttl)>900||
    params.get('X-Amz-Algorithm')!=='AWS4-HMAC-SHA256'||params.get('X-Amz-SignedHeaders')!=='host'||
    !/^[a-f0-9]{64}$/.test(params.get('X-Amz-Signature')||'')||
    !new RegExp('^[A-Za-z0-9]{16,64}/'+date.slice(0,8)+'/auto/s3/aws4_request$').test(credential))throw Error('invalid_delivery');
  const issued=Date.parse(date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+'T'+date.slice(9,11)+':'+date.slice(11,13)+':'+date.slice(13,15)+'Z');
  if(!Number.isFinite(issued)||issued>now+60_000||issued+Number(ttl)*1000<=now)throw Error('expired_delivery');
  const range=request.headers.get('range');
  if(range&&!/^bytes=(?:\d{1,9}-\d{0,9}|-\d{1,9})$/.test(range))throw Error('invalid_range');
  const signed=new URLSearchParams(KEYS.map(k=>[k,params.get(k)!] as [string,string]));
  return {url:R2+'/'+BUCKET+'/prepared/'+sha+'.mp4?'+signed.toString(),range,sha};
}

async function delivery(request:Request,head=false){
  if(!['GET','HEAD'].includes(request.method))return new Response('Unavailable',{status:405,headers:security});
  let target:ReturnType<typeof deliveryTarget>;
  try{target=deliveryTarget(request)}catch{return new Response('Unavailable',{status:404,headers:security})}
  const abort=new AbortController(),deadline=setTimeout(()=>abort.abort(),240_000);
  try{
    const upstream=await fetch(target.url,{method:'GET',redirect:'error',signal:abort.signal,
      headers:target.range?{Range:target.range}:{}});
    if(![200,206].includes(upstream.status)||!upstream.body){await upstream.body?.cancel();clearTimeout(deadline);return new Response('Unavailable',{status:404,headers:security})}
    const size=upstream.headers.get('content-length'),range=upstream.headers.get('content-range');
    if(!size||!/^\d+$/.test(size)||Number(size)<1||Number(size)>MAX_BYTES||range&&(!/^bytes \d+-\d+\/\d+$/.test(range)||Number(range.split('/')[1])>MAX_BYTES)){
      await upstream.body.cancel();clearTimeout(deadline);return new Response('Unavailable',{status:502,headers:security});
    }
    const headers=new Headers({...security,'Content-Type':'video/mp4','Content-Length':size,'Accept-Ranges':'bytes','Content-Disposition':'inline; filename="'+target.sha+'.mp4"'});
    if(range)headers.set('Content-Range',range);
    if(head){await upstream.body.cancel();clearTimeout(deadline);return new Response(null,{status:upstream.status,headers})}
    const reader=upstream.body.getReader();let received=0;
    const stream=new ReadableStream<Uint8Array>({
      async pull(controller){
        try{
          const next=await reader.read();
          if(next.done){clearTimeout(deadline);if(received!==Number(size))throw Error('delivery_incomplete');controller.close();return}
          received+=next.value.byteLength;if(received>Number(size)||received>MAX_BYTES)throw Error('delivery_limit');
          controller.enqueue(next.value);
        }catch{clearTimeout(deadline);abort.abort();controller.error(Error('delivery_stream_failed'))}
      },
      async cancel(){clearTimeout(deadline);abort.abort();await reader.cancel()}
    });
    return new Response(stream,{status:upstream.status,headers});
  }catch{clearTimeout(deadline);abort.abort();return new Response('Unavailable',{status:502,headers:security})}
}
export const GET=(request:Request)=>delivery(request);
export const HEAD=(request:Request)=>delivery(request,true);
