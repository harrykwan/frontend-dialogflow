let myVideoStream;
const myVideo = document.createElement("video");
myVideo.muted = true;

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
        document.getElementById("results").value = outputmessage;

        addnewmessage(outputmessage);
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
