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
];

/* OBG 2.1 Supercharged */

const games=[
  {title:"Minecraft 1.12.2","html-link":"game/eagler1122w/","category":"Action"},
  {title:"Minecraft 1.5.2 (Precision Client)","html-link":"game/eagler152precisionc/","category":"Action"},
  {title:"2048","html-link":"game/2048/","category":"Puzzle"},
  {title:"Dino","html-link":"game/dino/","category":"Arcade","new":true},
  {title:"Cookie Clicker","html-link":"game/index.html","category":"Idle","new":true},
];

const changelogData = [
  "Added 2 new games: Dino & Cookie Clicker",
  "New Settings tab with theme + accent + sidebar width",
  "Confetti animation for new games",
  "Changelog modal with once-per-update display"
];

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
const openSettings = $('#open-settings');
const settingsModal = $('#settingsModal');
const closeSettings = $('#closeSettings');
const changelogModal = $('#changelogModal');
const changelogList = $('#changelogList');
const closeChangelog = $('#closeChangelog');
const sidebarWidth = $('#sidebarWidth');
const sidebarWidthVal = $('#sidebarWidthVal');

let filtered=games.slice();
let focusedIndex=-1;
const RECENT_KEY='obg_recent_v2';
const ACCENT_KEY='obg_accent';
const MODE_KEY='obg_mode';
const CHANGELOG_KEY='obg_changelog_v2';

/* ---- Render List ---- */
function renderList(items){
  listEl.innerHTML='';
  const frag=document.createDocumentFragment();
  items.forEach((g,idx)=>{
    const item=document.createElement('div');
    item.className='item';
    if(g.new && !localStorage.getItem('obg_seen_'+g.title)) item.classList.add('confetti-new');
    item.tabIndex=0;
    item.dataset.idx=idx;

    const left=document.createElement('div'); left.style.display='flex'; left.style.flexDirection='column';
    const title=document.createElement('div'); title.className='item-title'; title.textContent=g.title;
    const meta=document.createElement('div'); meta.className='item-meta'; meta.textContent=g.category||'';
    left.appendChild(title); left.appendChild(meta);
    const chevron=document.createElement('div'); chevron.innerHTML='▶'; chevron.style.opacity=0.6; chevron.style.fontWeight=700;
    item.appendChild(left); item.appendChild(chevron);

    item.addEventListener('click',()=>openGame(g,item));
    item.addEventListener('keydown',(e)=>{
      if(e.key==='Enter') openGame(g,item);
      if(e.key==='ArrowDown') focusNext();
      if(e.key==='ArrowUp') focusPrev();
    });

    frag.appendChild(item);
  });
  listEl.appendChild(frag);
  updateCount(items.length);
}

/* ---- Open Game + Recent ---- */
function openGame(g,item){
  if(!g||!g['html-link']||g['html-link']==='#') return;
  window.open(g['html-link'],'_blank','noopener');
  addRecent(g);

  // mark new game as seen to prevent confetti
  if(g.new) localStorage.setItem('obg_seen_'+g.title,'1');
  if(item) item.classList.remove('confetti-new');
}

function addRecent(g){
  const cur=getRecent();
  const normalized={title:g.title,htmlLink:g['html-link']};
  const existing=cur.find(x=>x.htmlLink===normalized.htmlLink);
  let next;
  if(existing){
    next=cur.filter(x=>x.htmlLink!==normalized.htmlLink);
    next.unshift(normalized);
  }else next=[normalized,...cur];
  next=next.slice(0,8);
  localStorage.setItem(RECENT_KEY,JSON.stringify(next));
  renderRecent();
}

function getRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');}catch(e){return[];}}
function renderRecent(){
  recentEl.innerHTML='';
  const cur=getRecent();
  statRecent.textContent=cur.length;
  if(!cur.length){recentEl.textContent='No recent plays';return;}
  cur.forEach(r=>{
    const b=document.createElement('button');
    b.textContent=r.title;
    b.addEventListener('click',()=>window.open(r.htmlLink,'_blank','noopener'));
    recentEl.appendChild(b);
  });
}

