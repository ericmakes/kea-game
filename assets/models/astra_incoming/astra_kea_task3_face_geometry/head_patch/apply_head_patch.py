"""Apply a validated, sparse head-only geometry patch to a compatible GLB.

Usage: python apply_head_patch.py INPUT.glb head_patch.npz OUTPUT.glb
Requires numpy. Never changes UVs, weights, rig, textures, indices or JSON.
"""
from pathlib import Path
import argparse, hashlib, json, struct
import numpy as np

def sha(data):return hashlib.sha256(data).hexdigest()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source');parser.add_argument('patch');parser.add_argument('output')
    args=parser.parse_args()
    if Path(args.source).resolve()==Path(args.output).resolve():
        raise ValueError('Use a separate output path to retain the source baseline.')
    raw=Path(args.source).read_bytes();payload=np.load(args.patch,allow_pickle=False)
    magic,version,total=struct.unpack_from('<4sII',raw)
    assert (magic,version,total)==(b'glTF',2,len(raw))
    jlen,jtype=struct.unpack_from('<II',raw,12)
    assert jtype==0x4e4f534a
    doc=json.loads(raw[20:20+jlen]);start=28+jlen
    assert struct.unpack_from('<I',raw,24+jlen)[0]==0x004e4942
    prim=doc['meshes'][0]['primitives'][0]
    assert len(doc['skins'][0]['joints'])==101
    assert doc['accessors'][prim['indices']]['count']==4927*3
    def read_acc(index):
        a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
        c={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
        dtype=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']])
        off=start+v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',c*dtype.itemsize)
        return np.ndarray((a['count'],c),dtype=dtype,buffer=raw,offset=off,strides=(stride,dtype.itemsize)).copy(),off,stride
    # Changed paint is allowed in the input; topology, UV and skin correspondence
    # must still match the exact geometry for which the sparse patch was built.
    for semantic in ['TEXCOORD_0','JOINTS_0','WEIGHTS_0']:
        a,_,_=read_acc(prim['attributes'][semantic])
        assert sha(a.tobytes())==str(payload['sha_'+semantic]),semantic+' differs from patch baseline'
    inds,_,_=read_acc(prim['indices'])
    assert sha(inds.tobytes())==str(payload['sha_indices']),'Index topology differs'
    changed=[];result=bytearray(raw);allowed=np.zeros(len(raw),bool)
    for role in ['POSITION','NORMAL']:
        a,off,stride=read_acc(prim['attributes'][role]);ids=payload[role+'_ids']
        before=payload[role+'_before'];after=payload[role+'_after']
        assert a.shape==(3013,3) and a.dtype==np.dtype('<f4')
        assert np.array_equal(a[ids].view('<u4'),before.view('<u4')),role+' head baseline differs; stop for review'
        for idx,value in zip(ids,after):
            p=off+int(idx)*stride;result[p:p+12]=value.tobytes();allowed[p:p+12]=True
        a[ids]=after
        if role=='POSITION':
            acc=doc['accessors'][prim['attributes'][role]]
            assert np.array_equal(a.min(0),np.asarray(acc['min'],dtype='<f4'))
            assert np.array_equal(a.max(0),np.asarray(acc['max'],dtype='<f4'))
        changed.append({'accessor':prim['attributes'][role],'semantic':role,'vertex_count':len(ids),'vertex_ids':ids.tolist()})
    final=bytes(result);different=np.frombuffer(raw,np.uint8)!=np.frombuffer(final,np.uint8)
    assert not np.any(different&~allowed)
    assert final[:start]==raw[:start] and len(final)==len(raw)
    Path(args.output).write_bytes(final)
    report={'source_sha256':sha(raw),'output_sha256':sha(final),'file_size_unchanged':True,
            'json_and_all_other_bytes_exact':True,'changed_byte_count':int(different.sum()),'changed_accessors':changed}
    Path(args.output).with_suffix('.validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print('Wrote geometry-only GLB:',args.output)
    print('All other bytes preserved. SHA256:',sha(final))

if __name__=='__main__':main()
