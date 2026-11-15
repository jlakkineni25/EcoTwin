# Putting EcoTwin online (GitHub Pages + hourly live data)

The site is static files. Two GitHub Actions workflows run it:

| Workflow | When | What it does |
|---|---|---|
| `.github/workflows/deploy-pages.yml` | on a push to `main` that changes `frontend/`, or by hand | builds the page (`VITE_BASE=/EcoTwin/`) and publishes it on GitHub Pages |
| `.github/workflows/live-refresh.yml` | twice an hour (minutes 7 and 37), or by hand | runs `v2_clean/live_refresh.py` (OpenAQ + Open-Meteo, 5 final models) and force-pushes the 5 live JSON files to the branch `live-data` |

The page reads the live files from `https://raw.githubusercontent.com/<user>/<repo>/live-data/` (set at build time through `VITE_LIVE_BASE`), so
fresh data does not need a new site deploy. If the live files are missing or older than 6 hours, the page falls back to the replay of the stored test days.

## One-time setup (in the GitHub repository settings, done by the repository owner)

1. **Secret:** Settings > Secrets and variables > Actions > New repository secret. Name `OPENAQ_API_KEY`, value = the OpenAQ key. Never put the key in a file or a chat.
2. **Pages:** Settings > Pages > Source = "GitHub Actions".
3. Push the code to `main` (this includes `frontend/public/data/`, about 65 MB in roughly 3,900 small files).
4. Actions tab > `live-refresh` > Run workflow (first run takes about 6 minutes). Check that a `live-data` branch appears with 5 files.
5. Actions tab > `deploy-pages` runs by itself on the push (or run it by hand). The address is `https://<user>.github.io/EcoTwin/`.

## Things to know

- **Schedule is not guaranteed:** GitHub can delay or skip scheduled runs, especially on new or quiet repositories (on 2026-11-15 the first hourly slots were skipped for several hours). That is why the job is scheduled twice an hour. If the site shows "old snapshot", start it by hand: Actions tab > live-refresh > Run workflow (about 6 to 8 minutes). Each run makes about 285 OpenAQ calls, so two runs an hour stay far below OpenAQ's limits.
- **Delay:** a run can also start a few minutes late, and `raw.githubusercontent.com` caches files for about 5 minutes, so the page can be up to about 15 minutes behind the stations' latest hour (OpenAQ itself lags the stations by 2 to 4 hours).
- **Inactivity:** GitHub switches scheduled workflows off after 60 days without repository activity. Re-enable them in the Actions tab if that happens.
- **Failure behaviour:** if OpenAQ or the run fails, nothing is published and the previous live files stay. After 6 hours the page shows "old snapshot" and the visitor can switch to replay.
- **History:** the `live-data` branch holds only the latest run (force-pushed). `live_log.csv` and past live frames are not kept in the cloud.
- **Regenerating site data:** after changing results or the model, run `python v2_clean/make_frontend_data.py`, then commit `frontend/public/data/` and push.
- **Local test of the Pages build** (PowerShell, from `frontend`):
  `$env:VITE_BASE="/EcoTwin/"; npx vite build --outDir "$env:TEMP\pages_check"; npx vite preview --outDir "$env:TEMP\pages_check" --port 4173`, then open `http://localhost:4173/EcoTwin/`. Run `Remove-Item Env:VITE_BASE` afterwards.
