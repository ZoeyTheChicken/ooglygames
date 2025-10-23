/* ---- Oogly Boogly Games - Glass UI v2 + Changelog + Confetti ---- */

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
  { title:"Snake.io", "html-link":"game/snakeio", "obg-track-link":"", category:"Arcade", new:true },
  { title:"Drift Hunters", "html-link":"game/drifthunters", "obg-track-link":"", category:"Arcade" },
  { title:"Race Survival Arena King", "html-link":"/rsak", "obg-track-link":"", category:"Action", new:true },
  { title:"Deadly Descent", "html-link":"/dd", "obg-track-link":"", category:"Action" },
  { title:"ArrowMaster.io", "html-link":"/am", "obg-track-link":"", category:"Action" },
];

/* ---- DOM refs ---- */
const $ = s => document.querySelector(s);
const listEl = $('#list'), searchEl = $('#search'), catEl = $('#categoryFilter'), countEl = $('#count'), recentEl = $('#recent'), statCount = $('#stat-count'), statRecent = $('#stat-recent');
const modeSelect = $('#modeSelect'), accentPicker = $('#accentPicker'), sidebarWidth = $('#sidebarWidth'), sidebarWidthVal = $('#sidebarWidthVal');
const openSettings = $('#openSettings'), settingsModal = $('#settingsModal'), closeSettings = $('#closeSettings');
const changelogModal = $('#changelogModal'), changelogList = $('#changelogList'), closeChangelog = $('#closeChangelog');

const RECENT_KEY='obg_recent_v2', CHANGELOG_KEY='obg_changelog_v2';
let filtered = games.slice();

/* --- Render list --- */
function renderList(items){
  listEl.innerHTML='';
  items.forEach(g=>{
    const item=document.createElement('div');
    item.className='item';
    if(g.new && !localStorage.getItem('obg_seen_'+g.title)) item.classList.add('confetti-new');
    item.tabIndex=0;

    const left=document.createElement('div'); left.style.display='flex'; left.style.flexDirection='column';
    const title=document.createElement('div'); title.className='item-title'; title.textContent=g.title;
    const meta=document.createElement('div'); meta.className='item-meta'; meta.textContent=g.category||'';
    left.appendChild(title); left.appendChild(meta);
    const chevron=document.createElement('div'); chevron.innerHTML='▶'; chevron.style.opacity=0.6; chevron.style.fontWeight=700;
    item.appendChild(left); item.appendChild(chevron);

    item.addEventListener('click',()=>openGame(g,item));
    listEl.appendChild(item);
  });
  countEl.textContent=`${items.length} game${items.length===1?'':'s'}`;
  statCount.textContent=games.length;
}

/* --- Open game & recent --- */
function openGame(g,item){
  if(!g||!g['html-link']) return;
  window.open(g['html-link'],'_blank','noopener');
  addRecent(g);
  if(g.new) localStorage.setItem('obg_seen_'+g.title,'1');
  if(item) item.classList.remove('confetti-new');
}

function addRecent(g){
  let cur = JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
  const normalized={title:g.title,htmlLink:g['html-link']};
  cur = cur.filter(x=>x.htmlLink!==normalized.htmlLink);
  cur.unshift(normalized);
  cur=cur.slice(0,8);
  localStorage.setItem(RECENT_KEY,JSON.stringify(cur));
  renderRecent();
}

function renderRecent(){
  recentEl.innerHTML='';
  const cur=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');
  statRecent.textContent=cur.length;
  if(!cur.length){recentEl.textContent='No recent plays'; return;}
  cur.forEach(r=>{
    const b=document.createElement('button'); b.textContent=r.title;
    b.addEventListener('click',()=>window.open(r.htmlLink,'_blank','noopener'));
    recentEl.appendChild(b);
  });
}

/* ---- Settings --- */
function loadSettings(){
  const mode=localStorage.getItem('obg_mode')||'dark';
  document.body.classList.remove('light','dark','oled'); document.body.classList.add(mode);
  modeSelect.value=mode;
  const accent=localStorage.getItem('obg_accent')||'#0b6ef6';
  document.documentElement.style.setProperty('--accent',accent);
  accentPicker.value=accent;
  const sw=localStorage.getItem('obg_sidebar_w')||'320';
  document.documentElement.style.setProperty('--sidebar-w',sw+'px');
  if(sidebarWidth) { sidebarWidth.value=sw; sidebarWidthVal.textContent=sw+'px'; }
}
modeSelect.addEventListener('change',()=>{
  document.body.classList.remove('dark','light','oled'); document.body.classList.add(modeSelect.value);
  localStorage.setItem('obg_mode',modeSelect.value);
});
accentPicker.addEventListener('input',()=>{document.documentElement.style.setProperty('--accent',accentPicker.value); localStorage.setItem('obg_accent',accentPicker.value);});
if(sidebarWidth) sidebarWidth.addEventListener('input',()=>{document.documentElement.style.setProperty('--sidebar-w',sidebarWidth.value+'px'); sidebarWidthVal.textContent=sidebarWidth.value+'px'; localStorage.setItem('obg_sidebar_w',sidebarWidth.value);});

/* ---- Changelog ---- */
const changelogData=[
  "Added 2 new games: Dino & Cookie Clicker",
  "⚙️ Move all settings to the new Settings modal.",
  "🎉 Add confetti animation for new games",
];

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

/* ---- Modal helpers ---- */
function openModal(modal){modal.hidden=false; setTimeout(()=>modal.classList.add('show'),20);}
function closeModal(modal){modal.classList.remove('show'); setTimeout(()=>modal.hidden=true,250);}
openSettings.addEventListener('click',()=>openModal(settingsModal));
closeSettings.addEventListener('click',()=>closeModal(settingsModal));
closeChangelog.addEventListener('click',()=>closeModal(changelogModal));

/* ---- Init ---- */
function init(){
  renderList(filtered);
  renderRecent();
  loadSettings();
  showChangelog();
}
init();
