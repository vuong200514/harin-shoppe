import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 10000);
const authUser = process.env.ACCESS_USER || 'harin';
const authPassword = process.env.ACCESS_PASSWORD || '';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
const cloudPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';
const types = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.txt':'text/plain; charset=utf-8'
};
const publicFiles = new Set(['/','/index.html','/app.js','/exporter.js','/category-data.js','/chart-data.js','/template-data.js','/assets/bang_quy_doi_size_harin.png','/vendor/jszip.min.js']);
function equals(a,b){
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length && timingSafeEqual(x,y);
}
function authorized(header){
  if (!authPassword) return true;
  const value = header || '';
  if(!value.startsWith('Basic ')) return false;
  try {
    const decoded=Buffer.from(value.slice(6),'base64').toString('utf8');
    const split=decoded.indexOf(':');
    return split>=0 && equals(decoded.slice(0,split),authUser) && equals(decoded.slice(split+1),authPassword);
  }catch{return false;}
}
const server = createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET' && req.method!=='HEAD'){
    res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method Not Allowed');return;
  }
  let pathname;
  try{pathname=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);res.end();return;}
  if(pathname==='/health'){
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'ok'}));return;
  }
  if(!authorized(req.headers.authorization)){
    res.writeHead(401,{'Content-Type':'text/plain; charset=utf-8','WWW-Authenticate':'Basic realm="Harin Studios", charset="UTF-8"'});
    res.end('Can dang nhap Harin Studios');return;
  }
  if(pathname==='/api/public-config'){
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'});
    res.end(JSON.stringify({cloudName,cloudPreset,automaticUpload:true}));return;
  }
  if(!publicFiles.has(pathname)){res.writeHead(404);res.end('Not Found');return;}
  const localPath=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!localPath.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{
    const info=await stat(localPath);
    if(!info.isFile())throw Error('Not a file');
    res.writeHead(200,{'Content-Type':types[extname(localPath)]||'application/octet-stream','Content-Length':info.size});
    if(req.method==='HEAD'){res.end();return;}
    createReadStream(localPath).pipe(res);
  }catch{if(!res.headersSent)res.writeHead(404);res.end('Not Found');}
});
server.listen(port,'0.0.0.0',()=>{
  console.log(`Harin Shopee web listening on 0.0.0.0:${port}`);
  if(!authPassword)console.warn('WARNING: ACCESS_PASSWORD is empty. This site is accessible publicly.');
  if(!cloudName||!cloudPreset)console.warn('Cloudinary not preconfigured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET or enter them in the UI.');
});
