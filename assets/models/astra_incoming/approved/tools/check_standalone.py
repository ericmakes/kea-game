from pathlib import Path
import json,sys,numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent));from render_cached import GLB,norm
D=Path(__file__).resolve().parents[1];src=GLB(D/'model/kea_reference_shape.glb');out=GLB(D/'kea_animated.glb');baseacc=out.acc;srcacc=src.acc;shape=json.loads((D/'kea_motion_shape.json').read_text());data=json.loads((D/'kea_motion_clips.json').read_text());ix=np.array(shape['indices']);dp=np.array(shape['deltaPosition']).reshape(-1,3);cn=np.array(shape['correctedNormal']).reshape(-1,3);prim=out.j['meshes'][0]['primitives'][0];pa=prim['attributes']['POSITION'];na=prim['attributes']['NORMAL'];animations=out.j['animations'];report={}
for clip in data['clips']:
 anim=next(a for a in animations if a['name']==clip['name']);out.j['animations']=[anim];weight=1-clip['wingRestWeight'];p=baseacc(pa)+baseacc(prim['targets'][0]['POSITION'])*weight;n=norm(baseacc(na)+baseacc(prim['targets'][0]['NORMAL'])*weight);out.acc=lambda k:p if k==pa else n if k==na else baseacc(k)
 a=1-(1-clip['wingRestWeight'])*np.array(shape['wingInfluence']);sp=srcacc(0);sn=srcacc(1);sp[ix]+=dp*a[:,None];sn[ix]=norm(sn[ix]*(1-a[:,None])+cn*a[:,None]);src.acc=lambda k:sp if k==0 else sn if k==1 else srcacc(k);errors=[]
 for i in [0,len(clip['times'])//4,len(clip['times'])//2,len(clip['times'])-1]:
  expected=src.geometry(3.5,{data['nodes'][id]:trs for id,trs in clip['frames'][i].items()})[0][0][0];actual=out.geometry(clip['times'][i])[0][0][0];errors.append(float(abs(actual-expected).max()))
 report[clip['name']]={'sampledPoseCount':len(errors),'maxPositionDifferenceSourceCoordinates':max(errors)}
 assert max(errors)<1e-4
(D/'STANDALONE_PLAYBACK_VALIDATION.json').write_text(json.dumps(report,indent=2));print(report)
