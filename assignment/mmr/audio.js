var mute = 0;
var mutebuttons = 0;
var muteisotopes = 0;
var mutecapacity = 0;
var mainMusic = "newmusic.mp3";

var clickAudio;
var clickMineral;
var closeAudio;
var buyAudio;
var isotopeFoundAudio;
var failureAudio;
var music;
var capacityFullAudio;
var armoryUpgradeAudio;
var craftDrillAudio;
var craftStructureAudio;
var defeatBossAudio;
var discoverMineralAudio;
var droneReturnAudio;
var hireAudio;
var questCollectAudio;
var questCompleteAudio;
var sacrificeMineralAudio;
var sacrificeWarped;
var sacrificeDivine;
var scientistCollectAudio;
var takeoffCountdownAudio;
var tradeAudio;
var caveAppearsAudio;
var caveCollapseAudio;
var chestGoldOpenAudio;
var chestOpenAudio;

function createSound(source) {
	let sound = new Media(getMediaUrl(source));
	return sound;
}

function patchAudioForDesktop() {
	if (!window.Media) {
		window.Media = Audio;
		window.Media.prototype.setVolume = function (volume) {
			this.volume = volume;
		}
	}
}

function getMediaUrl(mediaPath) {
	if (isMobile() && platform.isAndroid()) {
		return "file:///android_asset/www/" + mediaPath;
	} else if (isMobile() && platform.isIOs()) {
		return cordova.file.applicationDirectory + "www/" + mediaPath;
	}
	return mediaPath;
}

if (!isMobile() || !platform.isIOs()) {
	patchAudioForDesktop();
	initSoundEffects();
}

function initSoundEffects() {
	clickAudio = [createSound("click1.wav"), createSound("click2.wav"), createSound("click3.wav"), createSound("click4.wav"), createSound("click5.wav")];
	clickMineral = [createSound("clickmineral1new.mp3"), createSound("clickmineral2new.mp3"), createSound("clickmineral3new.mp3"), createSound("clickmineral4new.mp3")];
	closeAudio = [createSound("cliclack2.wav"), createSound("cliclack3.wav")]
	buyAudio = createSound("buy.wav");
	isotopeFoundAudio = createSound("special.wav");
	failureAudio = createSound("nope.wav");
	if (!isMobile()) {
		music = platform.initMusic();
	}
	capacityFullAudio = createSound("CapacityFull.mp3");
	armoryUpgradeAudio = createSound("armoryupgrade.mp3");
	craftDrillAudio = createSound("craftdrill.mp3");
	craftStructureAudio = createSound("craftstructure.mp3");
	defeatBossAudio = createSound("defeatboss.mp3");
	discoverMineralAudio = createSound("discovermineral.mp3");
	droneReturnAudio = createSound("dronereturn.mp3");
	hireAudio = createSound("hire.mp3");
	questCollectAudio = createSound("questcollect.mp3");
	questCompleteAudio = createSound("questcomplete.mp3");
	sacrificeMineralAudio = createSound("sacrificemineral.mp3");
	sacrificeWarped = createSound("sacrificeWarped.mp3");
	sacrificeDivine = createSound("sacrificeDivine.mp3");
	scientistCollectAudio = createSound("scientistscollect.mp3");
	takeoffCountdownAudio = createSound("takeoffcountdown.mp3");
	tradeAudio = createSound("trade.mp3");
	caveAppearsAudio = createSound("caveappears.mp3");
	caveCollapseAudio = createSound("cavecollapse.mp3");
	chestGoldOpenAudio = createSound("chestgoldopen.mp3");
	chestOpenAudio = createSound("chestopen.mp3");
	promoClickableAudio = [createSound("grub-attack.wav")];
	capacityFullAudio.setVolume(0.05);
	promoClickableAudio.forEach(sound => sound.setVolume(0.1));
}

function setVolume() {
	if (localStorage.getItem("mute") === null) {
		mute = 0;
		mutebuttons = 0;
		mutecapacity = 1;
		muteisotopes = 0;
		localStorage["mute"] = 0;
		localStorage["mutebuttons"] = 0;
		localStorage["mutecapacity"] = 1;
		localStorage["muteisotopes"] = 0;

	}
	else {
		mute = parseInt(localStorage["mute"]);
		mutebuttons = parseInt(localStorage["mutebuttons"]);
		mutecapacity = parseInt(localStorage["mutecapacity"]);
		muteisotopes = parseInt(localStorage["muteisotopes"]);
	}
	// platform.toggleMusic();
}

function playClickSound() {
	if (!mutebuttons) clickAudio[rand(0, clickAudio.length - 1)].play();
}