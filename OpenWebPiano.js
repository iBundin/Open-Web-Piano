var audioCtx = new AudioContext();

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}
BufferLoader.prototype.loadBuffer = function(url, index) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var loader = this;
    request.onload = function() {
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    console.error('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            }    
        );
    }
    request.onerror = function() {
        console.error('BufferLoader: XHR error');        
    }
    request.send();
}
BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
}

var convolver = audioCtx.createConvolver();
var directGain = audioCtx.createGain();
var convGain = audioCtx.createGain();
var convGainAfter = audioCtx.createGain();

convGain.connect(convolver);
convolver.connect(convGainAfter);
convGainAfter.connect(audioCtx.destination);
directGain.connect(audioCtx.destination);
directGain.connect(convGain);
directGain.gain.value = 0.5;
convGain.gain.value = 0;
convGainAfter.gain.value = 0;
var bufferlists;
var damper;

function bufferSaver(bufferlist) {
  bufferlists = bufferlist;
  damper = bufferlists[8];
  convolver.buffer = bufferlists[9];
}
var bufferLoader = new BufferLoader(
        audioCtx,
        [
        "../audio/piano/21.mp3",
        "../audio/piano/33.mp3",
        "../audio/piano/45.mp3",
        "../audio/piano/57.mp3",
        "../audio/piano/69.mp3",
        "../audio/piano/81.mp3",
        "../audio/piano/93.wmp3",
        "../audio/piano/105.mp3",
        "../audio/damper.mp3",
        "../audio/Piano Impulse6.mp3"
        ],
        bufferSaver
    );
bufferLoader.load();

function equalGain(val) {
  return Math.cos((1.0 - val) * 0.5*Math.PI);
}

function Note(val) {
  this.noteA        = audioCtx.createBufferSource();
  this.noteB        = audioCtx.createBufferSource();
  this.gainA        = audioCtx.createGain();
  this.gainB        = audioCtx.createGain();
  this.gain         = audioCtx.createGain();
  this.biquadFilter = audioCtx.createBiquadFilter();
  this.biquadFilter.type = "lowpass";

  this.biquadFilter.connect(directGain);
  this.gain.connect(this.biquadFilter);
  this.gainA.connect(this.gain);
  this.noteA.connect(this.gainA);  
  this.gainB.connect(this.gain);
  this.noteB.connect(this.gainB);

  if (val<90) {
    this.damp = audioCtx.createBufferSource();
    this.damp.buffer = damper;
    this.damp.connect(directGain);
  }
}
Note.prototype.on = function(bufA,bufB,rateA,rateB,filtFreq,gain_A,gain_B,gain_) {
  this.noteA.buffer = bufferlists[bufA];
  this.noteA.playbackRate.value = rateA;
  this.biquadFilter.frequency.value = filtFreq;
  this.gainA.gain.value = gain_A;
  this.gain.gain.value = gain_;

  if (bufferlists[bufB]) {
    this.noteB.buffer = bufferlists[bufB];
    this.noteB.playbackRate.value = rateB;
    this.gainB.gain.value = gain_B;
    this.noteB.start(0);
  } else {
    this.noteB = null;
  }
  this.noteA.start(0);
}
Note.prototype.off = function(noteNumber) {
  this.noteA.stop(0);
  this.noteB.stop(0);
  console.log('off inside: ' + noteNumber);
}

var notes = new Object();
function noteOn(noteNumber, velocity) {
  console.log(noteNumber);
  if((noteNumber<109)&&(noteNumber>20)) {
    if (notes[noteNumber]) {
      notes[noteNumber].gain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 1.1);
      notes[noteNumber].noteA.stop(audioCtx.currentTime + 2);
      notes[noteNumber].noteB.stop(audioCtx.currentTime + 2);
      notes[noteNumber].damp = null;
      sustained.splice(sustained.indexOf(noteNumber), 1);
    }
    
    var bufNumA = Math.floor((noteNumber - 21)/12);
    var bufNumB = bufNumA + 1;
    var noteNum = bufNumA * 12 + 21;

    var freq = 2**((noteNumber-69)/12)*440;
    let velo = velocity / 127;
    let harmQuant = 20000/freq;
    var filtFreq = freq * (2 - (noteNumber-21)/50) + freq * harmQuant * Math.pow(velo, 4);

    /*if (sustain) {
      resonance(freq*(Math.floor(Math.random()*Math.floor(4186/freq))+1), velo * (1-noteNumber/108), 0.3); 
    }*/

    

    var gain_A = equalGain( 1 - ((noteNumber-21)%12) / 11 );
    var rate_A = Math.pow(2, (noteNumber-noteNum)/12);
    var rate_B = 0;
    var gain_B = 0;
    var gain_ = velo**1.4;
    if (bufNumB<8) {
      var rate_B = Math.pow(2, (noteNumber-(noteNum+12))/12);
      var gain_B = 1 - gain_A;
    }
    notes[noteNumber] = new Note(noteNumber);
    notes[noteNumber].on(bufNumA,bufNumB,rate_A,rate_B,filtFreq,gain_A,gain_B,gain_);  
  }
}

function noteOff(noteNumber) {
  console.log(notes);
  if (!sustain) {
    if (noteNumber<90) {
      notes[noteNumber].gain.gain.setTargetAtTime(0.0, audioCtx.currentTime + 0.03, 0.08);
      notes[noteNumber].noteA.stop(audioCtx.currentTime + 2);
      notes[noteNumber].noteB.stop(audioCtx.currentTime + 2);
      notes[noteNumber].damp.start(0);
    } 
    delete notes[noteNumber];
  } else {
    sustained.push(noteNumber);
  }
}


//Sustain Pedal
var sustain = 0;
var sustained = [];
function controller(cc, val) {
  if (cc==64) {
    if (val==127) { 
      sustain = true;
      convGain.gain.value = 1;
      convGainAfter.gain.value = 1;
    } else if (val==0) {
      sustain = false;
      convGain.gain.value = 0.0;
      convGainAfter.gain.value = 0;
      for (var i = 0; i < sustained.length; i++) {
        if (notes[sustained[i]]) {
          noteOff(sustained[i]);
        }
      }
      sustained = [];
    }
  }
}


//Resonances?
function sineResonance(freq, power, delay) {
  var now = audioCtx.currentTime;
  this.oscillator = audioCtx.createOscillator();
  this.gain       = audioCtx.createGain();
  this.gain.gain.value = 0;
  this.oscillator.connect(this.gain);
  this.gain.connect(convGain);
  this.oscillator.type = 'sine';
  this.oscillator.frequency.value = freq;
  this.oscillator.start();
  this.gain.gain.setTargetAtTime(0.05 * power, now + delay, 1.1);
  this.gain.gain.setTargetAtTime(0.0, now + 2 + delay, 1.1);
  this.oscillator.stop(now + 7 + delay);
}

function resonance(freq, power, delay) {
  var reso = new sineResonance(freq, power, delay);
  setTimeout( function() {
    reso = null;
  }, 7000 + delay * 1000);
}