/**
 * HTTP 410 (Gone) endpoint for permanently removed URLs.
 *
 * Per REDIRECTS.md, a removed URL that has a true equivalent gets a 301 in
 * vercel.json. A removed URL with NO equivalent must not 301 to a hub page
 * (that is a soft-404) and must not return 200 — it returns a real 410 from
 * the edge, before any JavaScript runs. vercel.json rewrites those exact
 * paths here; rewrites preserve this function's status code.
 */
export default function handler(_req: unknown, res: {
  writeHead: (status: number, headers: Record<string, string>) => { end: (body?: string) => void };
}) {
  res
    .writeHead(410, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
      "X-Robots-Tag": "noindex",
    })
    .end(
      `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">` +
        `<meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<meta name="robots" content="noindex">` +
        `<title>Page removed | Wareham Music Group</title></head>` +
        `<body><h1>This page has been removed</h1>` +
        `<p><a href="https://www.wmgsounds.com/">Wareham Music Group home</a></p></body></html>`,
    );
}
