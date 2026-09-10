#!/usr/bin/env python3
"""Exact geometry plot: edited vertices in source model and head silhouettes."""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
import numpy as np

from validate_head import read_glb, array, byte_rows_differ, sha


def edges(triangles):
    out = set()
    for tri in triangles:
        for a, b in ((0, 1), (1, 2), (2, 0)):
            out.add(tuple(sorted((int(tri[a]), int(tri[b])))))
    return np.array(sorted(out), int)


def run(source, result, output):
    before, after = read_glb(source), read_glb(result)
    p, q = array(before, 0), array(after, 0)
    changed = byte_rows_differ(p, q)
    t = array(before, 5).reshape(-1, 3).astype(int)
    j, w = array(before, 3), array(before, 4)
    hw = np.sum(w * np.isin(j, [43, 44, 45, 46]), axis=1)
    all_edges = edges(t)
    head_tri = np.all(hw[t] >= .1, axis=1)
    head_edges = edges(t[head_tri])
    fig, (ax, zoom) = plt.subplots(1, 2, figsize=(16, 8.4), gridspec_kw={'width_ratios': [1.35, 1]})
    fig.patch.set_facecolor('#faf9f5')
    for panel in (ax, zoom):
        panel.set_facecolor('#faf9f5')
        panel.spines[['top', 'right']].set_visible(False)
        panel.set_aspect('equal', adjustable='box')
        panel.set_xlabel('Original model X units; bill faces left')
        panel.set_ylabel('Original model Y units')
        panel.grid(color='#dddcd6', linewidth=.5)
    ax.add_collection(LineCollection(p[all_edges, :2], colors='#bfc0bc', linewidths=.35, alpha=.5))
    ax.scatter(p[changed, 0], p[changed, 1], s=7, color='#ac4c35', alpha=.85, zorder=3,
               label=f'{int(changed.sum())} vertices with changed POSITION bytes')
    ax.set_xlim(p[:, 0].min() - 5, p[:, 0].max() + 5)
    ax.set_ylim(p[:, 1].min() - 5, p[:, 1].max() + 5)
    ax.set_title('Edit scope on the original mesh', fontsize=15, loc='left', pad=14)
    ax.legend(loc='lower left', frameon=False, fontsize=9)
    zoom.add_collection(LineCollection(p[head_edges, :2], colors='#9a9b96', linewidths=.8, alpha=.45, label='Source head'))
    zoom.add_collection(LineCollection(q[head_edges, :2], colors='#276d74', linewidths=.75, alpha=.8, label='Revised head'))
    active = np.unique(t[head_tri])
    low = np.minimum(p[active, :2].min(0), q[active, :2].min(0))
    high = np.maximum(p[active, :2].max(0), q[active, :2].max(0))
    zoom.set_xlim(low[0] - 1.5, high[0] + 1.5)
    zoom.set_ylim(low[1] - 1.5, high[1] + 1.5)
    zoom.set_title('Source and revised head geometry', fontsize=15, loc='left', pad=14)
    zoom.legend(loc='lower right', frameon=False, fontsize=10)
    fig.suptitle('Task 3 — exact vertex edit scope', x=.07, ha='left', fontsize=20, weight='bold')
    fig.text(.07, .022, 'Orthographic XY projection of GLB accessor data, before animation. Colours identify geometry changes; this is not a material render.', fontsize=10, color='#4f524f')
    fig.text(.07, .004, 'Result SHA-256: ' + sha(after['raw']), fontsize=8, color='#646761')
    fig.tight_layout(rect=(.025, .05, .99, .93), w_pad=3)
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=140, facecolor=fig.get_facecolor())
    plt.close(fig)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('result')
    parser.add_argument('output')
    args = parser.parse_args()
    run(args.source, args.result, args.output)
