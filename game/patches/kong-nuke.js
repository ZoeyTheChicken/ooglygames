// ad-nuke.js — remove Google ads and any node containing "^ Sponsored link ^"
// Place this BEFORE the game's main JS so it runs early.

(function () {
  'use strict';

  const SILENT = false;
  const AUTO_CLEAN_MS = 2500; // periodic sweep
  const AD_DOMAINS = [
    'googlesyndication.com',
    'adsbygoogle.js',
    'pagead2.googlesyndication',
    'doubleclick.net',
    'googleadservices.com',
    'adservice.google.com',
    'adservice.google',
    'ads.google.com',
    'googleads.g.doubleclick.net',
    'securepubads.g.doubleclick.net'
  ];

  function log(...a) { if (!SILENT) console.info('[ad-nuke]', ...a); }

  function isAdUrl(url) {
    if (!url) return false;
    try {
      const s = String(url).toLowerCase();
      return AD_DOMAINS.some(d => d && s.includes(d));
    } catch (e) { return false; }
  }

  // --- 1) Stub common ad globals so code won't throw ---
  try {
    // adsbygoogle global array pattern: window.adsbygoogle = window.adsbygoogle || [];
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
      window.adsbygoogle.push = function () { /* noop */ };
    } else {
      // ensure push exists and is safe
      window.adsbygoogle.push = window.adsbygoogle.push || function () {};
    }
  } catch (e) {}

  // some ad libs call googletag, define minimal stub
  try {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    if (!window.googletag.pubads) {
      window.googletag.pubads = function () { return { enableSingleRequest: () => {}, enableAsyncRendering: () => {} }; };
    }
  } catch (e) {}

  // --- 2) override fetch/XHR/Beacon to short-circuit ad domain requests ---
  (function overrideNetwork() {
    const _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url);
        if (isAdUrl(url)) {
          log('blocked fetch to ad url', url);
          return Promise.resolve(new Response(null, { status: 204, statusText: 'Blocked by ad-nuke' }));
        }
      } catch (e) {}
      return _fetch.apply(this, arguments);
    };

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        this._adNukeBlocked = isAdUrl(url);
        if (this._adNukeBlocked) log('marked XHR blocked', url);
      } catch (e) { this._adNukeBlocked = false; }
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this._adNukeBlocked) {
        try { this.abort && this.abort(); this.dispatchEvent && this.dispatchEvent(new Event('loadend')); } catch (e) {}
        return;
      }
      return origSend.apply(this, arguments);
    };

    if (navigator.sendBeacon) {
      const nativeBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function (url, data) {
        try { if (isAdUrl(url)) { log('blocked beacon', url); return true; } } catch (e) {}
        return nativeBeacon.apply(this, arguments);
      };
    }
  })();

  // --- 3) block script/iframe/link insertion and createElement src protection ---
  (function protectDOM() {
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function (tagName, options) {
      const el = origCreate.call(this, tagName, options);
      try {
        const tag = (tagName || '').toLowerCase();
        if (tag === 'script' || tag === 'iframe' || tag === 'link') {
          // define setter interception for src/href/data-src to refuse ad URLs
          const setSrc = function (v) {
            try {
              if (isAdUrl(v)) { log('blocked set src on', tag, v); return; }
            } catch (e) {}
            try {
              if (tag === 'link') this.setAttribute('href', v);
              else this.setAttribute('src', v);
            } catch (e) {}
          };
          try {
            Object.defineProperty(el, 'src', { set: setSrc, get: function () { return this.getAttribute('src'); }, configurable: true });
            Object.defineProperty(el, 'href', { set: setSrc, get: function () { return this.getAttribute('href'); }, configurable: true });
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
          const src = node.src || node.getAttribute && (node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src'));
          if ((t === 'script' || t === 'iframe' || t === 'link') && isAdUrl(src)) {
            log('blocked appendChild for ad node', src);
            return node;
          }
        }
      } catch (e) {}
      return origAppend.call(this, node);
    };

    const origInsert = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, ref) {
      try {
        if (node && node.tagName) {
          const t = node.tagName.toLowerCase();
          const src = node.src || node.getAttribute && (node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('data-src'));
          if ((t === 'script' || t === 'iframe' || t === 'link') && isAdUrl(src)) {
            log('blocked insertBefore for ad node', src);
            return node;
          }
        }
      } catch (e) {}
      return origInsert.call(this, node, ref);
    };
  })();

  // --- 4) Block document.write that injects ad content ---
  (function protectWrite() {
    const origWrite = Document.prototype.write;
    Document.prototype.write = function (str) {
      try {
        if (typeof str === 'string' && AD_DOMAINS.some(d => str.toLowerCase().includes(d))) {
          log('blocked document.write that contained ad domain');
          return;
        }
      } catch (e) {}
      return origWrite.call(this, str);
    };
  })();

  // --- 5) Remove nodes with the exact-looking "Sponsored link" text and ad nodes ---
  const sponsoredRegex = /^\s*\^\s*Sponsored\s+link\s*\^\s*$/i; // matches lines like: ^ Sponsored link ^
  function removeSponsoredNodes(root) {
    try {
      // search for nodes that directly contain the pattern as a full text node or as trimmed innerText line
      const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null, false);
      const toRemove = new Set();
      let n;
      while (n = walker.nextNode()) {
        const txt = n.nodeValue && String(n.nodeValue).trim();
        if (!txt) continue;
        // test each line inside the text node in case it's multi-line
        const lines = txt.split(/\r?\n/).map(s => s.trim());
        for (const line of lines) {
          if (sponsoredRegex.test(line)) {
            // mark the parent element for removal (or the node if safe)
            const parent = n.parentElement || n.parentNode;
            if (parent) toRemove.add(parent);
          }
        }
      }
      // Also do a broader scan: any element whose visible innerText contains the phrase
      const els = (root || document.body).querySelectorAll('*');
      for (const el of els) {
        try {
          const it = (el.innerText || '').split(/\r?\n/).map(s => s.trim());
          for (const line of it) {
            if (sponsoredRegex.test(line)) {
              toRemove.add(el);
              break;
            }
          }
        } catch (e) {}
      }
      // perform removals
      for (const el of toRemove) {
        try {
          log('removed sponsored node:', el.tagName, el.className || '');
          el.parentNode && el.parentNode.removeChild(el);
        } catch (e) {}
      }
    } catch (e) {}
  }

  // --- 6) sweep function to remove ad nodes and scripts that slipped through ---
  function sweepAds(root) {
    try {
      // remove scripts/iframes/links whose src/href look ad-like
      const all = (root || document).querySelectorAll('script[src], iframe[src], link[href], img[src]');
      for (const el of all) {
        try {
          const src = el.src || el.getAttribute('src') || el.getAttribute('href') || '';
          if (isAdUrl(src)) {
            log('removed ad element', el.tagName, src);
            el.parentNode && el.parentNode.removeChild(el);
            continue;
          }
          // remove typical google ad attributes e.g. class="adsbygoogle"
          const cls = (el.className || '').toString().toLowerCase();
          if (cls.includes('adsbygoogle') || cls.includes('ad') || cls.includes('google-ad')) {
            // be conservative: if element contains ad-related class and small size, remove
            log('removed ad-like element by class', el.tagName, el.className);
            el.parentNode && el.parentNode.removeChild(el);
          }
        } catch (e) {}
      }

      // remove elements with data-ad-* attributes
      const dataAdEls = (root || document).querySelectorAll('[data-ad], [data-ad-client], [data-ad-slot]');
      for (const el of dataAdEls) {
        try { log('removed data-ad element', el.tagName); el.parentNode && el.parentNode.removeChild(el); } catch (e) {}
      }

      // remove inline ad placeholders like ins.adsbygoogle
      const insEls = (root || document).querySelectorAll('ins.adsbygoogle, .adsbygoogle');
      for (const el of insEls) {
        try { log('removed ins.adsbygoogle'); el.parentNode && el.parentNode.removeChild(el); } catch (e) {}
      }

      // remove elements with aria-label or title that look like 'Sponsored'
      const possible = (root || document).querySelectorAll('[aria-label], [title]');
      for (const el of possible) {
        try {
          const label = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
          if (label.includes('sponsored') || label.includes('sponsored link')) {
            log('removed element by aria/title sponsored', el.tagName);
            el.parentNode && el.parentNode.removeChild(el);
          }
        } catch (e) {}
      }

      // finally remove nodes containing the explicit sponsored text
      removeSponsoredNodes(root || document.body);
    } catch (e) {}
  }

  // initial sweep as soon as DOM exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { sweepAds(document); });
  } else {
    sweepAds(document);
  }

  // MutationObserver to react to dynamically added ad nodes
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      try {
        // check added nodes subtree quickly
        for (const n of m.addedNodes) {
          try {
            if (!n) continue;
            if (n.nodeType === 3) { // text node
              const text = (n.nodeValue || '').trim();
              if (text && sponsoredRegex.test(text)) {
                const p = n.parentElement || n.parentNode;
                try { p && p.parentNode && p.parentNode.removeChild(p); log('MO removed sponsored text'); } catch (e) {}
              }
              continue;
            }
            // if element node, sweep its subtree
            sweepAds(n);
          } catch (e) {}
        }
      } catch (e) {}
    }
  });
  try { mo.observe(document.documentElement || document, { childList: true, subtree: true }); } catch (e) {}

  // periodic aggressive sweep in case something sneaks through
  const periodic = setInterval(() => { try { sweepAds(document); } catch (e) {} }, AUTO_CLEAN_MS);

  // runtime API
  window.__adNuke = {
    addAdDomain(d) { try { AD_DOMAINS.push(d.toLowerCase()); log('ad domain added', d); } catch (e) {} },
    stop() { try { mo.disconnect(); clearInterval(periodic); log('ad-nuke stopped'); } catch (e) {} },
    sweep: () => sweepAds(document)
  };

  log('ad-nuke active — blocking Google ad domains and removing "Sponsored link" nodes.');
})();
