import entries from './language.txt?raw';

// Stable source keys keep existing interactions intact while both visible languages are editable.
const dictionary = new Map();
const englishDisplay = new Map();
for (const line of entries.split('\n')) {
  if (line.trim().startsWith('#') || !line.includes('|')) continue;
  const [source, zh, en] = line.replace(/\r$/, '').split('|');
  dictionary.set(source, zh);
  if (en) englishDisplay.set(source, en);
}
const displaySources = new Map([...englishDisplay].map(([source, display]) => [display, source]));
const uppercaseDictionary = new Map([...dictionary].map(([en, zh]) => [en.toUpperCase(), zh]));
const reverse = new Map([...dictionary].map(([en, zh]) => [zh, en]));
let language = 'en';
export function translate(value, target = language) {
  const text = String(value), trim = text.trim();
  if (!trim) return text;
  const source = dictionary.has(trim) ? trim : (displaySources.get(trim) || reverse.get(trim) || trim);
  if (target === 'en') return text.replace(trim, englishDisplay.get(source) || source);
  if (dictionary.has(source)) return text.replace(trim, dictionary.get(source));
  if (source.includes(' · ')) return text.replace(trim, source.split(' · ').map(part=>translate(part,target)).join(' · '));
  const upper = uppercaseDictionary.get(source);
  if (upper) return text.replace(trim, upper);
  return text.replace(trim, source
    .replace(/BIDDER (\d+)/g,'竞拍者 $1').replace(/SOURCE /g,'来源 ')
    .replace(/SOLD /g,'成交 ').replace(/(\d+:\d+) REMAINING/g,'剩余 $1')
    .replace(/BASE /g,'起拍价 ').replace(/WINNER /g,'得标者 ').replace(/VERSION /g,'版本 ').replace(/ENLARGED EYES/g,'放大眼部').replace(/DISPLACED/g,'错位').replace(/SWIRL/g,'旋涡').replace(/STRETCHED/g,'拉伸').replace(/ LEADS/g,'领先').replace(/\bSOLD\b/g,'已成交').replace(/\bSOURCE\b/g,'来源')
    .replace(/\bRMB\b/g,'元').replace(/\bNOT SOLD\b/g,'尚未成交')
    .replace(/Model could not load. Reload to retry./g,'模型加载失败，请刷新重试。').replace(/Camera unavailable. Try the demo or retry./g,'相机无法使用，请重试或体验演示。').replace(/Tracking paused./g,'追踪已暂停。')
    .replace(/^(.+) SELECTED$/,(_,name)=>`${translate(name,'zh-CN')}已选择`).replace(/^(.+) READY \/ (.+) FVU$/,(_,name,value)=>`${translate(name,'zh-CN')}已就绪 / ${value} FVU`)
    .replace(/^STATION (.+) READY$/,(_,name)=>`${translate(name,'zh-CN')}已就绪`));
}
export function onLanguageChange(callback) {
  document.addEventListener?.('language-change', callback);
  return () => document.removeEventListener?.('language-change', callback);
}
export function initLanguage(root) {
  const button=root.querySelector('[data-language-toggle]');
  const sources=new WeakMap(), attributes=new WeakMap();
  let observer;
  function scan() {
    observer?.disconnect();
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) {
      if(node.parentElement?.closest('script,style,[data-language-toggle],[data-i18n-ignore]'))continue;
      const previous=sources.get(node);
      const current=node.nodeValue;
      const source=previous && current===previous.rendered ? previous.source : (reverse.get(current.trim()) || current);
      const rendered=translate(source);
      if(current!==rendered)node.nodeValue=rendered;
      sources.set(node,{source,rendered});
    }
    root.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(el=>{
      if(el.closest('[data-language-toggle],[data-i18n-ignore]'))return;
      const record=attributes.get(el)||{};
      for(const key of ['aria-label','title','placeholder','alt']) {
        if(!el.hasAttribute(key))continue;
        const current=el.getAttribute(key), old=record[key];
        const source=old&&current===old.rendered?old.source:current;
        const rendered=translate(source);
        if(current!==rendered)el.setAttribute(key,rendered);
        record[key]={source,rendered};
      }
      attributes.set(el,record);
    });
    const filename=root.querySelector('[data-upload-filename]');
    if(filename&&['No file chosen','未选择文件'].includes(filename.textContent))filename.textContent=translate('No file chosen');
    observer?.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
  }
  function setLanguage(next) {
    language=next;document.documentElement.lang=next;document.title=translate('Facial Auction Hall',next);
    try{localStorage.setItem('face-exchange-language',next);}catch{}
    button.querySelector('[data-language-label]').textContent=next==='en'?'中文':'EN';
    button.setAttribute('aria-label',next==='en'?'Switch to Chinese':'切换至英文');
    button.title=button.getAttribute('aria-label');
    scan();document.dispatchEvent(new CustomEvent('language-change',{detail:{language}}));
  }
  let queued=false;
  observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});});
  button.addEventListener('click',()=>setLanguage(language==='en'?'zh-CN':'en'));
  let saved;try{saved=localStorage.getItem('face-exchange-language');}catch{}
  setLanguage(saved==='zh-CN'?'zh-CN':'en');
}
