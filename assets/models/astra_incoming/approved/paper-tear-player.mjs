// Plays the supplied unrigged paper demonstration in metres.
export function applyPaperTear(data, elapsed, resolveMesh) {
 const t=Math.max(0,Math.min(elapsed,data.times.at(-1)));
 let a=0;while(a+1<data.times.length&&data.times[a+1]<=t)a++;
 const b=Math.min(a+1,data.times.length-1),u=a===b?0:(t-data.times[a])/(data.times[b]-data.times[a]);
 for(const name of Object.keys(data.frames[a])){
  const mesh=resolveMesh(name);if(!mesh)throw Error(`Missing paper part: ${name}`);
  const attribute=mesh.geometry.attributes.position;
  data.frames[a][name].forEach((p,i)=>attribute.setXYZ(i,...p.map((v,j)=>v*(1-u)+data.frames[b][name][i][j]*u)));
  attribute.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
 }
}
