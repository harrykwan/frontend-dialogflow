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
var talkingaverage = null;
let noise = 0;
let noiseprev = [];
let noiseaveragecount = 20;
let nowsnr = 1;
let mytimer = 0;
function draw() {
  mytimer += 1;
  mytimer = mytimer % 4;
  // console.log(mytimer);
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
      abs(fftdiff[2] * 1.2) +
      abs(fftdiff[3] * 1.2) +
      abs(fftdiff[4] * 1) +
      abs(fftdiff[5] * 1)) /
    5;

  let talkingvolumn =
    (nowfft[1] + nowfft[2] * 1.2 + nowfft[3] * 1.2 + nowfft[4] + nowfft[5]) / 5;

  // let talkingvolumn = 0;
  // nowfft.map((x) => {
  //   talkingvolumn += x;
  // });
  // console.log(talkingrate);
  if (!talkingaverage) {
    talkingaverage = talkingvolumn;
  } else {
    talkingaverage = (talkingaverage + talkingvolumn) / 2;
  }

  // console.log("talkingaverage: " + talkingaverage);

  // if (!noise) noise = talkingvolumn;
  // else {
  if (noiseprev.length < noiseaveragecount) {
    noiseprev.push(talkingvolumn);
  } else {
    if (!talking) {
      noise = 0;
      noiseprev.map((x) => (noise += x));
      noise = noise / noiseprev.length;
      noiseprev.shift();
    }
  }
  // }

  // console.log("noise: " + noise);

  let snr = noise > 0 ? talkingaverage / noise : 1;

  // console.log(snr * 100 + " " + nowsnr * 100);
  // console.log("closing? " + abs(snr - nowsnr) * 100);
  // console.log(talkingrate);
  // console.log("gate? " + snr * 10);
  if (noise && talkingaverage && talkingrate) {
    if (talkingrate > talkingratelimit) {
      // if (snr > 100) {
      if (!talking) {
        nowsnr = snr;
        starttalkingrate = talkingrate;
        talking = true;
        console.log("start talking");
        document.getElementById("start-recording").click();
      }
      // } else if (talkingrate < starttalkingrate / 10) {
    } else if (abs(snr - nowsnr) * 100 < nowsnr * 10 && mytimer) {
      if (talking) {
        talking = false;
        console.log("end talking");
        document.getElementById("stop-recording").click();
      }
    }
  }

  // console.log(fftdiff);

  prevfft = nowfft;
}
