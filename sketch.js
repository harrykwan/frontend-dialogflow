let mic, recorder, soundFile;
let state = 0;

function setup() {
  let cnv = createCanvas(500, 100);
  cnv.mousePressed(canvasPressed);
  background(220);
  textAlign(CENTER, CENTER);
  soundFormats("mp3");
  // create an audio in
  mic = new p5.AudioIn();

  // prompts user to enable their browser mic
  mic.start();

  // create a sound recorder
  recorder = new p5.SoundRecorder();

  fft = new p5.FFT();
  fft.setInput(mic);

  // connect the mic to the recorder
  recorder.setInput(mic);

  // this sound file will be used to
  // playback & save the recording
  soundFile = new p5.SoundFile();

  text("tap to record", width / 2, height / 2);
}

function draw() {
  let spectrum = fft.analyze();
  // console.log(spectrum);
}

function canvasPressed() {
  // ensure audio is enabled
  userStartAudio();

  // make sure user enabled the mic
  if (state === 0 && mic.enabled) {
    // record to our p5.SoundFile
    recorder.record(soundFile);

    background(255, 0, 0);
    text("Recording!", width / 2, height / 2);
    state++;
  } else if (state === 1) {
    background(0, 255, 0);

    // stop recorder and
    // send result to soundFile
    recorder.stop();

    text("Play", width / 2, height / 2, 0);
    state++;
  } else if (state === 2) {
    soundFile.play(); // play the result!
    // save(soundFile, "mySound.wav");
    const soundBlob = soundFile.getBlob();

    // let serverUrl = "http://localhost:8080/api/agent/voice-input";
    // let httpRequestOptions = {
    //   method: "POST",
    //   body: new FormData().append("", soundBlob),
    //   headers: new Headers({
    //     "Content-Type": "multipart/form-data",
    //   }),
    // };
    // httpDo(serverUrl, httpRequestOptions);

    // var formdata = new FormData();
    // formdata.append("", soundBlob, "mySound.wav");

    // var requestOptions = {
    //   method: "POST",
    //   body: formdata,
    //   redirect: "follow",
    // };

    // fetch("http://localhost:8080/api/agent/voice-input", requestOptions)
    //   .then((response) => response.text())
    //   .then((result) => console.log(result))
    //   .catch((error) => console.log("error", error));
    // state++;
  }
}
