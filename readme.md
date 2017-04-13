Lightweight virtual web piano. There is only one sample per octave, however samples are mixed with each other for realistic sound with correct full-length sustain. Lowpass filters are used to emulate dynamics. This instrument works well with sustain pedal.

## Installation

Simply copy **_openWebPiano.js_** and **_audio_** folder. See index.html for the example.

## API

0. **init(context)** - load all samples and start;
1. **noteOn(note 21 - 105, velocity 0 - 127 )** - start a note with a particular velocity level in standard MIDI format;
2. **noteOff(note)** - stop a note;
3. **sustain(value)** - any value higher then 0 switches sustain on, 0 value switches sustain off.

## Example

```javascript
<script src="OpenWebPiano.js"></script>
<script>
  var audioCtx = new AudioContext();
  openWebPiano.init(audioCtx);
  //on event(note,velocity) ->
  openWebPiano.noteOn(note, velocity);
</script>
```
## License

[MIT](https://github.com/nishanths/license/blob/master/LICENSE)
