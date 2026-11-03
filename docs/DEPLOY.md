# Deploying the prototypes

The build is plain static files — no server, no env vars.

## GitHub Pages (what we use for submittable links)

```bash
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to main.

That gives these public URLs:

- `https://<user>.github.io/<repo>/` — the main page
- `https://<user>.github.io/<repo>/board/` — boarding-pass intro (draft)
- `https://<user>.github.io/<repo>/prototype-a/` — Rank the 50 (draft)
- `https://<user>.github.io/<repo>/prototype-b/` — Spin the globe, pick two (draft)
- `https://<user>.github.io/<repo>/story/` — site outline (draft)

All are deep-linkable and reachable from the menu bar at the top of every page.

## Why the paths work under a sub-path

Static files are fetched through SvelteKit `base` (see `src/lib/data.js`), not from
the domain root, and `svelte.config.js` sets `paths.relative: true`. A leading-slash
fetch would 404 the moment the site is served from anywhere other than `/`.

`appDir` is renamed from the default `_app` because some hosts reserve leading
underscores; the workflow also writes `.nojekyll` so Pages serves everything.
