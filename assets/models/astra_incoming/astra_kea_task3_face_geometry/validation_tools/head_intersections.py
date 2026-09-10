#!/usr/bin/env python3
"""Compare non-coplanar strict-interior head triangle crossings with baseline."""
import argparse
import collections
import json
from pathlib import Path

import numpy as np

from validate_head import read_glb, array, sha, uv_surface_components


def segment_hits_triangle(p, q, triangle):
    a, b, c = triangle
    direction = q - p
    edge1, edge2 = b - a, c - a
    h = np.cross(direction, edge2)
    det = np.dot(edge1, h)
    if abs(det) < 1e-10:
        return False
    s = p - a
    u = np.dot(s, h) / det
    if not 1e-7 < u < 1 - 1e-7:
        return False
    cross = np.cross(s, edge1)
    v = np.dot(direction, cross) / det
    if v <= 1e-7 or u + v >= 1 - 1e-7:
        return False
    distance = np.dot(edge2, cross) / det
    return bool(1e-7 < distance < 1 - 1e-7)


def crosses(a, b):
    for i, j in ((0, 1), (1, 2), (2, 0)):
        if segment_hits_triangle(a[i], a[j], b) or segment_hits_triangle(b[i], b[j], a):
            return True
    return False


def intersections(positions, triangles, tri_ids, canonical):
    geom = positions[triangles]
    minima, maxima = geom.min(axis=1), geom.max(axis=1)
    canonical_tris = canonical[triangles]
    pairs = set()
    candidates = 0
    for i in tri_ids:
        possible = tri_ids[tri_ids > i]
        overlap = np.all(maxima[possible] >= minima[i] - 1e-7, axis=1) & np.all(minima[possible] <= maxima[i] + 1e-7, axis=1)
        for j in possible[overlap]:
            if any(v in canonical_tris[j] for v in canonical_tris[i]):
                continue
            candidates += 1
            if crosses(geom[i], geom[j]):
                pairs.add((int(i), int(j)))
    return pairs, candidates


