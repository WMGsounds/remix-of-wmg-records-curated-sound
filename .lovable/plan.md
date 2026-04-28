I’ll add the Vercel serverless Notion CMS routes exactly as documented, without changing the frontend design or using Lovable Cloud.

Implementation plan:

1. Create the root `api/notion` route tree
   - Add `api/notion/_client.ts`
   - Add `api/notion/_normalize.ts`
   - Add `api/notion/artists.ts`
   - Add `api/notion/releases.ts`
   - Add `api/notion/tracks.ts`
   - Add `api/notion/homepage.ts`
   - Add `api/notion/artist/[slug].ts`
   - Add `api/notion/release/[slug].ts`

2. Use the exact code from `README-NOTION.md`
   - `_client.ts` will instantiate the Notion SDK with `process.env.NOTION_TOKEN`
   - Routes will read `NOTION_ARTISTS_DB_ID`, `NOTION_RELEASES_DB_ID`, and `NOTION_TRACKS_DB_ID`
   - Routes will normalize Notion pages into the existing `src/lib/types.ts` response shape
   - Routes will respond under Vercel’s `/api/notion/*` convention

3. Add the Notion SDK dependency
   - Add `@notionhq/client` to `package.json` dependencies
   - Update the package lockfile so Vercel installs it reliably

4. Keep the frontend behavior unchanged
   - Leave `src/lib/api.ts` as-is
   - When `VITE_USE_MOCKS=false`, it already calls:
     - `/api/notion/artists`
     - `/api/notion/releases`
     - `/api/notion/tracks`
     - `/api/notion/homepage`
     - `/api/notion/artist/[slug]`
     - `/api/notion/release/[slug]`

5. Validate locally as far as possible
   - Confirm the new files are present in the expected root `api/` structure
   - Confirm imports and dependency entries are consistent
   - I won’t change styles, pages, layout, or mock data

Important note about GitHub/Vercel:
- I can make the code changes in the project once you approve this plan.
- I cannot directly commit or push to GitHub from here because git state is managed outside this environment. After the changes are applied, use Lovable’s GitHub sync/export flow or your normal GitHub workflow to push them so Vercel redeploys.

Vercel still needs these Production environment variables set:
- `NOTION_TOKEN`
- `NOTION_ARTISTS_DB_ID`
- `NOTION_RELEASES_DB_ID`
- `NOTION_TRACKS_DB_ID`
- `VITE_USE_MOCKS=false`