// kong-nuke-fixed.js — aggressive patch, removes "sponsored"/"playsaurus" text, ads, and DOM nodes with class/id "ad", "plad", or "aqad"
(function () {
  'use strict';

  const SILENT = false;
  const AUTO_CLEAN_MS = 2500;

  const BLOCK_DOMAINS = [
    'googlesyndication.com', 'pagead2.googlesyndication', 'adsbygoogle', 'doubleclick.net',
    'googleadservices.com', 'adservice.google', 'googleads.g.doubleclick.net', 'securepubads.g.doubleclick.net',
    'kongregate.com', 'kongcdn.com', 'cdn.kongregate', 'kong-static',
    'playsaurus', 'playsaurus.com', 'play-saurus', 'adservice', 'ads.', 'adserver'
  ];

  const BLOCK_IDS = ['ad', 'plad', 'aqad'];
  const BLOCK_CLASSES = ['ad', 'plad', 'aqad'];

  function log(...args) { if (!SILENT) console.info('[nuke]', ...args); }
  function urlMatchesBlocked(u) {
    if (!u) return false;
    try {
      const s = String(u).toLowerCase();
      return BLOCK_DOMAINS.some(d => s.includes(d));
    } catch (e) { return false; }
  }

  // defensive stubs
  if (!window.adsbygoogle) { window.adsbygoogle = []; window.adsbygoogle.push = () => {}; }
  window.googletag = window.googletag || {}; window.googletag.cmd = window.googletag.cmd || [];
  window.googletag.pubads = window.googletag.pubads || function () { return { enableSingleRequest: () => {}, enableAsyncRendering: () => {} }; };
  if (!window.kongregateAPI) {
    window.kongregateAPI = {
      loadAPI(cb) { try { cb && cb(window.kongregateAPI); } catch (e) {} return { then: f => { try { f(window.kongregateAPI); } catch(e){} } }; },
      services: { stats: { submit: () => {} }, payments: { purchaseItem: () => Promise.resolve({ success: false }) } },
      getAPI() { return window.kongregateAPI; }
    };
  }
  if (!window.playsaurus) { window.playsaurus = { analytics: {}, ads: {} }; }

  // Network blocking (fetch/XHR/beacon)
  (function () {
    const nativeFetch = window.fetch;
    if (nativeFetch) {
      window.fetch = function(input, init) {
        try {
          const url = typeof input === 'string' ? input : (input && input.url);
          if (urlMatchesBlocked(url)) { log('blocked fetch', url); return Promise.resolve(new Response(null, {status: 204, statusText:'Blocked'})); }
        } catch(e) {}
        return nativeFetch.apply(this, arguments);
      };
    }

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._nukeBlocked = urlMatchesBlocked(url);
      if (this._nukeBlocked) log('marked XHR blocked', url);
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      if (this._nukeBlocked) { try { this.abort && this.abort(); this.dispatchEvent && this.dispatchEvent(new Event('loadend')); } catch(e){} return; }
      return origSend.apply(this, arguments);
    };

    if (navigator.sendBeacon) {
      const nativeBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function(url, data) {
        if (urlMatchesBlocked(url)) { log('blocked beacon', url); return true; }
        return nativeBeacon.apply(this, arguments);
      };
    }
  })();

  // DOM sweep function
  const sponsoredRegex = /\bsponsored\b/i;
  const playsaurusRegex = /\bplaysaurus\b/i;
  const sponsoredLinkRegex = /\bsponsored\b.*\blink\b|\blink\b.*\bsponsored\b/i;

  function shouldRemoveElement(el) {
    if (!el) return false;
    const text = (el.innerText || el.textContent || '').toLowerCase();
    if (text && (sponsoredRegex.test(text) || playsaurusRegex.test(text) || sponsoredLinkRegex.test(text))) return true;
    const aria = el.getAttribute ? ((el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase()) : '';
    if (aria && (sponsoredRegex.test(aria) || playsaurusRegex.test(aria) || sponsoredLinkRegex.test(aria))) return true;
    const cls = (el.className || '').toLowerCase();
    if (BLOCK_CLASSES.some(bc => cls.includes(bc))) return true;
    const id = (el.id || '').toLowerCase();
    if (BLOCK_IDS.some(bi => id.includes(bi))) return true;
    return false;
  }

  function sweep(root) {
    try {
      const rootEl = root || document;
      // remove ad/blocked element sources
      const nodes = rootEl.querySelectorAll('*[src], *[href], *[data-ad], .adsbygoogle');
      for (const n of nodes) {
        try {
          const src = n.src || n.getAttribute('src') || n.getAttribute('href') || '';
          if (urlMatchesBlocked(src)) { n.parentNode && n.parentNode.removeChild(n); log('removed blocked element', src); }
        } catch(e){}
      }
      // remove elements by text/class/id
      const all = rootEl.querySelectorAll('*');
      for (const el of all) {
        try {
          if (shouldRemoveElement(el)) { el.parentNode && el.parentNode.removeChild(el); log('removed element', el.tagName, el.className || el.id || ''); }
        } catch(e){}
      }
    } catch(e){}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>sweep(document));
  else sweep(document);

  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        try {
          if (!n) continue;
          if (n.nodeType === 3) { const t = (n.nodeValue||'').trim().toLowerCase(); if (t && (sponsoredRegex.test(t) || playsaurusRegex.test(t) || sponsoredLinkRegex.test(t))) { const p = n.parentNode; p && p.parentNode && p.parentNode.removeChild(p); log('MO removed text node parent'); } continue; }
          sweep(n);
        } catch(e){}
      }
    }
  });
  try { mo.observe(document.documentElement||document, { childList:true, subtree:true }); } catch(e){}

  const periodic = setInterval(()=>{ sweep(document); }, AUTO_CLEAN_MS);

  window.__nuke = {
    addBlockedDomain: d => { BLOCK_DOMAINS.push(d.toLowerCase()); log('added blocked domain', d); },
    listBlocked: () => BLOCK_DOMAINS.slice(),
    stop: () => { mo.disconnect(); clearInterval(periodic); log('stopped nuke'); },
    sweep: () => sweep(document)
  };

  log('kong-nuke-fixed active — removes sponsored/playsaurus text, ads, and nodes with class/id "ad", "plad", "aqad"');
})();
