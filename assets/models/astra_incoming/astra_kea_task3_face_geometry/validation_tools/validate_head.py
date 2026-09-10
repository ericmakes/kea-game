#!/usr/bin/env python3
"""Independent, read-only audit of a surgical POSITION/NORMAL-only GLB edit.

This verifier does not import any sculpting or packing code. The source GLB,
the result GLB, and their decoded geometry are compared independently.
"""
from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path
import struct
import sys

import numpy as np

COMPONENTS = {5120: '<i1', 5121: '<u1', 5122: '<i2', 5123: '<u2', 5125: '<u4', 5126: '<f4'}
WIDTHS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT2': 4, 'MAT3': 9, 'MAT4': 16}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read_glb(path):
    raw = Path(path).read_bytes()
    magic, version, declared = struct.unpack_from('<4sII', raw)
    assert magic == b'glTF' and version == 2 and declared == len(raw), 'Invalid GLB header'
    chunks = []
    offset = 12
    while offset < len(raw):
        length, kind = struct.unpack_from('<II', raw, offset)
        assert length % 4 == 0 and offset + 8 + length <= len(raw)
        chunks.append({'kind': kind, 'header_offset': offset, 'data_offset': offset + 8,
                       'length': length, 'data': raw[offset + 8:offset + 8 + length]})
        offset += 8 + length
    assert offset == len(raw)
    assert [c['kind'] for c in chunks] == [0x4E4F534A, 0x004E4942]
    doc = json.loads(chunks[0]['data'])
    return {'raw': raw, 'doc': doc, 'chunks': chunks, 'bin': chunks[1]['data'],
            'bin_file_offset': chunks[1]['data_offset']}


def layout(model, index):
    accessor = model['doc']['accessors'][index]
    assert 'sparse' not in accessor, 'Sparse accessors unsupported by this exact-payload audit'
    view = model['doc']['bufferViews'][accessor['bufferView']]
    assert view['buffer'] == 0
    dtype = np.dtype(COMPONENTS[accessor['componentType']])
    width = WIDTHS[accessor['type']]
    row_bytes = width * dtype.itemsize
    offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    stride = view.get('byteStride', row_bytes)
    return accessor, view, dtype, width, row_bytes, offset, stride


def array(model, index):
    a, _, dtype, width, _, offset, stride = layout(model, index)
    return np.ndarray((a['count'], width), dtype=dtype, buffer=model['bin'],
                      offset=offset, strides=(stride, dtype.itemsize)).copy()


def payload(model, index):
    a, _, _, _, row_bytes, offset, stride = layout(model, index)
    return b''.join(model['bin'][offset + row * stride:offset + row * stride + row_bytes]
                    for row in range(a['count']))


def mark_payload(model, index, mask):
    a, _, _, _, row_bytes, offset, stride = layout(model, index)
    for row in range(a['count']):
        start = model['bin_file_offset'] + offset + row * stride
        mask[start:start + row_bytes] = True


def byte_rows_differ(a, b):
    return np.any(a.view(np.uint8).reshape(len(a), -1) != b.view(np.uint8).reshape(len(b), -1), axis=1)


def ids(mask):
    return np.flatnonzero(mask).astype(int).tolist()


def bounds(values):
    return {'min': values.min(axis=0).tolist(), 'max': values.max(axis=0).tolist()}


def spans(mask):
    """Half-open contiguous byte ranges."""
    padded = np.r_[False, mask, False].astype(np.int8)
    edges = np.flatnonzero(np.diff(padded))
    return [[int(a), int(b)] for a, b in edges.reshape(-1, 2)]


def uv_surface_components(positions, uv, triangles):
    """Identify original UV-continuous surface components from shared edges."""
    parent = np.arange(len(triangles))

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    keys = [tuple(row) for row in np.round(np.c_[positions * 1e5, uv * 1e6]).astype(np.int64)]
    edges = {}
    for face, vertices in enumerate(triangles):
        for a, b in ((0, 1), (1, 2), (2, 0)):
            edge = tuple(sorted([keys[vertices[a]], keys[vertices[b]]]))
            if edge in edges:
                aa, bb = find(face), find(edges[edge])
                if aa != bb:
                    parent[bb] = aa
            else:
                edges[edge] = face
    groups = collections.defaultdict(list)
    for face in range(len(triangles)):
        groups[find(face)].append(face)
    groups = sorted(groups.values(), key=len, reverse=True)
    component = np.zeros(len(triangles), int)
    for index, faces in enumerate(groups):
        component[faces] = index
    return component, [len(group) for group in groups]


