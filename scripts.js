/* Oogly Boogly — Glass UI v2
   Features:
   - glassmorphism theme + modes (dark/light/oled)
   - accent color picker (persisted)
   - search, category filter, debounced
   - recent plays in localStorage
   - keyboard nav (/ to search, arrows in list)
   - Alternative Domains modal -> separate page available
*/

/* -------- games list (no thumbnails) -------- */
const games = [
  { title:"Report an issue", "html-link":"/help.html", "obg-track-link":"", category:"Utility" },
  { title:"______________________________", "html-link":"#", "obg-track-link":"", category:"" },
  { title:"Minecraft 1.12.2", "html-link":"game/eagler1122w/", "obg-track-link":"", category:"Action" },
  { title:"Minecraft 1.5.2 (Precision Client)", "html-link":"game/eagler152precisionc/", "obg-track-link":"", category:"Action" },
  { title:"Minecraft 1.8.8", "html-link":"game/eagler188w/", "obg-track-link":"", category:"Action" },
  { title:"Minecraft 1.5.2", "html-link":"game/eagler152/", "obg-track-link":"", category:"Action" },
  { title:"Snow Rider 3D", "html-link":"game/snowrider/", "obg-track-link":"", category:"Arcade" },
  { title:"Asteroids", "html-link":"game/asteroids/", "obg-track-link":"", category:"Arcade" },
  { title:"Dino", "html-link":"game/dino/", "obg-track-link":"", category:"Arcade" },
  { title:"DinoGame++", "html-link":"game/dinoplusplus/", "obg-track-link":"", category:"Arcade" },
  { title:"2048", "html-link":"game/2048/", "obg-track-link":"", category:"Puzzle" },
  { title:"ASCII Space", "html-link":"game/asciispace", "obg-track-link":"", category:"Action" },
  { title:"Terraria (broken, fixing)", "html-link":"game/terraria", "obg-track-link":"", category:"Action" },
  { title:"Henry Stickman: Breaking the Bank", "html-link":"game/btb", "obg-track-link":"", category:"Arcade" },
  { title:"Henry Stickman: Escaping the Prison", "html-link":"game/etp", "obg-track-link":"", category:"Arcade" },
  { title:"Henry Stickman: Crossing the Pit", "html-link":"game/fctp", "obg-track-link":"", category:"Arcade" },
  { title:"Henry Stickman: Fleeing the Complex", "html-link":"game/ftc", "obg-track-link":"", category:"Arcade" },
  { title:"Henry Stickman: Infiltrating the Airship", "html-link":"game/ita", "obg-track-link":"", category:"Arcade" },
  { title:"Henry Stickman: Stealing the Diamond", "html-link":"game/stealingthediamond", "obg-track-link":"", category:"Arcade" },
  { title:"Cookie Clicker", "html-link":"game/index.html", "obg-track-link":"", category:"Idle" },
  { title:"Drift Boss", "html-link":"game/driftboss", "obg-track-link":"", category:"Arcade" },
  { title:"Snake.io", "html-link":"game/snakeio", "obg-track-link":"", category:"Arcade" },
  { title:"Drift Hunters", "html-link":"game/drifthunters", "obg-track-link":"", category:"Arcade" },
  { title:"Race Survival Arena King", "html-link":"/rsak", "obg-track-link":"", category:"Action" },
  { title:"Deadly Descent", "html-link":"/dd", "obg-track-link":"", category:"Action" },
  { title:"ArrowMaster.io", "html-link":"/am", "obg-track-link":"", category:"Action" },
  { title:"Bit Planes", "html-link":"game/bitp", "obg-track-link":"", category:"Action" },
  { title:"Bloons TD 2", "html-link":"game/btd2", "obg-track-link":"", category:"Puzzle" },
  { title:"Bloons TD 3", "html-link":"game/btd3", "obg-track-link":"", category:"Puzzle" },
  { title:"Bloons TD 5", "html-link":"game/btd5", "obg-track-link":"", category:"Puzzle" },
  { title:"Capybara Clicker", "html-link":"game/capyclicker", "obg-track-link":"", category:"Idle" },
  { title:"Deltarune", "html-link":"game/deltar", "obg-track-link":"", category:"Action" },
  { title:"Doom", "html-link":"game/doom", "obg-track-link":"", category:"Action" },
  { title:"Aircraft Fighter Pilot", "html-link":"game/fighterpilot", "obg-track-link":"", category:"Action" },
  { title:"Flappy Bird", "html-link":"game/flapb", "obg-track-link":"", category:"Arcade" },
  { title:"Geometry Freezenova", "html-link":"game/gdfreezen", "obg-track-link":"", category:"Action" },
  { title:"Infinite Craft", "html-link":"game/infcraft", "obg-track-link":"", category:"Puzzle" },
  { title:"Jetpack Joyride", "html-link":"game/jpjyr", "obg-track-link":"", category:"Action" },
  { title:"Mini Golf", "html-link":"game/minig", "obg-track-link":"", category:"Arcade" },
  { title:"OvO", "html-link":"game/ovo", "obg-track-link":"", category:"Arcade" },
  { title:"OvO 2", "html-link":"game/ovo2", "obg-track-link":"", category:"Arcade" },
  { title:"OvO Dimensions", "html-link":"game/ovod", "obg-track-link":"", category:"Arcade" },
  { title:"Pokemon Emerald", "html-link":"game/pokeem", "obg-track-link":"", category:"Action" },
  { title:"Pokemon Red", "html-link":"game/pokemonr", "obg-track-link":"", category:"Action" },
  { title:"Plants vs Zombies", "html-link":"game/pvz", "obg-track-link":"", category:"Action" },
  { title:"Super Mario 64", "html-link":"game/sm64", "obg-track-link":"", category:"Arcade" },
  { title:"Subway Surfers", "html-link":"game/subsurf", "obg-track-link":"", category:"Action" },
  { title:"Super Mario Bros", "html-link":"game/supermariobros", "obg-track-link":"", category:"Action" },
  { title:"Temple Run 2", "html-link":"game/tr2", "obg-track-link":"", category:"Arcade" },
  { title:"Undertale", "html-link":"game/underta", "obg-track-link":"", category:"Action" },
  { title:"Vex 8", "html-link":"game/vx8", "obg-track-link":"", category:"Action" },

];

