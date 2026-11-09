// A small, static newspaper texture for the physical sheets in the corridor.
export function paintNewspaper(ctx,item,zh){
  const W=600,H=820;ctx.clearRect(0,0,W,H);ctx.fillStyle='#eee7d6';ctx.fillRect(0,0,W,H);ctx.fillStyle='#242018';ctx.strokeStyle='#242018';
  const line=(y,width=1)=>{ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(568,y);ctx.stroke();};
  const font=(size,bold=false)=>`${bold?'700':'400'} ${size}px ${zh?'"Songti SC",serif':'Georgia,serif'}`;
  const text=(value,x,y,width,size,leading,max=20,bold=false)=>{ctx.font=font(size,bold);let row='',rows=[];for(const char of value.replace(/\n/g,' ')){if(ctx.measureText(row+char).width>width){rows.push(row);row='';}row+=char;}if(row)rows.push(row);rows.slice(0,max).forEach((r,i)=>ctx.fillText(i===max-1&&rows.length>max?r.slice(0,-2)+'…':r,x,y+i*leading));return y+Math.min(max,rows.length)*leading;};
  line(24,6);ctx.textAlign='center';ctx.font=font(zh?45:35,true);ctx.fillText(zh?'面孔简报':'THE FACE LEDGER',300,77);line(94,2);
  ctx.font=font(14);ctx.textAlign='left';ctx.fillText(item.id+' / '+(zh?item.zhKind:item.kind),32,119);ctx.textAlign='right';ctx.fillText(item.published,568,119);ctx.textAlign='left';line(130);
  let y=text(zh?item.zhHeadline:item.headline,32,177,536,zh?43:42,48,4,true);y+=6;line(y,2);y=text(zh?item.zhDeck:item.deck,32,y+27,536,19,27,3);y+=9;
  const figureY=y;ctx.lineWidth=1;ctx.strokeRect(32,figureY,536,131);ctx.font=font(44,true);ctx.fillText(item.fact,49,figureY+58);text(zh?item.zhFactLabel:item.factLabel,49,figureY+85,260,13,18,2);
  if(item.graphic==='trust'){ctx.fillStyle='#242018';ctx.fillRect(377,figureY+40,45,66);ctx.fillRect(445,figureY+35,45,71);ctx.font=font(10);ctx.fillText('R',395,figureY+122);ctx.fillText('AI',460,figureY+122);}else{for(let i=0;i<3;i++){const x=359+i*64;ctx.strokeRect(x,figureY+20,49,84);ctx.beginPath();ctx.ellipse(x+24,figureY+47,11,15,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+7,figureY+91);ctx.quadraticCurveTo(x+24,figureY+60,x+42,figureY+91);ctx.stroke();}}
  y=figureY+154;line(y);y+=28;
  item.sections.forEach((s,i)=>{const x=32+i*280;let columnY=text(zh?s.zhHeading:s.heading,x,y,250,19,23,2,true);text(zh?s.zhText:s.text,x,columnY+12,250,16,23,Math.max(2,Math.floor((746-columnY)/23)));});
  ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(300,y-15);ctx.lineTo(300,747);ctx.stroke();line(765,2);ctx.font=font(12);ctx.fillText(zh?'项目研究摘要 · 点击阅读及核查来源':'EDITORIAL DIGEST · SELECT FOR SOURCES',32,790);
}