def verify(source_path, result_path, report_dir):
    src, dst = read_glb(source_path), read_glb(result_path)
    a, b = src['doc'], dst['doc']
    assert len(src['raw']) == len(dst['raw']), 'File length changed'
    assert src['raw'][:12] == dst['raw'][:12], 'GLB header changed'
    assert src['chunks'][0]['data'] == dst['chunks'][0]['data'], 'JSON bytes changed'
    assert a == b
    for before, after in zip(src['chunks'], dst['chunks']):
        start = before['header_offset']
        assert start == after['header_offset']
        assert src['raw'][start:start + 8] == dst['raw'][start:start + 8], 'Chunk header changed'
    assert len(a['meshes']) == 1 and len(a['meshes'][0]['primitives']) == 1
    primitive = a['meshes'][0]['primitives'][0]
    assert primitive.get('mode', 4) == 4
    pos_id, normal_id = primitive['attributes']['POSITION'], primitive['attributes']['NORMAL']
    assert (pos_id, normal_id) == (0, 1)
    assert len(a['skins']) == 1 and len(a['skins'][0]['joints']) == 101
    assert a['accessors'][pos_id]['count'] == 3013
    assert a['accessors'][primitive['indices']]['count'] // 3 == 4927
    assert not a.get('extensionsUsed') and not a.get('extensionsRequired')
    assert len(a['buffers']) == 1 and 'uri' not in a['buffers'][0]

    allowed = np.zeros(len(src['raw']), dtype=bool)
    mark_payload(src, pos_id, allowed)
    mark_payload(src, normal_id, allowed)
    changed_bytes = np.frombuffer(src['raw'], dtype=np.uint8) != np.frombuffer(dst['raw'], dtype=np.uint8)
    assert not np.any(changed_bytes & ~allowed), 'A byte outside POSITION/NORMAL accessor payloads changed'
    outside_before = np.frombuffer(src['raw'], dtype=np.uint8)[~allowed].tobytes()
    outside_after = np.frombuffer(dst['raw'], dtype=np.uint8)[~allowed].tobytes()
    assert outside_before == outside_after

    accessor_rows = []
    roles = {index: role for role, index in primitive['attributes'].items()}
    roles[primitive['indices']] = 'INDICES'
    roles[a['skins'][0]['inverseBindMatrices']] = 'INVERSE_BIND_MATRICES'
    animation_ids = set()
    for animation in a.get('animations', []):
        for sampler in animation['samplers']:
            animation_ids.update((sampler['input'], sampler['output']))
    for index in animation_ids:
        roles.setdefault(index, 'ANIMATION')
    for index in range(len(a['accessors'])):
        before, after = payload(src, index), payload(dst, index)
        equal = before == after
        assert equal or index in (pos_id, normal_id), f'Forbidden accessor {index} changed'
        la = layout(src, index)
        accessor_rows.append({'accessor': index, 'role': roles.get(index, 'OTHER'),
                              'buffer_view': a['accessors'][index]['bufferView'],
                              'binary_offset': la[5], 'row_stride_bytes': la[6],
                              'payload_bytes': len(before), 'byte_identical': equal,
                              'changed_bytes': sum(x != y for x, y in zip(before, after)),
                              'source_sha256': sha(before), 'result_sha256': sha(after)})
    changed_accessors = [row['accessor'] for row in accessor_rows if not row['byte_identical']]
    assert changed_accessors == [0, 1], f'Expected exactly POSITION and NORMAL to change: {changed_accessors}'

    view_rows = []
    allowed_views = {a['accessors'][index]['bufferView'] for index in (pos_id, normal_id)}
    for index, view in enumerate(a['bufferViews']):
        off, length = view.get('byteOffset', 0), view['byteLength']
        before, after = src['bin'][off:off + length], dst['bin'][off:off + length]
        equal = before == after
        assert equal or index in allowed_views, f'Forbidden buffer view {index} changed'
        view_rows.append({'buffer_view': index, 'bytes': length, 'byte_identical': equal,
                          'source_sha256': sha(before), 'result_sha256': sha(after)})
    image_rows = []
    for index, image in enumerate(a.get('images', [])):
        assert 'uri' not in image
        row = view_rows[image['bufferView']]
        assert row['byte_identical'], f'Embedded image {index} changed'
        image_rows.append({'image': index, 'mime_type': image.get('mimeType'),
                           'buffer_view': image['bufferView'], 'bytes': row['bytes'],
                           'byte_identical': True, 'sha256': row['source_sha256']})

    p0f, p1f = array(src, pos_id), array(dst, pos_id)
    n0f, n1f = array(src, normal_id), array(dst, normal_id)
    position_changed, normal_changed = byte_rows_differ(p0f, p1f), byte_rows_differ(n0f, n1f)
    p0, p1, n0, n1 = [x.astype(np.float64) for x in (p0f, p1f, n0f, n1f)]
    assert np.isfinite(p1).all() and np.isfinite(n1).all(), 'Non-finite geometry'
    normal_error = np.abs(np.linalg.norm(n1, axis=1) - 1)
    assert normal_error.max() < 2e-6, 'Normals are not unit length'
    assert np.array_equal(p0.min(0), p1.min(0)) and np.array_equal(p0.max(0), p1.max(0)), 'Global decoded bounds changed'
    position_meta = a['accessors'][pos_id]
    assert np.array_equal(p1.min(0), position_meta['min']) and np.array_equal(p1.max(0), position_meta['max']), 'Declared POSITION bounds are not exact'

    joints = array(src, primitive['attributes']['JOINTS_0'])
    weights = array(src, primitive['attributes']['WEIGHTS_0'])
    joint_names = [a['nodes'][node]['name'] for node in a['skins'][0]['joints']]
    assert [i for i, name in enumerate(joint_names) if '_Head_bone_' in name] == [43]
    head_weight = np.sum(weights * np.isin(joints, [43, 44, 45, 46]), axis=1)
    upper_weight = np.sum(weights * np.isin(joints, [45, 46]), axis=1)
    lower_weight = np.sum(weights * (joints == 44), axis=1)
    # Independent source-space anatomical envelope. This excludes wing, body,
    # neck below the jaw, tail and feet even if they have tiny stray head weights.
    allowed_head = (head_weight >= .1) & (p0[:, 0] <= 1.0) & (p0[:, 1] >= 52.0) & (np.abs(p0[:, 2] + 24.31745) <= 7.0)
    assert not np.any(position_changed & ~allowed_head), f'Positions outside independent head envelope: {ids(position_changed & ~allowed_head)}'
    assert not np.any(normal_changed & ~allowed_head), f'Normals outside independent head envelope: {ids(normal_changed & ~allowed_head)}'
    assert np.array_equal(p0f[~allowed_head], p1f[~allowed_head])
    assert np.array_equal(n0f[~allowed_head], n1f[~allowed_head])
    displacement = np.linalg.norm(p1 - p0, axis=1)
    normal_angle = np.rad2deg(np.arccos(np.clip(np.sum(n0 * n1, axis=1) /
                                  (np.linalg.norm(n0, axis=1) * np.linalg.norm(n1, axis=1)), -1, 1)))

    tris = array(src, primitive['indices']).reshape(-1, 3).astype(int)
    affected_faces = np.any(position_changed[tris], axis=1)
    crosses = [np.cross(p[tris[:, 1]] - p[tris[:, 0]], p[tris[:, 2]] - p[tris[:, 0]]) for p in (p0, p1)]
    lengths = [np.linalg.norm(x, axis=1) for x in crosses]
    areas = [x * .5 for x in lengths]
    # Absolute degeneracy is separate from intentional affine shrinking of
    # hidden lining. A small relative area alone does not make a face zero-area.
    newly_collapsed = (areas[0] > 1e-10) & (areas[1] <= 1e-10)
    strongly_compressed = (areas[0] > 1e-10) & (areas[1] <= areas[0] * 1e-4) & ~newly_collapsed
    assert not newly_collapsed.any(), f'New collapsed triangles: {ids(newly_collapsed)}'
    assert np.array_equal(areas[0][~affected_faces], areas[1][~affected_faces])
    face_normals = [cross / length[:, None] for cross, length in zip(crosses, lengths)]
    rotation_dot = np.sum(face_normals[0] * face_normals[1], axis=1)
    face_rotation = np.rad2deg(np.arccos(np.clip(rotation_dot, -1, 1)))
    shading_dot = [np.sum(fn * vn[tris].mean(axis=1), axis=1) for fn, vn in zip(face_normals, (n0, n1))]
    new_shading_disagreement = affected_faces & (shading_dot[0] > .2) & (shading_dot[1] < -.05)
    # A face normal rotated >90 degrees is a diagnostic, not proof of inverted
    # topology: a legitimate hook can rotate a whole triangle through that angle.
    rotated_90 = affected_faces & (rotation_dot < 0)
    area_ratio = areas[1] / np.maximum(areas[0], 1e-30)

    coincident = collections.defaultdict(list)
    for index, position in enumerate(p0f):
        coincident[tuple(position)].append(index)
    head_seam_groups = [group for group in coincident.values() if len(group) > 1 and np.any(allowed_head[group])]
    split_groups = [group for group in head_seam_groups if not np.all(n0f[group] == n0f[group[0]])]
    maximum_seam_gap = max((float(np.max(np.linalg.norm(p1[group] - p1[group[0]], axis=1))) for group in head_seam_groups), default=0.0)
    components, _ = uv_surface_components(p0, array(src, primitive['attributes']['TEXCOORD_0']), tris)
    new_exterior_shading_disagreement = new_shading_disagreement & (components == 0)
    new_internal_shading_disagreement = new_shading_disagreement & (components != 0)
    tiny_area_details = [{'face': int(face), 'source_uv_component': int(components[face]),
                          'source_area_source_units_squared': float(areas[0][face]),
                          'result_area_source_units_squared': float(areas[1][face]),
                          'result_to_source_area_ratio': float(area_ratio[face])}
                         for face in np.flatnonzero(strongly_compressed)]
    vertex_components = [set() for _ in p0]
    for face, vertices in enumerate(tris):
        for vertex in vertices:
            vertex_components[vertex].add(int(components[face]))
    separated_groups = []
    exterior_seam_groups = []
    for group in head_seam_groups:
        exterior = [vertex for vertex in group if 0 in vertex_components[vertex]]
        if len(exterior) > 1:
            exterior_seam_groups.append(exterior)
        gap = float(np.max(np.linalg.norm(p1[group] - p1[group[0]], axis=1)))
        if gap:
            separated_groups.append({'vertex_ids': group, 'source_position': p0[group[0]].tolist(),
                                     'result_positions': p1[group].tolist(), 'maximum_gap_source_units': gap,
                                     'source_uv_components': [sorted(vertex_components[vertex]) for vertex in group],
                                     'contains_main_exterior_vertex': bool(exterior)})
    maximum_exterior_seam_gap = max((float(np.max(np.linalg.norm(p1[group] - p1[group[0]], axis=1))) for group in exterior_seam_groups), default=0.0)
    assert maximum_exterior_seam_gap == 0, f'Exact coincident exterior head seams separated: {maximum_exterior_seam_gap}'
    preserved_split_groups = sum(not np.all(n1f[group] == n1f[group[0]]) for group in split_groups)

    report_dir = Path(report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    with (report_dir / 'ACCESSOR_AUDIT.csv').open('w', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(accessor_rows[0]))
        writer.writeheader()
        writer.writerows(accessor_rows)
    with (report_dir / 'CHANGED_VERTICES.csv').open('w', newline='') as handle:
        names = ['vertex', 'position_changed', 'normal_changed', 'source_x', 'source_y', 'source_z',
                 'result_x', 'result_y', 'result_z', 'displacement_source_units', 'normal_angle_degrees',
                 'head_jaw_weight', 'upper_jaw_weight', 'lower_jaw_weight']
        writer = csv.DictWriter(handle, fieldnames=names)
        writer.writeheader()
        for index in np.flatnonzero(position_changed | normal_changed):
            writer.writerow(dict(zip(names, [int(index), bool(position_changed[index]), bool(normal_changed[index]),
                                               *p0[index], *p1[index], displacement[index], normal_angle[index],
                                               head_weight[index], upper_weight[index], lower_weight[index]])))
    diagnostics = []
    if rotated_90.any():
        diagnostics.append('Some changed faces rotate more than90 degrees relative to source; this is a geometric diagnostic, not by itself proof of reversed winding.')
    if new_exterior_shading_disagreement.any():
        diagnostics.append('Some changed faces newly disagree with their interpolated shading normals; inspect the listed faces before accepting the revision.')
    elif new_internal_shading_disagreement.any():
        diagnostics.append('New face/shading-normal disagreements are confined to internal mouth components; the main exterior surface has no new shading-normal disagreements by this criterion.')
    if separated_groups:
        diagnostics.append('Originally coincident mouth-component vertices have separated during the internal lining reposition. Every pair of duplicate vertices on the main exterior head surface remains exactly coincident; the separated groups are listed explicitly.')
    if tiny_area_details:
        diagnostics.append('Some faces retain positive nondegenerate area but have less than0.01% of their original area after the intentional lining shrink. Their components, absolute areas and area ratios are listed; this is an explicit small-area advisory, not a claim of robust manifold geometry.')

    status = ('PASS_BYTE_CONSTRAINTS_WITH_EXTERIOR_SHADING_REVIEW' if new_exterior_shading_disagreement.any()
              else 'PASS_WITH_INTERNAL_MOUTH_ADVISORIES' if (new_internal_shading_disagreement.any() or separated_groups)
              else 'PASS')
    report = {
        'status': status,
        'byte_and_head_scope_contract_status': 'PASS',
        'source_file': str(Path(source_path).resolve()), 'result_file': str(Path(result_path).resolve()),
        'source_sha256': sha(src['raw']), 'result_sha256': sha(dst['raw']),
        'source_bytes': len(src['raw']), 'result_bytes': len(dst['raw']),
        'counts': {'joints': 101, 'vertices': 3013, 'triangles': 4927, 'animations': len(a.get('animations', []))},
        'byte_preservation': {
            'only_position_and_normal_payload_bytes_changed': True,
            'changed_accessors': changed_accessors, 'changed_buffer_views': sorted(allowed_views),
            'total_changed_bytes': int(changed_bytes.sum()),
            'json_entire_chunk_byte_identical': True, 'json_sha256': sha(src['chunks'][0]['data']),
            'file_and_chunk_headers_byte_identical': True, 'file_and_buffer_lengths_unchanged': True,
            'all_other_file_bytes_including_padding_byte_identical': True,
            'unchanged_complement_bytes': int((~allowed).sum()),
            'source_unchanged_complement_sha256': sha(outside_before),
            'result_unchanged_complement_sha256': sha(outside_after),
            'uv_skin_weights_joint_indices_indices_inverse_bind_matrices_animations_byte_identical': True,
            'rig_names_hierarchy_transforms_materials_and_all_metadata_byte_identical': True,
            'all_embedded_images_byte_identical': True,
            'source_non_image_and_non_geometry_payloads_also_match_original_handoff': 'Not evaluated here; this audit compares the stated Task1b baseline.'
        },
        'head_only': {
            'independent_envelope_description': 'Original source-space X<=1, Y>=52, abs(Z+24.31745)<=7, summed head/upper/lower jaw weights>=0.1.',
            'head_joint_indices': [43, 44, 45, 46], 'head_joint_names': [joint_names[i] for i in [43, 44, 45, 46]],
            'envelope_vertices': int(allowed_head.sum()), 'position_changed_vertices': int(position_changed.sum()),
            'normal_changed_vertices': int(normal_changed.sum()),
            'positions_and_normals_outside_head_envelope_byte_identical': True,
            'position_changed_source_bounds': bounds(p0[position_changed]),
            'position_changed_result_bounds': bounds(p1[position_changed]),
            'normal_changed_source_bounds': bounds(p0[normal_changed]),
            'max_displacement_source_units': float(displacement.max()),
            'position_changed_vertex_ids': ids(position_changed), 'normal_changed_vertex_ids': ids(normal_changed)
        },
        'geometry': {
            'positions_and_normals_finite': True, 'maximum_unit_normal_error': float(normal_error.max()),
            'source_bounds': bounds(p0), 'result_bounds': bounds(p1),
            'source_and_result_bounds_exactly_equal': True, 'unchanged_accessor_min_max_exactly_match_geometry': True,
            'affected_triangles': int(affected_faces.sum()), 'unaffected_triangle_geometry_exact': True,
            'source_degenerate_triangles': int((areas[0] <= 1e-10).sum()),
            'result_degenerate_triangles': int((areas[1] <= 1e-10).sum()), 'newly_collapsed_triangle_ids': ids(newly_collapsed),
            'absolute_degeneracy_area_threshold_source_units_squared': 1e-10,
            'small_relative_area_advisory_threshold': 1e-4,
            'small_relative_area_faces': tiny_area_details,
            'minimum_triangle_area_source_units_squared': float(areas[1].min()),
            'minimum_changed_triangle_area_ratio': float(area_ratio[affected_faces].min()),
            'maximum_changed_triangle_area_ratio': float(area_ratio[affected_faces].max()),
            'faces_rotated_more_than_90_degrees': ids(rotated_90),
            'maximum_face_rotation_degrees': float(face_rotation[affected_faces].max()),
            'new_shading_normal_disagreement_faces': ids(new_shading_disagreement),
            'new_main_exterior_shading_normal_disagreement_faces': ids(new_exterior_shading_disagreement),
            'new_internal_shading_normal_disagreement_faces': ids(new_internal_shading_disagreement),
            'source_shading_disagreement_faces': ids(shading_dot[0] < 0),
            'result_shading_disagreement_faces': ids(shading_dot[1] < 0),
            'coincident_head_seam_groups': len(head_seam_groups), 'maximum_head_seam_gap_source_units': maximum_seam_gap,
            'coincident_main_exterior_head_seam_groups': len(exterior_seam_groups),
            'maximum_main_exterior_head_seam_gap_source_units': maximum_exterior_seam_gap,
            'originally_coincident_head_groups_separated': separated_groups,
            'original_head_split_normal_groups': len(split_groups), 'result_groups_retain_distinct_split_normals': preserved_split_groups,
            'diagnostics': diagnostics,
            'scope': 'Rest-pose numerical geometry audit. Intersections and visual expression require the separate rendered views; no claim of exhaustive animated collision testing.'
        },
        'embedded_images': image_rows, 'accessors': accessor_rows, 'buffer_views': view_rows,
        'changed_byte_ranges_half_open': spans(changed_bytes)
    }
    output = report_dir / 'INDEPENDENT_GEOMETRY_AUDIT.json'
    output.write_text(json.dumps(report, indent=2) + '\n')
    return report, output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('result')
    parser.add_argument('report_dir')
    args = parser.parse_args()
    try:
        report, output = verify(args.source, args.result, args.report_dir)
    except (AssertionError, KeyError, ValueError) as exc:
        target = Path(args.report_dir)
        target.mkdir(parents=True, exist_ok=True)
        (target / 'INDEPENDENT_GEOMETRY_AUDIT_FAILURE.json').write_text(json.dumps({'status': 'FAIL', 'reason': str(exc)}, indent=2) + '\n')
        raise
    (Path(args.report_dir) / 'INDEPENDENT_GEOMETRY_AUDIT_FAILURE.json').unlink(missing_ok=True)
    print(json.dumps({'status': report['status'], 'report': str(output), 'changed_accessors': report['byte_preservation']['changed_accessors'],
                      'positions_changed': report['head_only']['position_changed_vertices'],
                      'normals_changed': report['head_only']['normal_changed_vertices'],
                      'rotated_faces_90': report['geometry']['faces_rotated_more_than_90_degrees'],
                      'new_shading_disagreement': report['geometry']['new_shading_normal_disagreement_faces'],
                      'diagnostics': report['geometry']['diagnostics']}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