/* ---- DOM refs ---- */
const $ = s => document.querySelector(s);
const listEl = $('#list');
const searchEl = $('#search');
const catEl = $('#categoryFilter');
const countEl = $('#count');
const recentEl = $('#recent');
const statCount = $('#stat-count');
const statRecent = $('#stat-recent');
const modeSelect = $('#modeSelect');
const accentPicker = $('#accentPicker');
const openAltdom = $('#open-altdom');

/* ---- state ---- */
let filtered = games.slice();
let focusedIndex = -1;
const RECENT_KEY = 'obg_recent_v2';
const ACCENT_KEY = 'obg_accent';
const MODE_KEY = 'obg_mode';

/* ---- render ---- */
function renderList(items){
  listEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach((g, idx) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.tabIndex = 0;
    item.dataset.idx = idx;

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';

    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = g.title;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = g.category || '';

    left.appendChild(title);
    left.appendChild(meta);

    const chevron = document.createElement('div');
    chevron.innerHTML = '▶';
    chevron.style.opacity = 0.6;
    chevron.style.fontWeight = 700;

    item.appendChild(left);
    item.appendChild(chevron);

    item.addEventListener('click', ()=> openGame(g));
    item.addEventListener('keydown', (e)=> {
      if (e.key === 'Enter') openGame(g);
      if (e.key === 'ArrowDown') focusNext();
      if (e.key === 'ArrowUp') focusPrev();
    });

    // micro-prefetch on hover (gentle)
    let warmed = false;
    item.addEventListener('pointerenter', () => {
      if (g['obg-track-link']) navigator.sendBeacon ? navigator.sendBeacon(g['obg-track-link']) : fetch(g['obg-track-link']).catch(()=>{});
      if (!warmed) { prefetch(g['html-link']); warmed = true; }
    });

    frag.appendChild(item);
  });
  listEl.appendChild(frag);
  updateCount(items.length);
}

/* ---- open and recent ---- */
function openGame(g){
  if (!g || !g['html-link'] || g['html-link'] === '#') return;
  // tracking ping
  if (g['obg-track-link']) navigator.sendBeacon ? navigator.sendBeacon(g['obg-track-link']) : fetch(g['obg-track-link']).catch(()=>{});
  window.open(g['html-link'], '_blank', 'noopener');

  addRecent(g);
}

