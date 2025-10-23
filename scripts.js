/* Advanced Oogly Boogly UI script
   - search, category filter, lazy thumbnails, prefetch-on-hover,
   - recent plays stored in localStorage, keyboard nav
*/

const games = [
  { title:"Report an issue", "html-link":"/help.html", "obg-track-link":"", category:"Utility", thumbnail:"/thumbs/help.png" },
  { title:"Minecraft 1.12.2", "html-link":"game/eagler1122w/", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/e1122.jpg" },
  { title:"Minecraft 1.8.8", "html-link":"game/eagler188w/", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/e188.jpg" },
  { title:"Minecraft 1.5.2", "html-link":"game/eagler152/", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/e152.jpg" },
  { title:"Snow Rider 3D", "html-link":"game/snowrider/", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/snow.jpg" },
  { title:"Asteroids", "html-link":"game/asteroids/", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/asteroids.jpg" },
  { title:"Dino", "html-link":"game/dino/", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/dino.jpg" },
  { title:"DinoGame++", "html-link":"game/dinoplusplus/", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/dinoplus.jpg" },
  { title:"2048", "html-link":"game/2048/", "obg-track-link":"", category:"Puzzle", thumbnail:"/thumbs/2048.jpg" },
  { title:"ASCII Space", "html-link":"game/asciispace", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/ascii.jpg" },
  { title:"Terraria (broken, fixing)", "html-link":"game/terraria", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/terraria.jpg" },
  { title:"Henry Stickman: Breaking the Bank", "html-link":"game/btb", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/btb.jpg" },
  { title:"Henry Stickman: Escaping the Prison", "html-link":"game/etp", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/etp.jpg" },
  { title:"Henry Stickman: Crossing the Pit", "html-link":"game/fctp", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/fctp.jpg" },
  { title:"Henry Stickman: Fleeing the Complex", "html-link":"game/ftc", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/ftc.jpg" },
  { title:"Henry Stickman: Infiltrating the Airship", "html-link":"game/ita", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/ita.jpg" },
  { title:"Henry Stickman: Stealing the Diamond", "html-link":"game/stealingthediamond", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/diamond.jpg" },
  { title:"Cookie Clicker", "html-link":"game/index.html", "obg-track-link":"", category:"Idle", thumbnail:"/thumbs/cookie.jpg" },
  { title:"Drift Boss", "html-link":"game/driftboss", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/drift.jpg" },
  { title:"Snake.io", "html-link":"game/snakeio", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/snake.jpg" },
  { title:"Drift Hunters", "html-link":"game/drifthunters", "obg-track-link":"", category:"Arcade", thumbnail:"/thumbs/drifthunters.jpg" },
  { title:"Race Survival Arena King", "html-link":"/rsak", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/rsak.jpg" },
  { title:"Deadly Descent", "html-link":"/dd", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/dd.jpg" },
  { title:"ArrowMaster.io", "html-link":"/am", "obg-track-link":"", category:"Action", thumbnail:"/thumbs/am.jpg" },
];

// ---------- helpers ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const listEl = $('#list');
const searchEl = $('#search');
const catEl = $('#categoryFilter');
const countEl = $('#count');
const recentEl = $('#recent');

let filtered = games.slice();
let focusedIndex = -1;
let observer;

// ---------- render functions ----------
function renderList(items){
  // perf: build fragment
  const frag = document.createDocumentFragment();
  listEl.innerHTML = '';
  items.forEach((g, idx) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.setAttribute('role','listitem');
    item.tabIndex = 0;
    item.dataset.idx = idx;

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    // lazy load img if thumbnail present
    if (g.thumbnail) {
      const img = document.createElement('img');
      img.dataset.src = g.thumbnail;
      img.alt = g.title + ' thumbnail';
      img.style.width = '100%'; img.style.height='100%'; img.style.objectFit='cover';
      img.loading = 'lazy';
      img.decoding = 'async';
      thumb.appendChild(img);
    } else {
      thumb.textContent = '🎮';
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = g.title;
    const cat = document.createElement('div');
    cat.className = 'cat';
    cat.textContent = g.category || '';
    meta.appendChild(title);
    meta.appendChild(cat);

    item.appendChild(thumb);
    item.appendChild(meta);

    // click behavior
    item.addEventListener('click', () => openGame(g));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openGame(g);
      if (e.key === 'ArrowDown') focusNext();
      if (e.key === 'ArrowUp') focusPrev();
    });

    // prefetch on hover (gentle)
    let prefetched = false;
    item.addEventListener('pointerenter', () => {
      if (g['obg-track-link']) fetch(g['obg-track-link']).catch(()=>{});
      if (!prefetched) {
        prefetch(g['html-link']);
        prefetched = true;
      }
    });

    frag.appendChild(item);
  });

  listEl.appendChild(frag);
  updateCount(items.length);
  lazyInitObserver();
}

// lazy-load thumbnails via IntersectionObserver for perf
function lazyInitObserver(){
  if (observer) observer.disconnect();
  const imgs = listEl.querySelectorAll('img[data-src]');
  if (!imgs.length) return;
  observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const img = en.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        obs.unobserve(img);
      }
    });
  }, {root: listEl, rootMargin: '200px 0px'});
  imgs.forEach(i => observer.observe(i));
}

// prefetch small (HEAD) to warm caches without downloading heavy body
function prefetch(url){
  if (!url) return;
  // minor sanity: only prefetch same-origin or permissive cross-origin
  try {
    const u = new URL(url, location.href);
    fetch(u.href, { method: 'HEAD', mode: 'no-cors' }).catch(()=>{});
  } catch(e){}
}

// open game in new tab and track recent
function openGame(g){
  // tracking ping
  if (g['obg-track-link']) {
    navigator.sendBeacon ? navigator.sendBeacon(g['obg-track-link']) : fetch(g['obg-track-link']).catch(()=>{});
  }
  // open in new tab
  window.open(g['html-link'], '_blank', 'noopener');

  addRecent(g);
}

// update game count display
function updateCount(n){
  countEl.textContent = `${n} game${n===1?'':'s'}`;
}

// ---------- search & filters (debounced) ----------
let searchTimer = null;
function applyFilters(){
  const q = (searchEl.value || '').trim().toLowerCase();
  const cat = catEl.value;
  filtered = games.filter(g => {
    if (cat !== 'all' && (g.category || '').toLowerCase() !== cat.toLowerCase()) return false;
    if (!q) return true;
    return (g.title || '').toLowerCase().includes(q) || (g.category||'').toLowerCase().includes(q);
  });
  if (filtered.length === 0){
    $('#empty').hidden = false;
    $('#welcome').hidden = true;
  } else {
    $('#empty').hidden = true;
    $('#welcome').hidden = false;
  }
  // render from filtered copy
  renderList(filtered);
}

function debounceApply(){
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(()=> {
    applyFilters();
  }, 180);
}

// events
searchEl.addEventListener('input', debounceApply);
catEl.addEventListener('change', applyFilters);

// keyboard shortcut to focus search
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchEl) {
    e.preventDefault();
    searchEl.focus();
  } else if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); searchEl.focus();
  } else if (e.key === 'ArrowDown') {
    // move focus to first item
    const first = listEl.querySelector('.item');
    if (first) first.focus();
  }
});

// ---------- recent plays ----------
const RECENT_KEY = 'obg_recent';
function getRecent(){
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch(e){ return []; }
}
function setRecent(arr){ try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr)); } catch(e){} }

function addRecent(g){
  const cur = getRecent();
  const found = cur.find(x => x.htmlLink === g['html-link']);
  if (found) {
    // move to front
    const filtered = cur.filter(x => x.htmlLink !== g['html-link']);
    filtered.unshift({ title: g.title, htmlLink: g['html-link']});
    setRecent(filtered.slice(0,8));
  } else {
    cur.unshift({ title: g.title, htmlLink: g['html-link']});
    setRecent(cur.slice(0,8));
  }
  renderRecent();
}
function renderRecent(){
  recentEl.innerHTML = '';
  const cur = getRecent();
  if (!cur.length) {
    recentEl.textContent = 'No recent plays';
    return;
  }
  cur.forEach(r => {
    const b = document.createElement('button');
    b.textContent = r.title;
    b.addEventListener('click', ()=> window.open(r.htmlLink, '_blank','noopener'));
    recentEl.appendChild(b);
  });
}

// ---------- theme toggle ----------
$('#toggleDark').addEventListener('click', () => {
  document.body.classList.toggle('light');
  // persist
  try { localStorage.setItem('obg_theme_light', document.body.classList.contains('light')); } catch(e){}
});

// restore theme on load
try {
  if (localStorage.getItem('obg_theme_light') === 'true') document.body.classList.add('light');
} catch(e){}

// ---------- keyboard navigation helpers ----------
function focusNext(){
  const items = Array.from(listEl.querySelectorAll('.item'));
  if (!items.length) return;
  focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
  items[focusedIndex].focus();
}
function focusPrev(){
  const items = Array.from(listEl.querySelectorAll('.item'));
  if (!items.length) return;
  focusedIndex = Math.max(focusedIndex - 1, 0);
  items[focusedIndex].focus();
}

// keep track of focusedIndex when user focuses manually
listEl.addEventListener('focusin', e => {
  const item = e.target.closest('.item');
  if (!item) return;
  focusedIndex = parseInt(item.dataset.idx || 0, 10);
});

// ---------- init ----------
function init(){
  // initial render (idle friendly)
  if ('requestIdleCallback' in window){
    requestIdleCallback(()=> renderList(games.slice()));
  } else {
    setTimeout(()=> renderList(games.slice()), 50);
  }
  renderRecent();
  // show total count
  updateCount(games.length);
}

init();
