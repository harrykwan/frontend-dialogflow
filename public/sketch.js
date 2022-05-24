let mic, recorder, soundFile;
let state = 0;

let talkingratelimit = 100;

function setup() {
  // create an audio in
  frameRate(4);
  mic = new p5.AudioIn();
  mic.start();

  userStartAudio();
  // prompts user to enable their browser mic

  fft = new p5.FFT();
  fft.setInput(mic);
}

function startlistening() {
  userStartAudio();
}

var prevfft;
var talking = false;
var starttalkingrate = 0;

function draw() {
  if (document.getElementById("micsensitivityinput")) {
    talkingratelimit =
      -10 *
        (parseInt(document.getElementById("micsensitivityinput").value) - 100) +
      100;
  }
  let nowfft = fft.analyze();
  if (!prevfft) {
    prevfft = nowfft;
    return;
  }
  // let peakDetect = new p5.PeakDetect();
  // let amplitude = new p5.Amplitude();
  // console.log(peakDetect, amplitude);

  let fftdiff = [];

  for (var j = 0; j < 9; j++) {
    let tempresult = 0;
    for (var k = 0; k < 128; k++) {
      if ([j * 128 + k] < nowfft.length)
        tempresult += nowfft[j * 128 + k] - prevfft[j * 128 + k];
    }
    fftdiff.push(tempresult);
  }

  let talkingrate =
    (abs(fftdiff[1]) +
      abs(fftdiff[2]) +
      abs(fftdiff[3] * 1.2) +
      abs(fftdiff[4] * 1.3) +
      abs(fftdiff[5] * 1.5)) /
    5;
  // console.log(talkingrate);

  if (talkingrate > talkingratelimit) {
    if (!talking) {
      starttalkingrate = talkingrate;
      talking = true;
      console.log("start talking");
      document.getElementById("start-recording").click();
    }
  } else if (talkingrate < starttalkingrate / 10) {
    if (talking) {
      talking = false;
      console.log("end talking");
      document.getElementById("stop-recording").click();
    }
  }

  // console.log(fftdiff);

  prevfft = nowfft;
}
