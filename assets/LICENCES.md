# ASSET LICENCES — the ledger

REPLAT.md retired the NO EXTERNAL ASSETS law on one condition: **no asset lands
without its licence line.** This file is that condition. Every entry records what
the file is, where it came from, who made it, the licence, and the publisher's own
md5 — so a later session can re-verify the bytes rather than trust them.

Verification protocol: `md5 -q assets/<path>` must equal the md5 below, which was
taken from the publisher's API at import time and NOT from the downloaded file.
Both were compared at import; a mismatch means the file was altered or truncated.

---

## HDRI ENVIRONMENTS  (REPLAT P2 — sky and sun, 2026-09-03)

Source: Poly Haven (polyhaven.com). **Every Poly Haven asset is CC0** — public
domain dedication, no attribution required, redistribution and commercial use
permitted. Attribution is given here anyway, because the authors did the work.

| file | asset | author(s) | licence | md5 (1k .hdr) |
|---|---|---|---|---|
| `hdri/pizzo_pernice_1k.hdr` | pizzo_pernice | Andreas Mischok | CC0 | `c1b8292bc6f6d6c21fbaed8b2fdcc372` |
| `hdri/kloofendal_43d_clear_1k.hdr` | kloofendal_43d_clear | Greg Zaal | CC0 | `036ef061f3f6c20f509599552e60cb16` |
| `hdri/dry_field_1k.hdr` | dry_field | Greg Zaal | CC0 | `7d0de3d3879054859c32776371ef29c6` |

**WHY THREE AND NOT ONE.** The HDRI is a taste call, so it went to a variant strip
per the WAVES law of best (never ship attempt one unseen). All three are kept in the
tree so Eric can reshoot any of them with `KEASKY='{"hdri":"<name>_1k.hdr"}'` rather
than needing this session's network access back. `pizzo_pernice` is the shipped
default — see ARTBIBLE.md PHASE 2 for the recipe and the reasoning.

**WHY 1k AND NOT 2k/4k.** The HDRI is used for image-based lighting only, never as
a visible background — the game keeps its own painted sky dome, which is authored
art and the thing the NZ palette is tuned to. IBL is consumed as a PMREM-blurred
irradiance/specular cube, so resolution above 1k is discarded by the convolution and
costs only download and VRAM. 1.5MB against 6MB for 2k, with no visible difference
in the lighting it produces.

**SIZE NOTE.** These are the first binary assets in the repo. 4.7MB total. If the
asset tier grows past a few tens of MB, that is the moment to reach for git-lfs or a
fetch-on-build step — not before.
