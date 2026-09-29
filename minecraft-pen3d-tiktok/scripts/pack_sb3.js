const P=require('@turbowarp/packager');const fs=require('fs');
(async()=>{
const data=fs.readFileSync(process.argv[2]);
const loaded=await P.loadProject(data);
const p=new P.Packager();p.project=loaded;
p.options.turbo=false;p.options.framerate=60;p.options.interpolation=false;
p.options.stageWidth=480;p.options.stageHeight=360;
p.options.cloudVariables.mode='local';
p.options.autoplay=true;p.options.controls.greenFlag.enabled=false;
p.options.loadingScreen.progressBar=false;
p.options.compilerOptions={enabled:true,warpTimer:false};
p.options.maxClones=300;p.options.fencing=true;p.options.miscLimits=true;
const r=await p.package();fs.writeFileSync('game.html',r.data);console.log('ok',r.data.length);
})().catch(e=>{console.error(e);process.exit(1)});