function addRecent(g){
  const cur = getRecent();
  const normalized = { title: g.title, htmlLink: g['html-link'] };
  const existing = cur.find(x => x.htmlLink === normalized.htmlLink);
  let next;
  if (existing){
    next = cur.filter(x => x.htmlLink !== normalized.htmlLink);
    next.unshift(normalized);
  } else {
    next = [normalized, ...cur];
  }
  next = next.slice(0,8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch(e){}
  renderRecent();
}

function getRecent(){
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch(e){ return []; }
}
function renderRecent(){
  recentEl.innerHTML = '';
  const cur = getRecent();
  statRecent.textContent = cur.length;
  if (!cur.length){ recentEl.textContent = 'No recent plays'; return; }
  cur.forEach(r => {
    const b = document.createElement('button');
    b.textContent = r.title;
    b.addEventListener('click', ()=> window.open(r.htmlLink, '_blank', 'noopener'));
    recentEl.appendChild(b);
  });
}

/* ---- count ---- */
function updateCount(n){
  countEl.textContent = `${n} game${n===1?'':'s'}`;
  statCount.textContent = games.length;
}

/* ---- search/filter ---- */
let searchTimer = null;
function applyFilters(){
  const q = (searchEl.value || '').trim().toLowerCase();
  const cat = catEl.value;
  filtered = games.filter(g => {
    if (cat !== 'all' && (g.category||'').toLowerCase() !== cat.toLowerCase()) return false;
    if (!q) return true;
    return (g.title||'').toLowerCase().includes(q) || (g.category||'').toLowerCase().includes(q);
  });
  $('#empty').hidden = filtered.length !== 0;
  $('#welcome').hidden = filtered.length === 0;
  renderList(filtered);
}

function debounceApply(){
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 160);
}
searchEl.addEventListener('input', debounceApply);
catEl.addEventListener('change', applyFilters);

/* ---- keyboard shortcuts ---- */
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchEl) { e.preventDefault(); searchEl.focus(); }
  if ((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchEl.focus(); }
  if (e.key === 'ArrowDown') {
    const first = listEl.querySelector('.item');
    if (first) first.focus();
  }
});

/* ---- focus helpers ---- */
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
listEl.addEventListener('focusin', e => {
  const it = e.target.closest('.item');
  if (!it) return;
  focusedIndex = parseInt(it.dataset.idx || 0, 10);
});

/* ---- prefetch small HEAD ---- */
function prefetch(url){
  if (!url) return;
  try {
    const u = new URL(url, location.href);
    // only prefetch same-origin by default (avoid cross-origin noise)
    if (u.origin !== location.origin) return;
    fetch(u.href, { method:'HEAD', mode:'no-cors' }).catch(()=>{});
  } catch(e){}
}

/* ---- theme + accent persistence ---- */
function applyAccent(color){
  document.documentElement.style.setProperty('--accent', color);
  // use accent as focus glow too
  document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
}
function hexToRgb(hex){
  const c = hex.replace('#','');
  const bigint = parseInt(c,16);
  return `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
}

accentPicker.addEventListener('input', (e) => {
  applyAccent(e.target.value);
  localStorage.setItem(ACCENT_KEY, e.target.value);
});

// mode selection
modeSelect.addEventListener('change', e => {
  setMode(e.target.value);
  localStorage.setItem(MODE_KEY, e.target.value);
});
function setMode(m){
  document.body.classList.remove('light','oled');
  if (m === 'light') document.body.classList.add('light');
  if (m === 'oled') document.body.classList.add('oled');
  modeSelect.value = m;
}

/* quick toggle */
$('#toggleDark').addEventListener('click', ()=> {
  if (document.body.classList.contains('light')) setMode('dark');
  else setMode('light');
  try { localStorage.setItem(MODE_KEY, document.body.classList.contains('light') ? 'light' : 'dark'); } catch(e){}
});

/* restore persisted settings */
try {
  const savedAccent = localStorage.getItem(ACCENT_KEY);
  if (savedAccent) { accentPicker.value = savedAccent; applyAccent(savedAccent); }
  const savedMode = localStorage.getItem(MODE_KEY) || 'dark';
  setMode(savedMode);
} catch(e){}

/* ---- Alternative Domains page quick open ---- */
openAltdom.addEventListener('click', ()=> {
  window.open('/alt.html', '_blank', 'noopener');
});

/* ---- init ---- */
function init(){
  // initial render
  renderList(games.slice());
  renderRecent();
  updateCount(games.length);
  // show welcome stats
  statCount.textContent = games.length;
}
init();
