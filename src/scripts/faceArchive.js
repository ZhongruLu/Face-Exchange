let currentRecord=Promise.resolve(null);
const browserArchive=import.meta.env.PUBLIC_ARCHIVE_MODE==='browser';
// Public static builds keep each visitor's portraits on their own device.
function openArchive(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('face-exchange-portraits',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('faces',{keyPath:'id'});
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
async function localArchive(action,value){
 const db=await openArchive();try{return await new Promise((resolve,reject)=>{
  const transaction=db.transaction('faces',action==='read'?'readonly':'readwrite');
  const request=action==='read'?transaction.objectStore('faces').getAll():transaction.objectStore('faces').put(value);
  let result;request.onsuccess=()=>result=request.result;
  transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error);
 });}finally{db.close();}
}
export function recordFace(url){
 currentRecord=(async()=>{
  const blob=await (await fetch(url)).blob();
  const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  if(browserArchive){const record={id:crypto.randomUUID(),image,createdAt:new Date().toISOString(),price:null,currency:'RMB'};await localArchive('write',record);return record;}
  const response=await fetch('/api/face-archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image})});
  if(!response.ok)throw new Error('Face archive is unavailable');return response.json();
 })();
 return currentRecord;
}
export async function recordSale(price,bidder){
 const record=await currentRecord;if(!record)return;
 if(browserArchive){record.price=Math.round(price);record.bidder=bidder;record.soldAt=new Date().toISOString();record.sales=record.sales||[];record.sales.push({price:record.price,currency:'RMB',bidder,soldAt:record.soldAt});await localArchive('write',record);return;}
 const response=await fetch('/api/face-archive',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:record.id,price,bidder})});
 if(!response.ok)throw new Error('Sale archive is unavailable');
}
export async function readFaces(){if(browserArchive)return localArchive('read');const response=await fetch('/api/face-archive');if(!response.ok)throw new Error('Archive unavailable');return response.json();}