/* ---- Count ---- */
function updateCount(n){countEl.textContent=`${n} game${n===1?'':'s'}`; statCount.textContent=games.length;}

/* ---- Search + Filter ---- */
let searchTimer=null;
function applyFilters(){
  const q=(searchEl.value||'').trim().toLowerCase();
  const cat=catEl.value;
  filtered=games.filter(g=>{
    if(cat!=='all' && (g.category||'').toLowerCase()!==cat.toLowerCase()) return false;
    if(!q) return true;
    return (g.title||'').toLowerCase().includes(q);
  });
  renderList(filtered);
  $('#empty').hidden=filtered.length>0;
}
searchEl.addEventListener('input',()=>{clearTimeout(searchTimer); searchTimer=setTimeout(applyFilters,180);});
catEl.addEventListener('change',applyFilters);

/* ---- Keyboard Shortcuts ---- */
document.addEventListener('keydown',e=>{
  if(e.key==='/'){searchEl.focus(); e.preventDefault();}
  if(e.key==='s' || e.key==='S'){openModal(settingsModal);}
});

/* ---- Modal ---- */
function openModal(modal){modal.hidden=false;setTimeout(()=>modal.classList.add('show'),20);}
function closeModal(modal){modal.classList.remove('show');setTimeout(()=>modal.hidden=true,250);}
openSettings.addEventListener('click',()=>openModal(settingsModal));
closeSettings.addEventListener('click',()=>closeModal(settingsModal));
closeChangelog.addEventListener('click',()=>closeModal(changelogModal));

/* ---- Settings Persistence ---- */
function loadSettings(){
  const mode=localStorage.getItem(MODE_KEY)||'dark';
  document.body.classList.remove('light','dark','oled'); document.body.classList.add(mode);
  modeSelect.value=mode;
  const accent=localStorage.getItem(ACCENT_KEY)||'#0b6ef6';
  document.documentElement.style.setProperty('--accent',accent);
  accentPicker.value=accent;
  const sw=localStorage.getItem('obg_sidebar_w')||'320';
  document.documentElement.style.setProperty('--sidebar-w',sw+'px');
  sidebarWidth.value=sw; sidebarWidthVal.textContent=sw+'px';
}
modeSelect.addEventListener('change',()=>{
  const val=modeSelect.value;
  document.body.classList.remove('dark','light','oled'); document.body.classList.add(val);
  localStorage.setItem(MODE_KEY,val);
});
accentPicker.addEventListener('input',()=>{document.documentElement.style.setProperty('--accent',accentPicker.value);localStorage.setItem(ACCENT_KEY,accentPicker.value);});
sidebarWidth.addEventListener('input',()=>{document.documentElement.style.setProperty('--sidebar-w',sidebarWidth.value+'px');sidebarWidthVal.textContent=sidebarWidth.value+'px';localStorage.setItem('obg_sidebar_w',sidebarWidth.value);});

/* ---- Focus Navigation ---- */
function focusNext(){if(focusedIndex<filtered.length-1){focusedIndex++;focusItem();}}
function focusPrev(){if(focusedIndex>0){focusedIndex--;focusItem();}}
function focusItem(){const items=listEl.querySelectorAll('.item');if(items[focusedIndex]) items[focusedIndex].focus();}

/* ---- Changelog ---- */
function showChangelog(){
  const lastVer=localStorage.getItem(CHANGELOG_KEY)||'';
  const thisVer=changelogData.join('|');
  if(lastVer!==thisVer){
    changelogList.innerHTML='';
    changelogData.forEach(l=>{
      const li=document.createElement('li'); li.textContent=l; changelogList.appendChild(li);
    });
    openModal(changelogModal);
    localStorage.setItem(CHANGELOG_KEY,thisVer);
  }
}

/* ---- Init ---- */
function init(){
  renderList(filtered);
  renderRecent();
  applyFilters();
  loadSettings();
  showChangelog();
}

init();
