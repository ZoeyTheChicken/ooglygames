// nuker-v4.js — aggressive ad/Playsaurus/Kong remover, safe for Cookie Clicker
(function(){
  'use strict';

  const SILENT = false;
  const AUTO_CLEAN_MS = 3000;
  const GAME_ROOT_ID = 'game-container'; // change to your game container ID

  const BLOCK_DOMAINS = [
    'googlesyndication.com','pagead2.googlesyndication','adsbygoogle','doubleclick.net',
    'googleadservices.com','adservice.google','googleads.g.doubleclick.net','securepubads.g.doubleclick.net',
    'kongregate.com','kongcdn.com','cdn.kongregate','kong-static',
    'playsaurus','playsaurus.com','play-saurus','adservice','ads.','adserver'
  ];

  const BLOCK_CLASSES = ['adsbygoogle','ad-container','ad-slot','plad','aqad'];
  const BLOCK_IDS = ['ad-container','plad','aqad'];

  const SAFE_URL_SUFFIXES = ['.js','.wasm']; // whitelist your game assets

  function log(...args){ if(!SILENT) console.info('[Nuker v4]',...args); }

  function urlMatchesBlocked(url){
    if(!url) return false;
    url = url.toLowerCase();
    if(SAFE_URL_SUFFIXES.some(s => url.endsWith(s))) return false;
    return BLOCK_DOMAINS.some(d => url.includes(d));
  }

  // defensive stubs
  if(!window.adsbygoogle) window.adsbygoogle=[]; window.adsbygoogle.push=()=>{};
  window.googletag=window.googletag||{}; window.googletag.cmd=window.googletag.cmd||[];
  window.googletag.pubads = window.googletag.pubads || function(){ return { enableSingleRequest:()=>{}, enableAsyncRendering:()=>{} }; };
  if(!window.kongregateAPI) window.kongregateAPI={loadAPI:cb=>cb&&cb(window.kongregateAPI), services:{stats:{submit:()=>{}}, payments:{purchaseItem:()=>Promise.resolve({success:false})}}, getAPI:()=>window.kongregateAPI};
  if(!window.playsaurus) window.playsaurus={analytics:{},ads:{}};

  // network blocks
  const nativeFetch = window.fetch;
  if(nativeFetch) window.fetch=function(input,init){
    try{ const u = typeof input==='string'?input:(input&&input.url); if(urlMatchesBlocked(u)){ log('blocked fetch',u); return Promise.resolve(new Response(null,{status:204,statusText:'Blocked'})); } }catch(e){}
    return nativeFetch.apply(this,arguments);
  };
  const origOpen=XMLHttpRequest.prototype.open;
  const origSend=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(m,u){ this._nukeBlocked=urlMatchesBlocked(u); if(this._nukeBlocked) log('XHR blocked',u); return origOpen.apply(this,arguments); };
  XMLHttpRequest.prototype.send=function(){ if(this._nukeBlocked){ try{this.abort&&this.abort(); this.dispatchEvent&&this.dispatchEvent(new Event('loadend'));}catch(e){} return; } return origSend.apply(this,arguments); };
  if(navigator.sendBeacon){ const nativeBeacon=navigator.sendBeacon.bind(navigator); navigator.sendBeacon=function(u,d){ if(urlMatchesBlocked(u)){ log('blocked beacon',u); return true; } return nativeBeacon.apply(this,arguments); }; }

  // sweep function
  const sponsoredRegex=/\bsponsored\b/i;
  const playsaurusRegex=/\bplaysaurus\b/i;
  const sponsoredLinkRegex=/\bsponsored\b.*\blink\b|\blink\b.*\bsponsored\b/i;

  function shouldRemove(el){
    if(!el) return false;
    const text=(el.innerText||el.textContent||'').toLowerCase();
    if(text && (sponsoredRegex.test(text)||playsaurusRegex.test(text)||sponsoredLinkRegex.test(text))) return true;
    const cls=(el.className||'').toLowerCase();
    if(BLOCK_CLASSES.some(c=>cls.includes(c))) return true;
    const id=(el.id||'').toLowerCase();
    if(BLOCK_IDS.some(i=>id.includes(i))) return true;
    return false;
  }

  function sweep(root){
    try{
      root = root || document;
      const gameRoot = document.getElementById(GAME_ROOT_ID);
      const all = root.querySelectorAll('*');
      for(const el of all){
        if(gameRoot && gameRoot.contains(el)) continue; // skip game elements
        if(shouldRemove(el)) { el.parentNode&&el.parentNode.removeChild(el); log('removed element', el.tagName, el.className||el.id||''); }
      }
    }catch(e){}
  }

  window.addEventListener('load',()=>{ sweep(document); });

  const mo = new MutationObserver(muts=>{
    for(const m of muts){
      for(const n of m.addedNodes){
        try{
          if(!n) continue;
          const gameRoot = document.getElementById(GAME_ROOT_ID);
          if(gameRoot && gameRoot.contains(n)) continue;
          if(n.nodeType===3){ 
            const t=(n.nodeValue||'').toLowerCase();
            if(t && (sponsoredRegex.test(t)||playsaurusRegex.test(t)||sponsoredLinkRegex.test(t))){
              const p = n.parentNode; p&&p.parentNode&&p.parentNode.removeChild(p); log('MO removed text node parent');
            }
            continue;
          }
          sweep(n);
        }catch(e){}
      }
    }
  });
  try{ mo.observe(document.documentElement||document,{childList:true,subtree:true}); }catch(e){}
  const periodic=setInterval(()=>{ sweep(document); },AUTO_CLEAN_MS);

  window.__nuke_v4 = {
    addBlockedDomain:d=>{ BLOCK_DOMAINS.push(d.toLowerCase()); log('added blocked domain',d); },
    listBlocked:()=>BLOCK_DOMAINS.slice(),
    stop:()=>{ mo.disconnect(); clearInterval(periodic); log('stopped nuker'); },
    sweep:()=>sweep(document)
  };

  log('Nuker v4 active — aggressive ad removal, safe for game elements');
})();
