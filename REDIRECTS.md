# Redirects policy (vercel.json)

`vercel.json` is the ONLY redirect mechanism in this project.

Vercel validates `vercel.json` against a strict JSON schema
(`additionalProperties: false`) and JSON has no comment syntax, so this policy
lives here instead of as a header comment inside the file. Treat the two as one
document: do not change `redirects` in `vercel.json` without reading this.

## Rules

1. Every renamed or removed URL gets a `301` entry in the `redirects` array of
   `vercel.json` (`"permanent": true`). No exceptions, including vanity URLs.
2. Client-side redirects are never an acceptable substitute. No
   `window.location`, no `<Navigate>`, no `<meta http-equiv="refresh">`, no
   route component that exists only to bounce the user. A crawler must see a
   real `301` from the edge, before any JavaScript runs.
3. Because of rule 2, redirect-only URLs (e.g. `/spotify`) have no React route
   and no page component. Link to them with a plain `<a href="...">`, never
   with react-router `<Link>` — a `<Link>` would be handled in the client and
   hit the 404 page instead of the edge redirect.
4. Redirect-only URLs are never pre-rendered and never appear in `sitemap.xml`.
5. A removed URL with NO true equivalent must NOT 301 to a hub page (Google
   treats that as a soft 404). It is rewritten to `/api/gone`, which returns a
   real HTTP `410` with a short "This page has been removed" body. Rewrites
   preserve the function's status code, and Vercel applies rewrites only after
   the filesystem check, so a rebuilt page of the same slug would win.
6. Redirects do not apply under `vite dev`. That is expected; verify them on a
   Vercel preview deployment or production, which both apply `vercel.json`.

## Current redirects

| Source | Destination | Why |
| --- | --- | --- |
| `/artists/kofi-river` | `/artists/kofi-rivers` | Misspelt slug; the real artist page exists |
| `/spotify` | WMG Spotify profile | Vanity URL used in print and on the About page |
| `/artists/jack-rivers` | `/artists` | Removed artist page |
| `wmgsounds.com/*` | `https://www.wmgsounds.com/*` | Apex to canonical www host |
| `wmgr-soundscapes.lovable.app/*` | `https://www.wmgsounds.com/*` | Legacy Lovable host to canonical domain |

## Current 410s (rewrites to `/api/gone`)

| Source | Why |
| --- | --- |
| `/artists/marcus-vale` | Artist removed; no equivalent page |
| `/artists/iris-naoko` | Artist removed; no equivalent page |
| `/releases/if-the-road-asks` | Release removed; no equivalent page |
