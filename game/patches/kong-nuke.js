// ad-kong-playsaurus-nuke.js — aggressive ad + kong + playsaurus remover
// Place this BEFORE the game's main JS. Highly aggressive: removes nodes containing "sponsored" or "playsaurus"
// and blocks ad / kong / playsaurus network requests & injected scripts/iframes.

(function () {
  'use strict';

  const SILENT = false;
  const AUTO_CLEAN_MS = 2500;

  // domains / substrings to block on network & element src/href
  const BLOCK_DOMAINS = [
    // Google ad stuff
    'googlesyndication.com',
    'pagead2.googlesyndication',
    'adsbygoogle',
    'doubleclick.net',
    'googleadservices.com',
    'adservice.google',
    'googleads.g.doubleclick.net',
    'securepubads.g.doubleclick.net',
    // Kong-like
    'kongregate.com',
    'kongcdn.com',
    'cdn.kongregate',
    'kong-static',
    // Playsaurus (games devs like to hide stuff under multiple hosts)
    'playsaurus',
    'playsaurus.com',
    'play-saurus',
    'playsaurusstats.com',
    // optional extras
    'adservice',
    'ads.',
    'adserver'
  ];

  function log(...args) { if (!SILENT) console.info('[nuke]', ...args); }

  function urlMatchesBlocked(u) {
    if (!u) return false;
    try {
      const s = String(u).toLowerCase();
      return BLOCK_DOMAINS.some(d => d && s.includes(d));
    } catch (e) { return false; }
  }

  // ---------- defensive stubs ----------
  try {
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
      window.adsbygoogle.push = function () { /* noop */ };
    } else {
      window.adsbygoogle.push = window.adsbygoogle.push || function () {};
    }
  } catch (e) {}

  try {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.pubads = window.googletag.pubads || function () { return { enableSingleRequest: ()=>{}, enableAsyncRendering: ()=>{} }; };
  } catch (e) {}

  // kong/playsaurus defensive API stubs
  try {
    if (!window.kongregateAPI) {
      window.kongregateAPI = {
        loadAPI: function (cb) { try { if (typeof cb === 'function') cb(window.kongregateAPI); } catch(e){} return { then: f => { try { f(window.kongregateAPI); } catch(e){} } }; },
        services: { stats: { submit: ()=>{} }, payments: { purchaseItem: ()=>Promise.resolve({ success: false }) } },
        getAPI: function () { return window.kongregateAPI; }
      };
      log('stubbed kongregateAPI');
    }
  } catch (e) {}

  try {
    if (!window.playsaurus) {
      window.playsaurus = { analytics: {}, ads: {} };
      log('stubbed playsaurus global');
    }
  } catch (e) {}

  // ---------- network blocking: fetch / XHR / beacon ----------
  (function () {
    const nativeFetch = window.fetch;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        try {
          const url = typeof input === 'string' ? input : (input && input.url);
          if (urlMatchesBlocked(url)) {
            log('blocked fetch', url);
            return Promise.resolve(new Response(null, { status: 204, statusText: 'Blocked' }));
          }
        } catch (e) {}
        return nativeFetch.apply(this, arguments);
      };
    }

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        this._nukeBlocked = urlMatchesBlocked(url);
        if (this._nukeBlocked) log('marked XHR blocked', url);
      } catch (e) { this._nukeBlocked = false; }
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this._nukeBlocked) {
        try { this.abort && this.abort(); this.dispatchEvent && this.dispatchEvent(new Event('loadend')); } catch (e) {}
        return;
      }
      return origSend.apply(this, arguments);
    };

    if (navigator.sendBeacon) {
      const nativeBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url, data) {
        try { if (urlMatchesBlocked(url)) { log('blocked beacon', url); return true; } } catch (e) {}
        return nativeBeacon.apply(this, arguments);
      };
    }
  })();

  // ---------- DOM insertion protections ----------
  (function () {
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function (tagName, opts) {
      const el = origCreate.call(this, tagName, opts);
      try {
        const t = (tagName||'').toLowerCase();
        if (t === 'script' || t === 'iframe' || t === 'link' || t === 'img') {
          // intercept src/href setters
          try {
            Object.defineProperty(el, 'src', {
              set(v) {
                try { if (urlMatchesBlocked(v)) { log('blocked src set', v); return; } } catch (e) {}
                try { this.setAttribute('src', v); } catch (e) {}
              },
              get() { return this.getAttribute && this.getAttribute('src'); },
              configurable: true
            });
          } catch (e) {}
          try {
            Object.defineProperty(el, 'href', {
              set(v) {
                try { if (urlMatchesBlocked(v)) { log('blocked href set', v); return; } } catch (e) {}
                try { this.setAttribute('href', v); } catch (e) {}
              },
              get() { return this.getAttribute && this.getAttribute('href'); },
              configurable: true
            });
          } catch (e) {}
        }
      } catch (e) {}
      return el;
    };

    const origAppend = Element.prototype.appendChild;
    Element.prototype.appendChild = function (node) {
      try {
        if (node && node.tagName) {
          const t = node.tagName.toLowerCase();
          const src = node.src || (node.getAttribute && (node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src')));
          if ((t === 'script' || t === 'iframe' || t === 'link' || t === 'img') && urlMatchesBlocked(src)) {
            log('blocked appendChild for blocked node', src);
            return node;
          }
        }
      } catch (e) {}
      return origAppend.call(this, node);
    };

    const origInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, ref) {
      try {
        if (node && node.tagName) {
          const t = node.tagName.toLowerCase();
          const src = node.src || (node.getAttribute && (node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src')));
          if ((t === 'script' || t === 'iframe' || t === 'link' || t === 'img') && urlMatchesBlocked(src)) {
            log('blocked insertBefore for blocked node', src);
            return node;
          }
        }
      } catch (e) {}
      return origInsertBefore.call(this, node, ref);
    };
  })();

  // block document.write that injects blocked content
  (function () {
    const origWrite = Document.prototype.write;
    Document.prototype.write = function (str) {
      try {
        if (typeof str === 'string' && BLOCK_DOMAINS.some(d => str.toLowerCase().includes(d))) {
          log('blocked document.write containing blocked domain');
          return;
        }
      } catch (e) {}
      return origWrite.call(this, str);
    };
  })();

  // tame innerHTML setter to avoid wholesale injections containing blocked domains or "sponsored"/"playsaurus"
  (function () {
    try {
      const prop = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') || Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
      if (prop && prop.set) {
        const origSetter = prop.set;
        Object.defineProperty(Element.prototype, 'innerHTML', {
          set: function (val) {
            try {
              if (typeof val === 'string') {
                const v = val.toLowerCase();
                if (BLOCK_DOMAINS.some(d => v.includes(d)) || v.includes('sponsored') || v.includes('playsaurus')) {
                  log('blocked innerHTML containing blocked content');
                  return;
                }
              }
            } catch (e) {}
            return origSetter.call(this, val);
          }
        });
      }
    } catch (e) {}
  })();

  // ---------- remove nodes containing "sponsored" / "playsaurus" / "sponsored" + "link" ----------
  const sponsoredRegexLine = /\bsponsored\b/i;
  const playsaurusRegex = /\bplaysaurus\b/i;
  const sponsoredAndLinkRegex = /\bsponsored\b.*\blink\b|\blink\b.*\bsponsored\b/i;

  function shouldRemoveElement(el) {
    try {
      if (!el) return false;
      // text content check
      const txt = (el.innerText || el.textContent || '').trim().toLowerCase();
      if (!txt) return false;
      if (sponsoredRegexLine.test(txt) || playsaurusRegex.test(txt)) return true;
      if (sponsoredAndLinkRegex.test(txt)) return true;
      // aria/title attributes
      const aria = (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title') || '')) || '';
      if (aria && (sponsoredRegexLine.test(aria) || playsaurusRegex.test(aria) || sponsoredAndLinkRegex.test(aria))) return true;
      return false;
    } catch (e) { return false; }
  }

  function sweepAndRemove(root) {
    try {
      const rootEl = root || document;
      // remove ad/blocked element sources
      const nodes = rootEl.querySelectorAll('script[src], iframe[src], link[href], img[src], [data-ad], .adsbygoogle, [data-ad-client], [data-ad-slot]');
      for (const n of nodes) {
        try {
          const src = n.src || n.getAttribute('src') || n.getAttribute('href') || '';
          if (urlMatchesBlocked(src)) { log('removed blocked src element', src); n.parentNode && n.parentNode.removeChild(n); continue; }
          // crude class removal for ad classes
          const cls = (n.className || '').toString().toLowerCase();
          if (cls.includes('adsbygoogle') || cls.includes('ad-') || cls.includes('adslot') || cls.includes('google-ad')) {
            log('removed element by ad-class', n.tagName, n.className); n.parentNode && n.parentNode.removeChild(n); continue;
          }
        } catch (e) {}
      }

      // remove nodes with sponsored/playsaurus text
      const all = rootEl.querySelectorAll('*');
      for (const el of all) {
        try {
          if (shouldRemoveElement(el)) {
            log('removed element by text match', el.tagName, (el.className||'').toString().slice(0,60));
            el.parentNode && el.parentNode.removeChild(el);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // initial sweep
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => sweepAndRemove(document));
  } else {
    sweepAndRemove(document);
  }

  // MutationObserver to catch dynamic insertions
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        try {
          if (!n) continue;
          if (n.nodeType === 3) { // text node
            const t = (n.nodeValue||'').trim();
            if (t && (sponsoredRegexLine.test(t) || playsaurusRegex.test(t) || sponsoredAndLinkRegex.test(t))) {
              const p = n.parentNode; try { p && p.parentNode && p.parentNode.removeChild(p); log('MO removed text node parent'); } catch(e) {}
            }
            continue;
          }
          // sweep subtree
          sweepAndRemove(n);
        } catch (e) {}
      }
    }
  });

  try { mo.observe(document.documentElement || document, { childList: true, subtree: true }); } catch (e) {}

  // periodic sweep
  const periodic = setInterval(() => { try { sweepAndRemove(document); } catch (e) {} }, AUTO_CLEAN_MS);

  // runtime controls
  window.__nuke = {
    addBlockedDomain(d) { try { BLOCK_DOMAINS.push(d.toLowerCase()); log('added blocked domain', d); } catch (e) {} },
    listBlocked() { return BLOCK_DOMAINS.slice(); },
    stop() { try { mo.disconnect(); clearInterval(periodic); log('stopped nuke'); } catch (e) {} },
    sweep() { try { sweepAndRemove(document); } catch (e) {} }
  };

  log('ad-kong-playsaurus-nuke active — removing nodes with "sponsored" or "playsaurus" and blocking ad domains.');
})();
