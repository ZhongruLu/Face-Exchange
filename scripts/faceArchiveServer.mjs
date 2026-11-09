import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export function faceArchivePlugin(){
 return {name:'local-face-archive',configureServer(server){
  const root=join(server.config.root,'data/face-archive');mkdirSync(join(root,'images'),{recursive:true});
  const manifest=join(root,'records.json');if(!existsSync(manifest))writeFileSync(manifest,'[]\n');
  server.middlewares.use('/api/face-archive',(req,res,next)=>{
   res.setHeader('Cache-Control','no-store');
   try {
    let records=JSON.parse(readFileSync(manifest,'utf8'));
    if(req.method==='GET'&&req.url.startsWith('/image/')){
     const file=req.url.slice(7).split('?')[0];if(!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(file)){res.statusCode=400;res.end();return;}
     res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'image/jpeg');res.end(readFileSync(join(root,'images',file)));return;
    }
    res.setHeader('Content-Type','application/json');
    if(req.method==='GET'){res.end(JSON.stringify(records));return;}
    if(req.method!=='POST'){res.statusCode=405;res.end('{}');return;}
    let body='';req.on('data',chunk=>{body+=chunk;if(body.length>12000000)req.destroy();});
    req.on('end',()=>{try{
      const input=JSON.parse(body);records=JSON.parse(readFileSync(manifest,'utf8'));let record;
      if(input.image){
       const match=/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(input.image);if(!match)throw new Error('Unsupported image');
       const id=randomUUID(),file=`${id}.${match[1]==='jpeg'?'jpg':match[1]}`;
       writeFileSync(join(root,'images',file),Buffer.from(match[2],'base64'));
       record={id,image:`/api/face-archive/image/${file}`,createdAt:new Date().toISOString(),price:null,currency:'RMB'};records.push(record);
      }else{
       record=records.find(r=>r.id===input.id);if(!record||!Number.isFinite(input.price)||input.price<0)throw new Error('Invalid sale');
       record.price=Math.round(input.price);record.bidder=input.bidder;record.soldAt=new Date().toISOString();
       record.sales=record.sales||[];record.sales.push({price:record.price,currency:'RMB',bidder:record.bidder,soldAt:record.soldAt});
      }
      writeFileSync(manifest,JSON.stringify(records,null,2)+'\n');res.end(JSON.stringify(record));
    }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.message}));}});
   }catch(error){res.statusCode=500;res.end(JSON.stringify({error:error.message}));}
  });
 }};
}
