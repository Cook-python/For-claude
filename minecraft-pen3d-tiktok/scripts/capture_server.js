const {chromium}=require('playwright-core');const fs=require('fs');const http=require('http');
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const pg=await b.newPage({viewport:{width:1440,height:1080}});
await pg.goto('file://'+__dirname+'/game.html');await pg.waitForTimeout(3000);
await pg.evaluate(()=>{const vm=scaffolding.vm;vm.runtime.frameLoop.stop();
 window.T=(n)=>{for(let i=0;i<n;i++)vm.runtime._step();};
 window.K=(key,d)=>vm.postIOData('keyboard',{key,isDown:d});
 window.M=(x,y,d)=>{const o={x,y,canvasWidth:480,canvasHeight:360};if(d!==undefined)o.isDown=d;vm.postIOData('mouse',o);};
 window.G=()=>{vm.renderer.draw();return vm.renderer.canvas.toDataURL('image/jpeg',0.92)};
});
let busy=Promise.resolve();
http.createServer((req,res)=>{let body='';req.on('data',d=>body+=d);req.on('end',()=>{busy=busy.then(async()=>{
 try{const q=JSON.parse(body);const out=q.out;fs.mkdirSync(out,{recursive:true});let f=fs.readdirSync(out).length;const start=f;
 for(const s of q.plan){
  if(s.click){await pg.evaluate(([x,y])=>{M(x,y);T(2);M(x,y,true);T(2);M(x,y,false);T(20)},s.click);continue;}
  if(s.press)for(const k of s.press)await pg.evaluate(k=>K(k,true),k);
  if(s.release)for(const k of s.release)await pg.evaluate(k=>K(k,false),k);
  for(let i=0;i<(s.n||0);i++){
   const d=await pg.evaluate(([m,cap])=>{if(m)M(m[0],m[1],m[2]);T(1);return cap?G():null},[s.mouse?[s.mouse[0],s.mouse[1],s.mouse[2]]:null,!s.skip]);
   if(d){fs.writeFileSync(`${out}/f${String(f).padStart(4,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'));f++;}
  }}
 res.end(JSON.stringify({start,end:f}));}catch(e){res.end('ERR '+e.stack)}});});}).listen(8765,()=>console.log('ready'));
})();
