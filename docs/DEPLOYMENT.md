# DEPLOYMENT — GitHub and Netlify

Status as of 2026-09-05: the project is a LOCAL git repository at
`~/kea-gauntlet-portable` on Eric's Mac, with branches `gauntlet` (frozen,
pre-re-platform) and `replat-b` (the photoreal re-platform). It has **never
been pushed to a remote**. Nothing is on GitHub yet; nothing is deployed.

Other projects in this workflow (Free Clinic, RentalRights) deploy to Netlify,
so the pattern is familiar — but this repo needs three things first.

---

## 1. BEFORE YOU PUSH — the licence check (do this first)

The repo contains third-party assets. Most are CC0 (Poly Haven textures) and
carry no obligation. But:

- `assets/models/rockatoo.glb` and `kea_base.glb` are **CC-BY** (Macauley.B,
  "Rockatoo character", Sketchfab). CC-BY permits redistribution WITH
  attribution and an indication of changes — both already exist
  (`assets/LICENCES.md` + the in-game credits screen), so pushing these is fine.
- If any asset is ever added under a licence that forbids redistributing the
  SOURCE file (e.g. CGTrader royalty-free), it must NOT be committed to a
  public repo. The gauntlet session flagged this exact hazard. Check
  `assets/LICENCES.md` before making the repo public.

**Recommendation: create the GitHub repo PRIVATE first.** Make it public later,
deliberately, after a licence pass.

## 2. PUSH TO GITHUB

Create an empty repo on github.com (no README, no .gitignore — the project has
its own), then on the Mac:

    cd ~/kea-gauntlet-portable
    git remote add origin https://github.com/<you>/<repo>.git
    git push -u origin gauntlet
    git push -u origin replat-b

Notes:
- The repo is large — `node_modules` was snapshotted into an early commit, plus
  ~16MB of scanned textures, the 5.4MB bird model, and hundreds of capture
  PNGs. Expect a slow first push. If GitHub rejects it for size, the fix is
  Git LFS for `*.png`, `*.glb`, `*.jpg`, or a history rewrite to drop
  node_modules — do that deliberately, not in a hurry.
- Authentication: GitHub no longer accepts passwords. Use a personal access
  token or `gh auth login` (GitHub CLI). Claude Code can run the push commands
  but SHOULD NOT be given the token — create it and authenticate yourself, the
  same rule used for the Sketchfab download.

## 3. DEPLOY TO NETLIFY

The re-platformed game is a Vite project, so it builds to static files —
exactly what Netlify serves.

Site settings:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Branch to deploy:** `replat-b` while the re-platform is in progress; switch
  to `main`/`gauntlet` after a merge.
- **Node version:** set it explicitly (Netlify env var `NODE_VERSION`) to match
  the Mac, so the build doesn't drift.

Two options:
- **Git-connected (recommended):** connect the GitHub repo in Netlify; every
  push to the chosen branch triggers a build and deploy. This is how the other
  projects run.
- **CLI:** `npm i -g netlify-cli`, `netlify login`, `netlify init`, then
  `netlify deploy --prod`. Useful for a one-off before the repo exists.

Gotchas for this project specifically:
- The build must include `assets/` (models, textures, HDRIs). Confirm they end
  up in `dist` — Vite only copies what's imported or what sits in `public/`.
- The bird model and texture sets are heavy. Netlify's free tier bandwidth is
  finite; if the game gets shared widely, watch usage.
- The game is desktop-keyboard-first with 2-player couch controls. A public
  link will get mobile visitors who can't play it — the phone touch layer is on
  the standing board, unbuilt.

## 4. HOW THIS FITS THE GAUNTLET

Deployment does NOT replace certification. The law stays: nothing deploys that
hasn't printed CERTIFIED-SHIP. A sensible order once the remote exists:

    gate.sh green → commit → push → Netlify builds → check the live URL

If you want the machine to handle deploys, add it to OVERNIGHT.md as an
explicit, bounded permission — "push to origin on a certified tip only, never
force-push, never touch the gauntlet branch" — rather than leaving it implied.
