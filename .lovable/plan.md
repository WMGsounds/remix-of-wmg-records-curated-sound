## Restore your original WMG favicon

**What went wrong:** In the previous step I added a new `/favicon.svg` (a generated WMG-style mark) and linked it in `<head>`. Modern browsers prefer SVG over `.ico`, so that generated SVG started overriding the original WMG favicon you uploaded. Your uploaded `.ico`/PNG files were never touched — only the new SVG was winning.

**Fix:**

1. Delete `public/favicon.svg` (the generated one).
2. In `index.html`, remove this line:
   ```html
   <link rel="icon" href="/favicon.svg?v=wmg-2" type="image/svg+xml">
   ```
3. Leave everything else from the previous change intact:
   - `/favicon.ico`, `/favicon-16x16.png`, `/favicon-32x32.png`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`, `/safari-pinned-tab.svg`, `/site.webmanifest` — all still pointing at your original WMG assets.
   - Lovable preview script + Lovable preview OG images already removed.
   - `/api/image-proxy` already returns image-only responses with `Content-Disposition: inline`.

After this, browsers will fall back to your original `/favicon.ico` (the file you uploaded). You may need a hard refresh / clear of the favicon cache to see it update on already-open tabs.

**No visual/layout changes.**