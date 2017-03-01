function midiMessageReceived( ev ) {
  var cmd = ev.data[0] >> 4;
  var channel = ev.data[0] & 0xf;
  var noteNumber = ev.data[1];
  var velocity = ev.data[2];

  if (channel == 9)
    return
  if ( cmd==8 || ((cmd==9)&&(velocity==0)) ) { // with MIDI, note on with velocity zero is the same as note off
    // note off
    openWebPiano.noteOff( noteNumber );
  } else if (cmd == 9) {
    // note on
    openWebPiano.noteOn(noteNumber, velocity);
  } else if (cmd == 11) {
    //controller( noteNumber, velocity);
    if (noteNumber == 64) {
      openWebPiano.sustain(velocity);
    }
  } else if (cmd == 14) {
    // pitch wheel
    pitchWheel( ((velocity * 128.0 + noteNumber)-8192)/8192.0 );
  } else if ( cmd == 10 ) {  // poly aftertouch
    polyPressure(noteNumber,velocity/127)
  } else
  console.log( "" + ev.data[0] + " " + ev.data[1] + " " + ev.data[2])
}

function sendMidiMessage(note,velo) {
  if (midiOut) {
    if (velo===0) {
      midiOut.send( [0x80, note, 0x40] );
    } else {
      midiOut.send( [0x90, note, 0x7f] );
    }
  }
}

var selectMIDI = null;
var selectMIDIo = null;
var midiAccess = null;
var midiIn     = null;
var midiOut    = null;

function selectMIDIIn( ev ) {
  if (midiIn)
    midiIn.onmidimessage = null;
  var id = ev.target[ev.target.selectedIndex].value;
  if ((typeof(midiAccess.inputs) == "function"))   //Old Skool MIDI inputs() code
    midiIn = midiAccess.inputs()[ev.target.selectedIndex];
  else
    midiIn = midiAccess.inputs.get(id);
  if (midiIn)
    midiIn.onmidimessage = midiMessageReceived;
}

function selectMIDIOut( ev ) {
  var id = ev.target[ev.target.selectedIndex].value;
  if ((typeof(midiAccess.outputs) == "function"))   //Old Skool MIDI inputs() code
    midiIn = midiAccess.outputs()[ev.target.selectedIndex];
  else
    midiOut = midiAccess.outputs.get(id);
}

function populateMIDIInSelect() {
  // clear the MIDI input select
  selectMIDI.options.length = 0;
  if (midiIn && midiIn.state=="disconnected")
    midiIn=null;
  var firstInput = null;

  var inputs=midiAccess.inputs.values();
  for ( var input = inputs.next(); input && !input.done; input = inputs.next()){
    input = input.value;
    if (!firstInput)
      firstInput=input;
    var str=input.name.toString();
    var preferred = !midiIn && ((str.indexOf("USB") != -1)||(str.indexOf("Keyboard") != -1)||(str.indexOf("keyboard") != -1)||(str.indexOf("KEYBOARD") != -1));

    // if we're rebuilding the list, but we already had this port open, reselect it.
    if (midiIn && midiIn==input)
      preferred = true;

    selectMIDI.appendChild(new Option(input.name,input.id,preferred,preferred));
    if (preferred) {
      midiIn = input;
      midiIn.onmidimessage = midiMessageReceived;
    }
  }
  if (!midiIn) {
      midiIn = firstInput;
      if (midiIn)
        midiIn.onmidimessage = midiMessageReceived;
  }
}

function populateMIDIOutSelect() {
  // clear the MIDI input select
  selectMIDIo.options.length = 0;
  if (midiOut && midiOut.state=="disconnected")
    midiOut=null;
  var firstOutput = null;

  var outputs=midiAccess.outputs.values();
  for ( var output = outputs.next(); output && !output.done; output = outputs.next()){
    output = output.value;
    if (!firstOutput)
      firstOutput=output;
    selectMIDIo.appendChild(new Option(output.name,output.id,false,false));
  }
  if (!midiOut) {
      midiOut = firstOutput;
  }
}

function midiConnectionStateChange( e ) {
  console.log("connection: " + e.port.name + " " + e.port.connection + " " + e.port.state );
  populateMIDIInSelect();
  populateMIDIOutSelect();
}

function onMIDIStarted( midi ) {
  var preferredIndex = 0;

  midiAccess = midi;
  selectMIDI=document.getElementById("midiIn");
  selectMIDIo=document.getElementById("midiOut");
  midi.onstatechange = midiConnectionStateChange;
  populateMIDIInSelect();
  populateMIDIOutSelect();
  selectMIDI.onchange = selectMIDIIn;
  selectMIDIo.onchange = selectMIDIOut;
}

function onMIDISystemError( err ) {
  //document.getElementById("synthbox").className = "error";
  console.log( "MIDI not initialized - error encountered:" + err.code );
}

//init: start up MIDI
window.addEventListener('load', function() {
  if (navigator.requestMIDIAccess)
    navigator.requestMIDIAccess().then( onMIDIStarted, onMIDISystemError );

});
