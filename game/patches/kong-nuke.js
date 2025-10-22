// ad-kong-playsaurus-nuke-v2.js — now also removes elements with class/id="ad" or "plad"

(function () {
  'use strict';

  const SILENT = false;
  const AUTO_CLEAN_MS = 2500;

  const BLOCK_DOMAINS = [
    'googlesyndication.com','pagead2.googlesyndication','adsbygoogle','doubleclick.net',
    'googleadservices.com','adservice.google','googleads.g.doubleclick.net','securepubads.g.doubleclick.net',
    'kongregate.com','kongcdn.com','cdn.kongregate','kong-static',
    'playsaurus','playsaurus.com','play-saurus','adservice','ads.','adserver'
  ];

  function log(...args){ if(!SILENT) console.info('[nuke]', ...args); }
  function urlMatchesBlocked(u){ if(!u) return false; try{const s=(u+'').toLowerCase(); return BLOCK_DOMAINS.some(d=>d&&s.includes(d));}catch(e){return false;} }

  // defensive stubs
  try{ if(!window.adsbygoogle){ window.adsbygoogle=[]; window.adsbygoogle.push=function(){}; } }catch(e){}
  try{ window.googletag=window.googletag||{}; window.googletag.cmd=window.googletag.cmd||[]; window.googletag.pubads=window.googletag.pubads||function(){return{enableSingleRequest:()=>{}, enableAsyncRendering:()=>{}}}; }catch(e){}
  try{ if(!window.kongregateAPI){ window.kongregateAPI={loadAPI:cb=>{try{cb&&cb(window.kongregateAPI);}catch(e){}return{then:f=>{try{f(window.kongregateAPI);}catch(e){}}}}},services:{stats:{submit:()=>{}},payments:{purchaseItem:()=>Promise.resolve({success:false})}},getAPI:()=>window.kongregateAPI}; }catch(e){}
  try{ if(!window.playsaurus){ window.playsaurus={analytics:{},ads:{}}; } }catch(e){}

  // network blocks
  (function(){
    const nativeFetch=window.fetch; if(nativeFetch){ window.fetch=function(input,init){ try{ const url=typeof input==='string'?input:(input&&input.url); if(urlMatchesBlocked(url)){ log('blocked fetch',url); return Promise.resolve(new Response(null,{status:204,statusText:'Blocked'})); } }catch(e){} return nativeFetch.apply(this,arguments); }; }
    const origOpen=XMLHttpRequest.prototype.open, origSend=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open=function(m,u){ try{ this._nukeBlocked=urlMatchesBlocked(u); if(this._nukeBlocked) log('marked XHR blocked',u); }catch(e){this._nukeBlocked=false;} return origOpen.apply(this,arguments); };
    XMLHttpRequest.prototype.send=function(){ if(this._nukeBlocked){ try{this.abort&&this.abort(); this.dispatchEvent&&this.dispatchEvent(new Event('loadend')); }catch(e){} return; } return origSend.apply(this,arguments); };
    if(navigator.sendBeacon){ const nativeBeacon=navigator.sendBeacon.bind(navigator); navigator.sendBeacon=function(u,d){ try{ if(urlMatchesBlocked(u)){ log('blocked beacon',u); return true; } }catch(e){} return nativeBeacon.apply(this,arguments); }; }
  })();

  // DOM protection
  (function(){
    const origCreate=Document.prototype.createElement;
    Document.prototype.createElement=function(tagName,opts){
      const el=origCreate.call(this,tagName,opts);
      try{
        const t=(tagName||'').toLowerCase();
        if(t==='script'||t==='iframe'||t==='link'||t==='img'){
          const setSrc=function(v){ try{ if(urlMatchesBlocked(v)){ log('blocked src set',v); return; } }catch(e){} try{ this.setAttribute(t==='link'?'href':'src',v); }catch(e){} };
          try{ Object.defineProperty(el,'src',{set:setSrc,get:()=>el.getAttribute('src'),configurable:true}); }catch(e){}
          try{ Object.defineProperty(el,'href',{set:setSrc,get:()=>el.getAttribute('href'),configurable:true}); }catch(e){}
        }
      }catch(e){}
      return el;
    };
    const origAppend=Element.prototype.appendChild; Element.prototype.appendChild=function(n){ try{ if(n&&n.tagName){ const t=n.tagName.toLowerCase(); const src=n.src||(n.getAttribute&&(n.getAttribute('src')||n.getAttribute('href')||n.getAttribute('data-src'))); if((t==='script'||t==='iframe'||t==='link'||t==='img')&&urlMatchesBlocked(src)){ log('blocked appendChild for blocked node',src); return n; } } }catch(e){} return origAppend.call(this,n); };
    const origInsert=Node.prototype.insertBefore; Node.prototype.insertBefore=function(n,r){ try{ if(n&&n.tagName){ const t=n.tagName.toLowerCase(); const src=n.src||(n.getAttribute&&(n.getAttribute('src')||n.getAttribute('href')||n.getAttribute('data-src'))); if((t==='script'||t==='iframe'||t==='link'||t==='img')&&urlMatchesBlocked(src)){ log('blocked insertBefore for blocked node',src); return n; } } }catch(e){} return origInsert.call(this,n,r); };
  })();

  Document.prototype.write=(function(orig){ return function(s){ try{ if(typeof s==='string' && BLOCK_DOMAINS.some(d=>s.toLowerCase().includes(d))){ log('blocked document.write containing blocked domain'); return; } }catch(e){} return orig.call(this,s); }; })(Document.prototype.write);

  // ---------- sweeping function ----------
  const sponsoredRegex=/\bsponsored\b/i, playsaurusRegex=/\bplaysaurus\b/i, sponsoredLinkRegex=/\bsponsored\b.*\blink\b|\blink\b.*\bsponsored\b/i;
  function shouldRemove(el){
    try{
      if(!el) return false;
      const txt=(el.innerText||el.textContent||'').toLowerCase();
      if(txt&& (sponsoredRegex.test(txt)||playsaurusRegex.test(txt)||sponsoredLinkRegex.test(txt))) return true;
      const aria=el.getAttribute?((el.getAttribute('aria-label')||el.getAttribute('title')||'').toLowerCase()):'';
      if(aria && (sponsoredRegex.test(aria)||playsaurusRegex.test(aria)||sponsoredLinkRegex.test(aria))) return true;
      // new: class/id check
      const cls=(el.className||'').toLowerCase();
      if(cls.includes('ad')||cls.includes('plad')) return true;
      const id=(el.id||'').toLowerCase();
      if(id.includes('ad')||id.includes('plad')) return true;
      return false;
    }catch(e){ return false; }
  }

  function sweep(root){
    try{
      const rootEl=root||document;
      const nodes=rootEl.querySelectorAll('*[src], *[href], *[data-ad], .adsbygoogle');
      for(const n of nodes){ try{ const src=n.src||n.getAttribute('src')||n.getAttribute('href')||''; if(urlMatchesBlocked(src)){ n.parentNode&&n.parentNode.removeChild(n); log('removed blocked element',src); } }catch(e){} }
      const all=rootEl.querySelectorAll('*');
      for(const el of all){ try{ if(shouldRemove(el)){ el.parentNode&&el.parentNode.removeChild(el); log('removed element',el.tagName,el.className||el.id||''); } }catch(e){} }
    }catch(e){}
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',()=>sweep(document)); }else{ sweep(document); }

  const mo=new MutationObserver(muts=>{ for(const m of muts){ for(const n of m.addedNodes){ try{ if(!n) continue; if(n.nodeType===3){ const t=(n.nodeValue||'').trim().toLowerCase(); if(t && (sponsoredRegex.test(t)||playsaurusRegex.test(t)||sponsoredLinkRegex.test(t))){ const p=n.parentNode; p&&p.parentNode&&p.parentNode.removeChild(p); log('MO removed text node parent'); } continue; } sweep(n); }catch(e){} } } });
  try{ mo.observe(document.documentElement||document,{childList:true,subtree:true}); }catch(e){}
  const periodic=setInterval(()=>{ try{sweep(document);}catch(e){} },AUTO_CLEAN_MS);

  window.__nuke={addBlockedDomain:d=>{ try{BLOCK_DOMAINS.push(d.toLowerCase()); log('added blocked domain',d); }catch(e){} }, listBlocked:()=>BLOCK_DOMAINS.slice(), stop:()=>{ try{mo.disconnect(); clearInterval(periodic); log('stopped nuke'); }catch(e){} }, sweep:()=>{ try{sweep(document);}catch(e){} }};
  log('ad-kong-playsaurus-nuke-v2 active — removing nodes with "sponsored"/"playsaurus"/class/id "ad"/"plad" and blocking ad domains');
})();
