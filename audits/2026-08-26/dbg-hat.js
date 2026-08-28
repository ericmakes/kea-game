const {load,stage,far}=require('./rig');
const H=load(),{X,G,tick,tap,P1}=H;
X.boot();X.startGame(1);
const tomH=G.humans.find(h=>h.key==='tom');
console.log('at boot: tom.hatG?',!!tomH.hatG,'visible',tomH.hatG&&tomH.hatG.visible);
const bn=G.props.find(p=>/beanie/.test(p.name));
console.log('beanie srcHatG?',!!bn.srcHatG,'=== tom.hatG?',bn.srcHatG===tomH.hatG);
