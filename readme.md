Light-weight virtual web piano with a good sound. There is only one sample per octave, however samples are mixed with each other
for realistic sound with full-length sustain. Lowpass filters are used to emulate dynamics. 
You can check the demo here: http://ibundin.github.io/open-web-piano

##Installation

Simply copy openWebPiano.js and all related audio files. See index.html for the example.

##API

0. **init(context)** - load all samples and start;
1. **noteOn(note 21 - 105, velocity 0 - 127 )** - start a note with a particular velocity level in standard MIDI format;
2. **noteOff(note)** - stop a note;
3. **sustain(value)** - any value higher then 0 switches sustain on, 0 value switches sustain off.

##License
