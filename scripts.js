/* OoglyUI 3.0 script
   - advanced tab panel, saves, mirrors, keyboard shortcuts
   - plug into your site by dropping this file in
*/

/* =========== Configuration =========== */
// mirrors you control — list only domains you own/operate
const MIRRORS = [
  { name: "Primary", url: "https://ooglybooglygames.pages.dev" },
  { name: "Mirror A", url: "https://ooglygames.netlify.app" },
  { name: "Mirror B", url: "https://ooglygames.wasmer.app" },
  { name: "Mirror C", url: "https://oogly.chickennet.work" },
];

// games array (text-first, no thumbnails)
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
];

/* =========== Utilities =========== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
function setHidden(el, v){ if(v) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); }

/* =========== DOM refs =========== */
const listEl = $('#list');
const searchEl = $('#search');
const catEl = $('#categoryFilter');
const countEl = $('#count');
const recentMini = $('#recent-mini');
const statCount = $('#stat-count');
const statRecent = $('#stat-recent');
const statDomain = $('#stat-domain');
const tabPanel = $('#tab-panel');
const tabs = $$('.tab');
const panels = $$('.tab-panel');
const recentList = $('#recent-list');
const altList = $('#alt-list');

/* =========== State keys =========== */
const RECENT_KEY = 'obg_recent_v3';
const PREFS_KEY = 'obg_prefs_v3';
const SAVES_KEY = 'obg_saves_v3';

/* =========== Init prefs =========== */
const defaultPrefs = { accent: '#0b6ef6', mode: 'dark', rememberMirror: true, lastMirror: 0 };
let prefs = Object.assign({}, defaultPrefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'));

/* apply accent + mode to document */
function applyAccent(ac){ document.documentElement.style.setProperty('--accent', ac); }
function setMode(m){
  document.body.classList.remove('light','oled');
  if(m === 'light') document.body.classList.add('light');
  if(m === 'oled') document.body.classList.add('oled');
  // sync selects
  $('#modeSelect').value = m;
  $('#modeSelect2').value = m;
}

/* persist prefs */
function savePrefs(){
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/* =========== Render list =========== */
let filtered = games.slice();
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
    chevron.style.opacity = 0.55;

    item.appendChild(left);
    item.appendChild(chevron);

    item.addEventListener('click', () => openGame(g));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openGame(g);
      if (e.key === 'ArrowDown') focusNext();
      if (e.key === 'ArrowUp') focusPrev();
    });

    // hover prefetch small HEAD (same-origin only)
    let warmed = false;
    item.addEventListener('pointerenter', () => {
      if(!warmed){ prefetch(g['html-link']); warmed = true; }
      // ping tracking if any
      if(g['obg-track-link']) navigator.sendBeacon ? navigator.sendBeacon(g['obg-track-link']) : fetch(g['obg-track-link']).catch(()=>{});
    });

    frag.appendChild(item);
  });
  listEl.appendChild(frag);
  updateCount(items.length);
}

/* =========== Prefetch helper =========== */
function prefetch(url){
  if(!url) return;
  try{
    const u = new URL(url, location.href);
    if(u.origin !== location.origin) return;
    fetch(u.href, { method:'HEAD', mode:'no-cors' }).catch(()=>{});
  }catch(e){}
}

