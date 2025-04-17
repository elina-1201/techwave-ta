// https://developers.google.com/interactive-media-ads/docs/sdks/html5/client-side/get-started#3.-import-the-ima-sdk
const script = document.createElement("script");
script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
document.head.appendChild(script);

const mutedImageURL = "https://i.imgur.com/7kvOpST.png";
const unMutedImageURL = "https://i.imgur.com/tu2MoyN.png";

////////////////////////////////////////////
//  FUNCTIONS FOR CREATING DOM ELEMENTS  //
//////////////////////////////////////////

const createMainContainer = (videoPlayer) => {
  const mainContainer = document.createElement("div");
  mainContainer.style.position = "fixed";
  mainContainer.style.bottom = "0.6em";
  mainContainer.style.right = "0.6em";

  mainContainer.appendChild(videoPlayer);

  return mainContainer;
};

const createCloseButton = () => {
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-end";

  const button = document.createElement("div");
  button.style.width = "25px";
  button.style.height = "25px";
  button.style.backgroundColor = "#383838";
  button.style.display = "flex";
  button.style.justifyContent = "center";
  button.style.alignItems = "center";
  button.style.borderRadius = "100%";
  button.innerHTML = "X";
  button.style.color = "white";
  button.style.cursor = "pointer";
  button.style.marginBottom = "2px";

  buttonContainer.appendChild(button);

  return buttonContainer;
};

const createVideoContainer = () => {
  const videoContainer = document.createElement("div");
  videoContainer.style.position = "relative";

  return videoContainer;
};

const createVideoPlayer = () => {
  const videoPlayer = document.createElement("video");
  videoPlayer.src =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  videoPlayer.controls = true;
  videoPlayer.muted = true;
  videoPlayer.width = 340;
  videoPlayer.height = 190;
  videoPlayer.style.display = "block";

  return videoPlayer;
};

const createAdContainer = () => {
  const adContainer = document.createElement("div");
  adContainer.style.position = "absolute";
  adContainer.style.top = "0";
  adContainer.style.left = "0";

  return adContainer;
};

const createMuteUnmuteButton = () => {
  const buttonContainer = document.createElement("div");
  buttonContainer.style.position = "absolute";
  buttonContainer.style.margin = "4px";
  buttonContainer.style.top = "0";
  buttonContainer.style.left = "0";
  buttonContainer.style.width = "25px";
  buttonContainer.style.height = "25px";
  buttonContainer.style.backgroundColor = "#383838";
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.alignItems = "center";
  buttonContainer.style.borderRadius = "100%";

  const indicator = document.createElement("img");
  indicator.src = mutedImageURL;
  indicator.style.width = "15px";
  indicator.style.height = "15px";
  indicator.style.cursor = "pointer";

  buttonContainer.appendChild(indicator);

  return buttonContainer;
};

//////////////////////////////
//  CREATING DOM ELEMENTS  //
////////////////////////////

const videoContainer = createVideoContainer();
const adContainer = createAdContainer();
const videoPlayer = createVideoPlayer();

const muteUnmuteAdButton = createMuteUnmuteButton();

videoContainer.appendChild(videoPlayer);
videoContainer.appendChild(adContainer);

const mainContainer = createMainContainer(videoContainer);
document.body.appendChild(mainContainer);

const closeButton = createCloseButton();

setTimeout(() => {
  videoContainer.parentNode.insertBefore(closeButton, videoContainer);
}, 5000);

closeButton.addEventListener("click", () => {
  mainContainer.remove();
});

/////////////////////////////
//  GOOGLE IMA SDK SETUP  //
///////////////////////////

var adsLoaded = false;
var adMuted = true;
var adDisplayContainer;
var adsLoader;

const initializeIMA = () => {
  console.log("initializing IMA");

  muteUnmuteAdButton.addEventListener("click", muteUnmute);

  adDisplayContainer = new google.ima.AdDisplayContainer(
    adContainer,
    videoPlayer
  );
  adsLoader = new google.ima.AdsLoader(adDisplayContainer);

  adsLoader.addEventListener(
    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
    onAdsManagerLoaded,
    false
  );
  adsLoader.addEventListener(
    google.ima.AdErrorEvent.Type.AD_ERROR,
    onAdError,
    false
  );

  // Let the AdsLoader know when the video has ended
  videoPlayer.addEventListener("ended", () => {
    adsLoader.contentComplete();
  });

  var adsRequest = new google.ima.AdsRequest();
  // `single_preroll_skippable` is used to request skippable ad
  adsRequest.adTagUrl =
    "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=";

  adsRequest.setAdWillAutoPlay(true);
  adsRequest.setAdWillPlayMuted(true);
  // Pass the request to the adsLoader to request ads
  adsLoader.requestAds(adsRequest);
};

const loadAds = () => {
  // Prevent this function from running on if there are already ads loaded
  if (adsLoaded) {
    return;
  }
  adsLoaded = true;

  console.log("loading ads");

  // Initialize the container. Must be done via a user action on mobile devices.
  videoPlayer.load();
  adDisplayContainer.initialize();

  var width = videoPlayer.clientWidth;
  var height = videoPlayer.clientHeight;
  try {
    adsManager.init(width, height, google.ima.ViewMode.NORMAL);
    adsManager.start();
  } catch (adError) {
    // Play the video without ads, if an error occurs
    console.log("AdsManager could not be started");
    videoPlayer.play();
  }
};

const onAdsManagerLoaded = (adsManagerLoadedEvent) => {
  // Allows autoplay
  videoPlayer.play();

  adContainer.appendChild(muteUnmuteAdButton);

  // Instantiate the AdsManager from the adsLoader response and pass it the video element
  adsManager = adsManagerLoadedEvent.getAdsManager(videoPlayer);

  // If not destroyed the container stays and prevents user from using video controls
  adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
    adDisplayContainer.destroy();
    muteUnmuteAdButton.remove();
  });

  adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

  // Serves to pause video while ad is running and resume it after it ends
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
    onContentPauseRequested
  );
  adsManager.addEventListener(
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    onContentResumeRequested
  );
};

const onAdError = (adErrorEvent) => {
  console.log(adErrorEvent.getError());
  if (adsManager) {
    adsManager.destroy();
  }
};

const onContentPauseRequested = () => {
  videoPlayer.pause();
};

const onContentResumeRequested = () => {
  videoPlayer.play();
};

const muteUnmute = () => {
  if (adMuted) {
    adsManager.setVolume(1);
    muteUnmuteAdButton.firstChild.src = unMutedImageURL;
  } else {
    adsManager.setVolume(0);
    muteUnmuteAdButton.firstChild.src = mutedImageURL;
  }

  adMuted = !adMuted;
};

/////////////////////////////
//  GOOGLE IMA SDK START  //
///////////////////////////

window.addEventListener("load", () => {
  initializeIMA();
  videoPlayer.addEventListener("play", () => {
    loadAds();
  });
});
