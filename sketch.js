let mic, recorder, soundFile;
let state = 0;

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
function draw() {
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

  if (talkingrate > 100) {
    if (!talking) {
      talking = true;
      console.log("start talking");
      document.getElementById("start-recording").click();
    }
  } else if (talkingrate < 10) {
    if (talking) {
      talking = false;
      console.log("end talking");
      document.getElementById("stop-recording").click();
    }
  }

  // console.log(fftdiff);

  prevfft = nowfft;
}