/* =========== Open game & recent =========== */
function openGame(g){
  if(!g || !g['html-link'] || g['html-link'] === '#') return;
  // tracking beacon
  if(g['obg-track-link']) navigator.sendBeacon ? navigator.sendBeacon(g['obg-track-link']) : fetch(g['obg-track-link']).catch(()=>{});
  window.open(g['html-link'], '_blank', 'noopener');
  addRecent(g);
}
function addRecent(g){
  const cur = getRecent();
  const norm = { title: g.title, htmlLink: g['html-link'] };
  const existing = cur.find(x => x.htmlLink === norm.htmlLink);
  let next;
  if(existing){
    next = cur.filter(x => x.htmlLink !== norm.htmlLink);
    next.unshift(norm);
  } else {
    next = [norm, ...cur];
  }
  next = next.slice(0,10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  renderRecent();
}
function getRecent(){ try{ return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }catch(e){ return []; } }
function renderRecent(){
  const cur = getRecent();
  statRecent.textContent = cur.length;
  recentMini.textContent = cur.length ? cur[0].title : '—';
  // list inside tab
  recentList.innerHTML = '';
  if(!cur.length){ recentList.textContent = 'No recent plays'; return; }
  cur.forEach(r => {
    const b = document.createElement('button');
    b.className = 'pill';
    b.textContent = r.title;
    b.addEventListener('click', ()=> window.open(r.htmlLink, '_blank','noopener'));
    recentList.appendChild(b);
  });
}

/* =========== Alternative Domains UI =========== */
function renderAltDomains(){
  altList.innerHTML = '';
  MIRRORS.forEach((m, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    const h = document.createElement('div');
    h.style.display='flex'; h.style.justifyContent='space-between'; h.style.alignItems='center';
    const name = document.createElement('div'); name.innerHTML = `<strong>${m.name}</strong><div class="muted small">${m.url}</div>`;
    const actions = document.createElement('div');
    const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='Open';
    openBtn.addEventListener('click', ()=> window.open(m.url,'_blank','noopener'));
    const copyBtn = document.createElement('button'); copyBtn.className='btn secondary'; copyBtn.textContent='Copy';
    copyBtn.addEventListener('click', ()=> { navigator.clipboard?.writeText(m.url).then(()=>flash('Copied')); });
    actions.appendChild(openBtn); actions.appendChild(copyBtn);
    h.appendChild(name); h.appendChild(actions);
    wrap.appendChild(h);
    altList.appendChild(wrap);
  });
}

/* =========== Saves: local export/import and quick save/load =========== */
function exportSaves(){
  const data = localStorage.getItem(SAVES_KEY) || '{}';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'obg_saves.json'; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
function importSavesFile(file){
  const reader = new FileReader();
  reader.onload = ()=> {
    try{
      const parsed = JSON.parse(reader.result);
      localStorage.setItem(SAVES_KEY, JSON.stringify(parsed));
      flash('Imported saves');
    }catch(e){ flash('Invalid JSON'); }
  };
  reader.readAsText(file);
}
function quickSave(slot){
  if(!slot) return flash('Enter slot name');
  // dummy demo — in real use you'd collect actual game-specific data from iframe/game API
  const all = JSON.parse(localStorage.getItem(SAVES_KEY) || '{}');
  all[slot] = { ts: Date.now(), data: { demo: 'sample save for '+slot } };
  localStorage.setItem(SAVES_KEY, JSON.stringify(all));
  flash('Saved to ' + slot);
}
function quickLoad(slot){
  if(!slot) return flash('Enter slot name');
  const all = JSON.parse(localStorage.getItem(SAVES_KEY) || '{}');
  if(!all[slot]) return flash('No save in ' + slot);
  // in real usage, you'd pass `all[slot].data` to the game
  flash('Loaded ' + slot);
}

/* =========== Cloud example copy =========== */
function copyCloudExample(){
  const example = `// Example Vercel serverless endpoint for saving
// POST /api/save { user: 'id', data: {} }
export default async (req, res) => {
  // implement storing in Vercel KV or Upstash
  res.json({ ok:true });
};`;
  navigator.clipboard?.writeText(example).then(()=> flash('Copied cloud example'));
}

/* =========== Tabs logic =========== */
function openTabs(){ tabPanel.style.display = 'flex'; tabPanel.setAttribute('aria-hidden','false'); }
function closeTabs(){ tabPanel.style.display = 'none'; tabPanel.setAttribute('aria-hidden','true'); }
function switchTab(name){
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  panels.forEach(p => setHidden(p, p.dataset.panel !== name));
}

/* =========== Mirror switching logic =========== */
let currentMirror = prefs.lastMirror || 0;
function updateDomainStat(){
  const m = MIRRORS[currentMirror] || MIRRORS[0];
  statDomain.textContent = m.name;
}
function cycleMirror(){
  currentMirror = (currentMirror + 1) % MIRRORS.length;
  prefs.lastMirror = currentMirror;
  if(prefs.rememberMirror) savePrefs();
  flash('Switching to ' + MIRRORS[currentMirror].name);
  // redirect to mirror url
  window.location.href = MIRRORS[currentMirror].url + window.location.pathname + window.location.search + window.location.hash;
}

/* =========== small helpers =========== */
function flash(msg, ms=1600){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position='fixed'; el.style.right='18px'; el.style.bottom='18px';
  el.style.padding='10px 14px'; el.style.background='rgba(0,0,0,0.7)'; el.style.color='white';
  el.style.borderRadius='10px'; el.style.zIndex=99999; document.body.appendChild(el);
  setTimeout(()=> el.style.opacity='0.0', ms-250);
  setTimeout(()=> el.remove(), ms);
}

/* =========== keyboard navigation =========== */
function focusNext(){
  const items = Array.from(document.querySelectorAll('.item'));
  if(!items.length) return;
  let idx = Math.max(0, document.activeElement?.closest?.('.item')?.dataset?.idx | 0);
  idx = Math.min(items.length-1, idx + 1);
  items[idx].focus();
}
function focusPrev(){
  const items = Array.from(document.querySelectorAll('.item'));
  if(!items.length) return;
  let idx = Math.max(0, document.activeElement?.closest?.('.item')?.dataset?.idx | 0);
  idx = Math.max(0, idx - 1);
  items[idx].focus();
}

/* =========== Search & filter =========== */
let searchTimer = null;
function applyFilters(){
  const q = (searchEl.value || '').trim().toLowerCase();
  const cat = catEl.value;
  filtered = games.filter(g => {
    if(cat !== 'all' && (g.category||'').toLowerCase() !== cat.toLowerCase()) return false;
    if(!q) return true;
    return (g.title||'').toLowerCase().includes(q) || (g.category||'').toLowerCase().includes(q);
  });
  setHidden($('#empty'), filtered.length !== 0);
  setHidden($('#hero'), filtered.length === 0);
  renderList(filtered);
}
function debounceApply(){ if(searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 160); }

/* =========== Init wiring =========== */
function bindUI(){
  // search + filter
  searchEl.addEventListener('input', debounceApply);
  catEl.addEventListener('change', applyFilters);

  // tab panel open/close
  $('#openTabsBtn').addEventListener('click', ()=> { openTabs(); switchTab('recent'); });
  $('#closeTabs').addEventListener('click', closeTabs);
  $('#open-altdom').addEventListener('click', ()=> { openTabs(); switchTab('domains'); });

  // tab buttons
  tabs.forEach(t => t.addEventListener('click', ()=> { const tab = t.dataset.tab; switchTab(tab); }));

  // saves buttons
  $('#exportSaves').addEventListener('click', exportSaves);
  $('#importSaves').addEventListener('click', ()=> {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
    inp.addEventListener('change', ()=> importSavesFile(inp.files[0]));
    inp.click();
  });
  $('#quickSave').addEventListener('click', ()=> quickSave($('#saveSlot').value.trim()));
  $('#quickLoad').addEventListener('click', ()=> quickLoad($('#saveSlot').value.trim()));
  $('#copyCloudExample').addEventListener('click', copyCloudExample);

  // settings controls
  $('#modeSelect').addEventListener('change', (e)=> { prefs.mode = e.target.value; setMode(e.target.value); savePrefs(); });
  $('#modeSelect2').addEventListener('change', (e)=> { prefs.mode = e.target.value; setMode(e.target.value); savePrefs(); });
  $('#accentPicker').addEventListener('input', (e)=> { prefs.accent = e.target.value; applyAccent(e.target.value); savePrefs(); });
  $('#accentPicker2')?.addEventListener('input', (e)=> { prefs.accent = e.target.value; applyAccent(e.target.value); savePrefs(); });
  $('#rememberMirror').addEventListener('change', (e)=> { prefs.rememberMirror = e.target.checked; savePrefs(); });

  $('#resetPrefs').addEventListener('click', ()=> {
    localStorage.removeItem(PREFS_KEY);
    prefs = Object.assign({}, defaultPrefs);
    applyAccent(prefs.accent); setMode(prefs.mode); savePrefs();
    flash('Preferences reset');
  });

  // mirror switchers
  $('#switchMirrorBtn').addEventListener('click', () => {
    cycleMirror();
  });
  $('#switchMirrorTiny').addEventListener('click', () => { cycleMirror(); });

  // small mirror snippet open
  $$('.linkish').forEach(btn => btn.addEventListener('click', (e)=>{
    const url = e.target.dataset.mirror;
    window.open(url, '_blank', 'noopener');
  }));

  // tabs keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    if(e.key === '/' && document.activeElement !== searchEl) { e.preventDefault(); searchEl.focus(); }
    if(e.key.toLowerCase() === 'g') { openTabs(); switchTab('recent'); }
    if(e.key === 'S') { openTabs(); switchTab('saves'); }
    if(e.shiftKey && e.key.toLowerCase() === 'm') { cycleMirror(); }
  });

  // close panel if click outside
  document.addEventListener('click', (ev) => {
    if(!tabPanel.contains(ev.target) && !$('#openTabsBtn').contains(ev.target)) {
      // keep it open if user clicked inside panel
      // closeTabs(); // optional auto-close
    }
  });
}

/* =========== initial render =========== */
function init(){
  // apply prefs
  applyAccent(prefs.accent); setMode(prefs.mode);
  // DOM renders
  renderList(games.slice());
  renderRecent();
  renderAltDomains();
  statCount.textContent = games.length;
  updateCountDisplay();
  bindUI();
  // persist some UI elements
  $('#accentPicker').value = prefs.accent;
  $('#accentPicker2')?.value = prefs.accent;
  $('#modeSelect').value = prefs.mode;
  $('#modeSelect2')?.value = prefs.mode;
  $('#rememberMirror').checked = !!prefs.rememberMirror;
  updateDomainStat();
}

/* =========== helper small UI updates =========== */
function updateCountDisplay(){ countEl.textContent = `${games.length} games`; }
function updateDomainStat(){ statDomain.textContent = MIRRORS[currentMirror]?.name || 'Primary'; }

/* =========== kick off =========== */
init();
