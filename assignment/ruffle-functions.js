function embedSWF(url, cont) {
  let ruffle = window.RufflePlayer.newest(),
    player = Object.assign(
      document.getElementById(cont).appendChild(ruffle.createPlayer()),
      {
        style:
          "width: 100%; height: 100%; position: absolute; top: 0; left: 0;",
      }
    );

  player.load({ url });
}
// const searchParams = new URLSearchParams(window.location.search);
// if (searchParams.get("file") == null) {
// } else {
//   embedSWF(`./files/${searchParams.get("file")}`, "root");
// }
