// Dark mode toggle
document.getElementById('toggleDark').addEventListener('click', () => {
  document.body.classList.toggle('light');
});

// Game list
const games = [
  { title:"Report an issue", "html-link":"/help.html", "obg-track-link":""},
  { title:"______________________________",},
  { title:"Minecraft 1.12.2", "html-link":"game/eagler1122w/", "obg-track-link":"" },
  { title:"Minecraft 1.8.8", "html-link":"game/eagler188w/", "obg-track-link":"" },
  { title:"Minecraft 1.5.2", "html-link":"game/eagler152/", "obg-track-link":"" },
  { title:"Snow Rider 3D", "html-link":"game/snowrider/", "obg-track-link":"" },
  { title:"Asteroids", "html-link":"game/asteroids/", "obg-track-link":"" },
  { title:"Dino", "html-link":"game/dino/", "obg-track-link":"" },
  { title:"DinoGame++", "html-link":"game/dinoplusplus/", "obg-track-link":"" },
  { title:"Dino 3D", "html-link":"game/dino3d/", "obg-track-link":"" },
  { title:"2048", "html-link":"game/2048/", "obg-track-link":"" },
  { title:"ASCII Space", "html-link":"game/asciispace", "obg-track-link":"" },
  { title:"Terraria (broken, fixing)", "html-link":"game/terraria", "obg-track-link":"" },
  { title:"Henry Stickman: Breaking the Bank", "html-link":"game/btb", "obg-track-link":"" },
  { title:"Henry Stickman: Escaping the Prison", "html-link":"game/etp", "obg-track-link":"" },
  { title:"Henry Stickman: Crossing the Pit", "html-link":"game/fctp", "obg-track-link":"" },
  { title:"Henry Stickman: Fleeing the Complex", "html-link":"game/ftc", "obg-track-link":"" },
  { title:"Henry Stickman: Infiltrating the Airship", "html-link":"game/ita", "obg-track-link":"" },
  { title:"Henry Stickman: Stealing the Diamond", "html-link":"game/stealingthediamond", "obg-track-link":"" },
  { title:"Cookie Clicker", "html-link":"game/index.html", "obg-track-link":"" },
  { title:"Drift Boss", "html-link":"game/driftboss", "obg-track-link":"" },
  { title:"Snake.io", "html-link":"game/snakeio", "obg-track-link":"" },
  { title:"Drift Hunters", "html-link":"game/drifthunters", "obg-track-link":"" },
];

// Populate sidebar
const sidebar = document.getElementById('sidebar');
const header = document.createElement('h2');
header.textContent="All Games";
sidebar.appendChild(header);

games.forEach(game => {
  const item = document.createElement('div');
  item.className = "game-item";
  item.textContent = game.title;

  item.addEventListener('click', ()=>{
    // Open game in a new tab
    window.open(game['html-link'], '_blank');

    // Optional tracking
    if(game['obg-track-link']){
      fetch(game['obg-track-link']).catch(()=>{});
    }
  });

  sidebar.appendChild(item);
});
