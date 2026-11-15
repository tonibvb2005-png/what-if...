// usage: node tools/shot.js <page> <out.png> [w h] [evalExpr]
const http=require('http'),fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.wav':'audio/wav'};
const srv=http.createServer((q,r)=>{const p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});r.end(d);});}).listen(0,async()=>{
 const [,,page,out,w=2400,h=1100,ev]=process.argv;const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage({viewport:{width:+w,height:+h}});
 pg.on('console',m=>console.log('console:',m.text()));pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto(`http://localhost:${srv.address().port}/${page}`);await pg.waitForFunction('window.done',null,{timeout:120000});if(ev)await pg.evaluate(ev);
 await pg.screenshot({path:out});await b.close();srv.close();});
