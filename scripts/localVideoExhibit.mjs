import {existsSync,mkdirSync,readdirSync,statSync,copyFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

// Publish the user's local video folder without putting Mac paths into the browser.
export function localVideoExhibitPlugin(){
  let directory,output,lastManifest='';
  function sync(){
    mkdirSync(output,{recursive:true});
    const files=existsSync(directory)?readdirSync(directory).filter(name=>/\.(mp4|webm|mov|m4v|ogv)$/i.test(name)&&statSync(join(directory,name)).isFile()).sort((a,b)=>Number(!/^exhibit\./i.test(a))-Number(!/^exhibit\./i.test(b))||a.localeCompare(b)):[];
    for(const name of files){const input=join(directory,name),target=join(output,name),info=statSync(input);if(!existsSync(target)||statSync(target).size!==info.size||statSync(target).mtimeMs<info.mtimeMs)copyFileSync(input,target);}
    const selected=files[0]??(existsSync(join(output,'exhibit.mp4'))?'exhibit.mp4':null);
    const manifest=JSON.stringify({url:selected?`/assets/video-exhibit/${encodeURIComponent(selected)}`:null});
    if(manifest!==lastManifest||!existsSync(join(output,'manifest.json'))){writeFileSync(join(output,'manifest.json'),manifest+'\n');lastManifest=manifest;}
  }
  return{name:'local-video-exhibit',configResolved(config){directory=resolve(config.root,'../video');output=resolve(config.root,'public/assets/video-exhibit');},buildStart(){sync();},configureServer(server){
    sync();server.watcher.add(directory);
    let timer;const change=path=>{if(path.startsWith(directory)){clearTimeout(timer);timer=setTimeout(sync,700);}};
    server.watcher.on('add',change).on('change',change).on('unlink',change);
    server.httpServer?.once('close',()=>{clearTimeout(timer);server.watcher.off('add',change).off('change',change).off('unlink',change);});
  }};
}
