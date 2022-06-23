let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;

var speaking = false;
var volumnhistory = [];

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    var options = {};
    var speechEvents = hark(stream, options);

    speechEvents.on("speaking", function () {
      console.log("speaking");
      speaking = true;
      recordAudio = RecordRTC(stream, {
        type: "audio",

        //6)
        mimeType: "audio/webm",
        sampleRate: 44100,
        // used by StereoAudioRecorder
        // the range 22050 to 96000.
        // let us force 16khz recording:
        desiredSampRate: 16000,

        // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
        // CanvasRecorder, GifRecorder, WhammyRecorder
        recorderType: StereoAudioRecorder,
        // Dialogflow / STT requires mono audio
        numberOfAudioChannels: 1,
      });

      recordAudio.startRecording();
      startRecording.click();
    });
    speechEvents.on("stopped_speaking", function () {
      console.log("stopped");
      speaking = false;
      setTimeout(() => {
        stopRecording.click();
      }, 1000);
    });
    speechEvents.on("volume_change", function (volume, threshold) {
      // console.log(volume + " " + threshold);
    });
  });

//auto start auto stop script

const startRecording = document.getElementById("start-recording");
const stopRecording = document.getElementById("stop-recording");
let recordAudio;

//2)
startRecording.disabled = false;

//3)
startRecording.onclick = function () {
  startRecording.disabled = true;
  document.getElementById("recordingbutton").style.color = "red";
  //4)
  navigator.getUserMedia(
    {
      audio: true,
    },
    function (stream) {
      //5)

      stopRecording.disabled = false;
    },
    function (error) {
      console.error(JSON.stringify(error));
    }
  );
};

stopRecording.onclick = function () {
  // recording stopped
  startRecording.disabled = false;
  stopRecording.disabled = true;
  document.getElementById("recordingbutton").style.color = "#ababab";
  // stop audio recorder
  recordAudio.stopRecording(function () {
    // after stopping the audio, get the audio data
    const soundBlob = recordAudio.getBlob();
    console.log(recordAudio.getBlob());
    // recordAudio.getDataURL(function (audioDataURL) {
    var formdata = new FormData();
    formdata.append("", soundBlob, "mySound.webm");

    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("api/agent/voice-input", requestOptions)
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        const outputmessage = JSON.parse(result).data;
        const inputmessage = JSON.parse(result).inputtext;
        document.getElementById("results").value =
          outputmessage + " " + inputmessage;

        addnewmessage(inputmessage + ": " + outputmessage);
      })
      .catch((error) => console.log("error", error));
  });
};

const scrollToBottom = () => {
  var d = $(".mainChatWindow");
  d.scrollTop(d.prop("scrollHeight"));
};

function addnewmessage(message) {
  $("ul").append(`<li >
    <span class="messageHeader">
        <span>
            From
            <span class="messageSender">Someone</span>
            to
            <span class="messageReceiver">Everyone:</span>
        </span>

        ${new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })}
    </span>

    <span class="message">${message}</span>

</li>`);
  scrollToBottom();
}

function hark(stream, options) {
  var audioContextType = window.webkitAudioContext || window.AudioContext;

  var harker = this;
  harker.events = {};
  harker.on = function (event, callback) {
    harker.events[event] = callback;
  };

  harker.emit = function () {
    if (harker.events[arguments[0]]) {
      harker.events[arguments[0]](
        arguments[1],
        arguments[2],
        arguments[3],
        arguments[4]
      );
    }
  };

  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  options = options || {};
  // Config
  var smoothing = options.smoothing || 0.1,
    interval = options.interval || 50,
    threshold = options.threshold,
    play = options.play,
    history = options.history || 10,
    running = true;

  // Setup Audio Context
  if (!window.audioContext00) {
    window.audioContext00 = new audioContextType();
  }

  var gainNode = audioContext00.createGain();
  gainNode.connect(audioContext00.destination);
  // don't play for self
  gainNode.gain.value = 0;

  var sourceNode, fftBins, analyser;

  analyser = audioContext00.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.fftSize);

  //WebRTC Stream
  sourceNode = audioContext00.createMediaStreamSource(stream);
  threshold = threshold || -50;

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext00.destination);

  harker.speaking = false;

  harker.setThreshold = function (t) {
    threshold = t;
  };

  harker.setInterval = function (i) {
    interval = i;
  };

  harker.stop = function () {
    running = false;
    harker.emit("volume_change", -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit("stopped_speaking");
    }
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
    harker.speakingHistory.push(0);
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function () {
    setTimeout(function () {
      //check if stop has been called
      if (!running) {
        return;
      }

      var currentVolume = getMaxVolume(analyser, fftBins);

      harker.emit("volume_change", currentVolume, threshold);

      var history = 0;
      if (currentVolume > threshold && !harker.speaking) {
        // trigger quickly, short history
        for (
          var i = harker.speakingHistory.length - 3;
          i < harker.speakingHistory.length;
          i++
        ) {
          history += harker.speakingHistory[i];
        }
        if (history >= 2) {
          harker.speaking = true;
          harker.emit("speaking");
        }
      } else if (currentVolume < threshold && harker.speaking) {
        for (var j = 0; j < harker.speakingHistory.length; j++) {
          history += harker.speakingHistory[j];
        }
        if (history === 0) {
          harker.speaking = false;
          harker.emit("stopped_speaking");
        }
      }
      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + (currentVolume > threshold));

      looper();
    }, interval);
  };
  looper();

  function getMaxVolume(analyser, fftBins) {
    var maxVolume = -Infinity;
    analyser.getFloatFrequencyData(fftBins);

    for (var i = 4, ii = fftBins.length; i < ii; i++) {
      if (fftBins[i] > maxVolume && fftBins[i] < 0) {
        maxVolume = fftBins[i];
      }
    }

    return maxVolume;
  }

  return harker;
}
