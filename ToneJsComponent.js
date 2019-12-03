class ToneJsComponent {
  constructor(name, options) {
    // name should be a string such as "resonator"
    // options is a plain (Redux) object describing the setup
    this.isToneComponent = true
    this.reset()
    // Create source tones
    const newSource = new Tone.FMOscillator(channelSetup)
    // Store source tones
    this.tonesToStart.push(newSource)
    // Create non-source tones
    // Store all (source and non-source) tones
    this.tonesToDispose.push(newSource)
    // Connect
    newSource.connect(Tone.Master)
    // Store control parameters
    this.toneControls.freq = newSource.frequency
    this.toneControls.gain = newSource.volume
    this.toneControls.harmonicity = newSource.harmonicity
    this.toneControls.modulationIndex = newSource.modulationIndex
  }
  sequence() {

  }
  reset() {
    this.tonesToStart = []
    this.toneControls = {}
    this.tonesToDispose = []
  }
  start() {
    this.tonesToStart.forEach( tone => tone.start() )
  }
  dispose() {
    this.tonesToDispose.forEach( tone => tone.dispose() )
    this.reset()
  }
}
