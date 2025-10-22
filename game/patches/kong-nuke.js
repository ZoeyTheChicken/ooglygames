// kong-nuke.js — aggressive Kongregate/ad network blocker + defensive stubs
// Place this BEFORE the game's main JS. Designed to be robust and low-noise.
// WARNING: This blocks domains by substring. Do not add PlayFab domains to BLOCK_DOMAINS.

(function () {
  'use strict';

  // ========== CONFIG ==========
  const SILENT = false; // true = minimize console noise
  const AUTO_CLEAN_MS = 3000; // periodic sweep interval (ms)
  const BLOCK_DOMAINS = [
    'kongregate.com',
    'kongcdn.com',
    'cdn.kongregate',
    'kong-static',
    'kongregate',
    'playigame', // example extras if needed; you can extend at runtime
  ];

  function log(...args) { if (!SILENT) console.info('[kong-nuke]', ...args); }

  function isBlockedUrl(url) {
    if (!url) return false;
    try {
      const s = String(url).toLowerCase();
      return BLOCK_DOMAINS.some(d => d && s.includes(d));
    } catch (e) {
      return false;
    }
  }

  // ========= Defensive API stubs =========
  (function setupStubs() {
    // Full defensive kongregateAPI and kongregate objects
    const fakeServices = {
      stats: { submit: () => {} },
      payments: { purchaseItem: () => Promise.resolve({ success: false }) },
      privileges: {},
      chat: {},
    };

    if (!window.kongregateAPI) {
      window.kongregateAPI = {
        loadAPI: function (cb) {
          try { if (typeof cb === 'function') cb(window.kongregateAPI); } catch (e) {}
          return { then: function (f) { try { f(window.kongregateAPI); } catch (e) {} } };
        },
        services: fakeServices,
        getAPI: function () { return window.kongregateAPI; }
      };
    } else {
      window.kongregateAPI.services = window.kongregateAPI.services || fakeServices;
    }

    if (!window.kongregate) {
      window.kongregate = {
        services: window.kongregateAPI.services,
        stats: window.kongregateAPI.services.stats,
        submitStat: function () {}
      };
    } else {
      window.kongregate.services = window.kongregate.services || window.kongregateAPI.services;
      window.kongregate.stats = window.kongregate.stats || window.kongregate.services.stats;
    }

    // Defensive no-op functions often used by scripts
    const noop = () => {};
    const noopAsync = () => Promise.resolve();

    window.kongregateAPI.services.stats.submit = window.kongregateAPI.services.stats.submit || noop;
    window.kongregateAPI.services.payments.purchaseItem = window.kongregateAPI.services.payments.purchaseItem || (() => Promise.resolve({ success: false }));
    window.kongregateAPI.getAPI = window.kongregateAPI.getAPI || (() => window.kongregateAPI);

    // legacy niceties
    window.kongregateStub = window.kongregateStub || window.kongregateAPI;
    log('kongregate API stubbed');
  })();

  // ========= Network-layer blocking =========
  // Fetch override
  (function overrideFetch() {
    const _fetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url);
        if (isBlockedUrl(url)) {
          log('blocked fetch', url);
          // Return a harmless response object to avoid breaking callers
          return Promise.resolve(new Response(null, { status: 204, statusText: 'Blocked by kong-nuke' }));
        }
      } catch (e) {}
      return _fetch.apply(this, arguments);
    };
  })();

  // XHR override
  (function overrideXHR() {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        this._kongNukeBlocked = isBlockedUrl(url);
        if (this._kongNukeBlocked) log('marked XHR blocked', url);
      } catch (e) { this._kongNukeBlocked = false; }
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this._kongNukeBlocked) {
        try {
          // Trigger events to avoid hangups in libraries
          this.abort && this.abort();
          this.dispatchEvent && this.dispatchEvent(new Event('loadend'));
        } catch (e) {}
        return;
      }
      return origSend.apply(this, arguments);
    };
  })();

  // Override navigator.sendBeacon to no-op for blocked urls
  (function overrideBeacon() {
    const nativeBeacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator);
    if (nativeBeacon) {
      navigator.sendBeacon = function (url, data) {
        try {
          if (isBlockedUrl(url)) {
            log('blocked beacon', url);
            return true; // pretend success
          }
        } catch (e) {}
        return nativeBeacon.apply(this, arguments);
      };
    }
  })();

  // ========= DOM insertion blocking =========
  (function overrideDOMInsertion() {
    const origCreate = Document.prototype.createElement;
    Document.prototype.createElement = function (tagName, options) {
      const el = origCreate.call(this, tagName, options);
      // If script/iframe created, wrap src-setters to block setting blocked URLs
      try {
        const tag = (tagName || '').toLowerCase();
        if (tag === 'script' || tag === 'iframe') {
          Object.defineProperty(el, 'src', {
            set(v) {
              try {
                if (isBlockedUrl(v)) {
                  log('blocked set src on element', v);
                  // leave src unset
                  return;
                }
              } catch (e) {}
              // default behavior
              HTMLScriptElement.prototype.__lookupSetter__ && HTMLScriptElement.prototype.__lookupSetter__('src') 
                ? HTMLScriptElement.prototype.__lookupSetter__('src').call(this, v)
                : (this.setAttribute && this.setAttribute('src', v));
            },
            get() { return this.getAttribute && this.getAttribute('src'); },
            configurable: true
          });
        }
      } catch (e) {}
      return el;
    };

    // appendChild/insertBefore guards (catch append-based injection)
    const origAppend = Element.prototype.appendChild;
    Element.prototype.appendChild = function (node) {
      try {
        if (node && node.tagName) {
          const tag = node.tagName.toLowerCase();
          const src = node.src || (node.getAttribute && (node.getAttribute('src') || node.getAttribute('data-src')));
          if ((tag === 'script' || tag === 'iframe') && isBlockedUrl(src)) {
            log('blocked appendChild', tag, src);
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
          const tag = node.tagName.toLowerCase();
          const src = node.src || (node.getAttribute && (node.getAttribute('src') || node.getAttribute('data-src')));
          if ((tag === 'script' || tag === 'iframe') && isBlockedUrl(src)) {
            log('blocked insertBefore', tag, src);
            return node;
          }
        }
      } catch (e) {}
      return origInsertBefore.call(this, node, ref);
    };
  })();

  // Intercept innerHTML/document.write to strip blocked tags/URLs
  (function overrideWriteInner() {
    const origWrite = Document.prototype.write;
    Document.prototype.write = function (str) {
      try {
        if (typeof str === 'string' && BLOCK_DOMAINS.some(d => str.toLowerCase().includes(d))) {
          log('blocked document.write with kong content');
          return;
        }
      } catch (e) {}
      return origWrite.call(this, str);
    };

    // Tame Element.prototype.innerHTML setter
    try {
      const info = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML') ||
                   Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerHTML');
      if (info && info.set) {
        const origSetter = info.set;
        Object.defineProperty(Element.prototype, 'innerHTML', {
          set: function (val) {
            try {
              if (typeof val === 'string' && BLOCK_DOMAINS.some(d => val.toLowerCase().includes(d))) {
                log('blocked innerHTML containing kong');
                return;
              }
            } catch (e) {}
            return origSetter.call(this, val);
          }
        });
      }
    } catch (e) {}
  })();

  // ========= Worker & importScripts interception =========
  (function overrideWorkers() {
    // Override importScripts for workers created by same-origin blobs
    try {
      const origImport = Worker.prototype.importScripts;
      if (origImport) {
        Worker.prototype.importScripts = function () {
          try {
            for (let i = 0; i < arguments.length; i++) {
              if (isBlockedUrl(arguments[i])) {
                log('blocked importScripts', arguments[i]);
                // skip blocked scripts
              } else {
                origImport.call(this, arguments[i]);
              }
            }
          } catch (e) {}
        };
      }
    } catch (e) {}

    // Intercept Worker constructor to prevent passing a direct kong script URL
    const OrigWorker = window.Worker;
    window.Worker = function (scriptURL, options) {
      try {
        if (isBlockedUrl(scriptURL)) {
          log('blocked Worker script creation', scriptURL);
          // create a tiny no-op worker using blob
          const blob = new Blob([`self.onmessage = function () {};`], { type: 'application/javascript' });
          const blobURL = URL.createObjectURL(blob);
          return new OrigWorker(blobURL, options);
        }
      } catch (e) {}
      return new OrigWorker(scriptURL, options);
    };
  })();

  // ========= MutationObserver sweep & initial cleanup =========
  const mo = new MutationObserver(mutations => {
    try {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          try {
            if (!node || !node.tagName) continue;
            const tag = node.tagName.toLowerCase();
            const src = node.src || (node.getAttribute && (node.getAttribute('src') || node.getAttribute('href')));
            if ((tag === 'script' || tag === 'iframe' || tag === 'link') && isBlockedUrl(src)) {
              log('MO removed node', tag, src);
              node.parentNode && node.parentNode.removeChild(node);
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  });

  try {
    mo.observe(document.documentElement || document, { childList: true, subtree: true });
  } catch (e) {}

  function initialSweep() {
    try {
      const tags = document.querySelectorAll('script[src], iframe[src], link[href]');
      for (const el of tags) {
        try {
          const src = el.src || el.getAttribute('src') || el.getAttribute('href');
          if (isBlockedUrl(src)) {
            log('initial sweep removed', src);
            el.parentNode && el.parentNode.removeChild(el);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialSweep);
  else initialSweep();

  // ========= Periodic aggressive sweep =========
  const periodicCleaner = setInterval(() => {
    try {
      // remove iframes/scripts that sneaked through
      const all = document.querySelectorAll('iframe, script, link');
      for (const el of all) {
        try {
          const src = el.src || el.getAttribute && (el.getAttribute('src') || el.getAttribute('href') || '');
          if (isBlockedUrl(src)) {
            el.parentNode && el.parentNode.removeChild(el);
            log('periodic removed', src);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }, AUTO_CLEAN_MS);

  // ========= Runtime control API =========
  window.__kongNuke = {
    addBlocked(domain) {
      try { BLOCK_DOMAINS.push(domain.toLowerCase()); log('added block', domain); } catch (e) {}
    },
    removeBlocked(domain) {
      try {
        const idx = BLOCK_DOMAINS.indexOf(domain.toLowerCase());
        if (idx >= 0) BLOCK_DOMAINS.splice(idx, 1);
        log('removed block', domain);
      } catch (e) {}
    },
    listBlocked() { return BLOCK_DOMAINS.slice(); },
    stop() {
      try { mo.disconnect(); clearInterval(periodicCleaner); log('stopped kong-nuke'); } catch (e) {}
    },
    isBlockedUrl
  };

  log('kong-nuke active — aggressive mode (PlayFab NOT blocked).');

})();
