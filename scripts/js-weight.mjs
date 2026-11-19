import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const root='dist';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
const islands=[...html.matchAll(/component-url="([^"]+)"/g)].map(m=>m[1]);
const renderers=[...html.matchAll(/renderer-url="([^"]+)"/g)].map(m=>m[1]);
const seen=new Set();
function walk(file){
  if(!file||seen.has(file))return; seen.add(file);
  const p=path.join(root,file.replace(/^\//,''));
  if(!fs.existsSync(p))return;
  const code=fs.readFileSync(p,'utf8');
  for(const m of code.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)){
    const spec=m[1]; if(!spec.startsWith('.'))continue;
    const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),spec)); walk(resolved);
  }
}
for(const s of [...scripts,...islands,...renderers]) walk(s.startsWith('/')?s:'/'+s);
let total=0; const rows=[];
for(const f of seen){ const p=path.join(root,f.replace(/^\//,'')); if(!fs.existsSync(p))continue; const b=fs.readFileSync(p); const g=zlib.gzipSync(b).length; total+=g; rows.push({f,g:+(g/1024).toFixed(2)}); }
console.log(rows.sort((a,b)=>b.g-a.g).slice(0,25)); console.log('TOTAL gzip KB', (total/1024).toFixed(1));