def run(source, result, output, contact_review=None):
    src, dst = read_glb(source), read_glb(result)
    p, q = array(src, 0).astype(float), array(dst, 0).astype(float)
    t = array(src, 5).reshape(-1, 3).astype(int)
    j, w = array(src, 3), array(src, 4)
    hw = np.sum(w * np.isin(j, [43, 44, 45, 46]), axis=1)
    tri_ids = np.flatnonzero(np.all(hw[t] >= .1, axis=1))
    lookup = {}
    canonical = np.empty(len(p), int)
    for i, position in enumerate(p):
        key = tuple(position)
        canonical[i] = lookup.setdefault(key, i)
    before, before_candidates = intersections(p, t, tri_ids, canonical)
    after, after_candidates = intersections(q, t, tri_ids, canonical)
    new, resolved = after - before, before - after
    uv = array(src, 2)
    component, component_sizes = uv_surface_components(p, uv, t)
    exterior_before = {(a, b) for a, b in before if component[a] == 0 and component[b] == 0}
    exterior_after = {(a, b) for a, b in after if component[a] == 0 and component[b] == 0}
    rows = []
    for a, b in sorted(new):
        rows.append({'triangles': [a, b], 'vertices': [t[a].tolist(), t[b].tolist()],
                     'source_uv_surface_components': [int(component[a]), int(component[b])],
                     'both_on_main_exterior_uv_surface': bool(component[a] == component[b] == 0),
                     'uv_centroids': [uv[t[a]].mean(axis=0).tolist(), uv[t[b]].mean(axis=0).tolist()],
                     'source_centroids': [p[t[a]].mean(axis=0).tolist(), p[t[b]].mean(axis=0).tolist()],
                     'result_centroids': [q[t[a]].mean(axis=0).tolist(), q[t[b]].mean(axis=0).tolist()]})
    report = {'source_sha256': sha(src['raw']), 'result_sha256': sha(dst['raw']),
              'scope': 'Head triangles all three vertices have summed head/jaw weights>=0.1. Excludes pairs sharing an original exact-coincident position. Tests strict interior segment/triangle crossings only; ignores coplanar overlap and grazing contact. Numerical diagnostic, not exhaustive collision certification.',
              'head_triangles_tested': len(tri_ids), 'source_candidates': before_candidates,
              'result_candidates': after_candidates, 'source_crossing_pairs': sorted(before),
              'result_crossing_pairs': sorted(after), 'new_crossing_pairs': sorted(new),
              'source_uv_component_sizes': component_sizes,
              'main_exterior_surface_component': 0,
              'source_main_exterior_crossing_pairs': sorted(exterior_before),
              'result_main_exterior_crossing_pairs': sorted(exterior_after),
              'new_main_exterior_crossing_pairs': sorted(exterior_after - exterior_before),
              'surface_classification_note': 'The largest original UV-continuous component is the exterior body/head/bill surface. Smaller head components contain detached mouth/lower-jaw interiors and tiny fragments. Closing the gape can create hidden internal contacts; exterior/exterior crossings are reported separately.',
              'resolved_source_crossing_pairs': sorted(resolved), 'new_crossing_details': rows}
    if contact_review:
        review_bytes = Path(contact_review).read_bytes()
        review = json.loads(review_bytes)
        upper_faces = set(review['upper_lip_exterior_face_ids'])
        lower_faces = set(review['lower_lip_exterior_face_ids'])
        upper_vertices = set(review['upper_lip_vertex_ids'])
        lower_vertices = set(review['lower_lip_vertex_ids'])
        upper_weight = np.sum(w * np.isin(j, [45, 46]), axis=1)
        lower_weight = np.sum(w * (j == 44), axis=1)
        face_checks = []
        for role, faces, vertices, weight in [('upper', upper_faces, upper_vertices, upper_weight),
                                             ('lower', lower_faces, lower_vertices, lower_weight)]:
            for face in sorted(faces):
                assert component[face] == 0
                assert any(vertex in vertices for vertex in t[face]), f'{role} lip face{face} has no declared lip anchor'
                assert np.mean(weight[t[face]]) > .01, f'{role} lip face{face} has no corresponding jaw influence'
                face_checks.append({'face': face, 'role': role, 'vertices': t[face].tolist(),
                                    'contains_declared_lip_anchor': True,
                                    'source_corresponding_jaw_weight_mean': float(np.mean(weight[t[face]]))})

        def is_lip_pair(pair):
            a, b = pair
            return (a in upper_faces and b in lower_faces) or (b in upper_faces and a in lower_faces)

        declared = {pair for pair in exterior_after if is_lip_pair(pair)}
        new_exterior = exterior_after - exterior_before
        report['mandibular_contact_review'] = {
            'review_file': str(Path(contact_review)), 'review_file_sha256': sha(review_bytes),
            'design_method': review['method'],
            'classification': 'Only pairs with one exact declared upper-lip exterior face and one exact declared lower-lip exterior face are classified as intended mandibular contact. The listed faces are independently checked for lip-anchor membership, main-exterior component and corresponding original jaw influence.',
            'upper_lip_exterior_face_ids': sorted(upper_faces), 'lower_lip_exterior_face_ids': sorted(lower_faces),
            'face_classification_checks': face_checks,
            'all_declared_lip_contact_pairs_in_result': sorted(declared),
            'new_declared_lip_contact_pairs': sorted(new_exterior & declared),
            'unclassified_result_exterior_crossing_pairs': sorted(exterior_after - declared),
            'unclassified_new_exterior_crossing_pairs': sorted(new_exterior - declared),
            'occlusion_scope': 'Numerical classification confirms the intended upper/lower lip location, not visibility. The separate rest/folded/three-quarter render review must confirm that this shallow contact closes the gape without a visible surface fold.',
            'raw_crossing_pairs_retained_without_suppression': True
        }
    Path(output).write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'result_sha256': report['result_sha256'], 'head_triangles_tested': report['head_triangles_tested'],
                      'source_crossing_count': len(before), 'result_crossing_count': len(after),
                      'new_crossing_count': len(new), 'new_main_exterior_crossing_pairs': report['new_main_exterior_crossing_pairs']}))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('result')
    parser.add_argument('output')
    parser.add_argument('--contact-review')
    args = parser.parse_args()
    run(args.source, args.result, args.output, args.contact_review)
