// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/wvvxOLq

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // Main constants
  const beatsPerMinute = 300
  const mainGainDb = -10
  const minGainDb = -200
  const maxBeats = 256
  const sampleRateHz = 44100
  const isVerbose = true

  // Timbre constants - MOVE THESE to a per-instrument basis
  const resFreqL_Hz = 12.0123
  const resFreqM_Hz = 53.1357
  const resFreqR_Hz = 189.0123

  // Controls number of channels, and their sound
  // Currently most attributes are inputs to Tone.FMOscillator
  const mg = minGainDb
  const channelSetupArray = [
    {channelGainDb: -8, type: 'triangle', modulationType: 'triangle', volume: mg},
    {channelGainDb: -3, type: 'triangle', modulationType: 'triangle', volume: mg},
  ]

  // Sequencing of how parameters of channel change over time, using LINEAR ramping.
  // Each sub-array is a single note of format:
  // [ channelNum, noteLengthBeats, frequencyHz, noteGainDb, harmonicity, modulationIndex ]
  // channelNum 1, 2, 3... is mandatory, all the rest are optional
  // noteLengthBeats is number 0 < x <= 256
  // frequencyHz is any number -22050 <= x <= 22050
  // noteGainDb is any number -800 <= x <= 800
  // harmonicity and modulationIndex are positive numbers <= 100
  const dt1 = 0.0001
  const dt2 = 0.01
  const sequencedData = [
    [ 1,   dt1,   400,    mg,     1,     0 ],  // Setup all vars at dt1 and mg
    [ 1,   dt2,      ,     0,      ,       ],  // and then fade in over dt2

    [ 2,   dt1,   100,    mg,     1,     3 ],
    [ 2,   dt2,      ,     0,      ,       ],

    [ 1,     1,   400,      ,      ,       ],
    [ 1,     1,   400,      ,      ,       ],
    [ 1,     2,   300,      ,      ,     4 ],
    [ 1,     4,   300,      ,  0.01,       ],
    [ 1,     2,   400,      ,      ,       ],
    [ 1,     4,   400,      ,     1,       ],
    [ 1,   0.5,   500,      ,      ,       ],
    [ 1,   0.5,   500,      ,      ,       ],
    [ 1,   0.5,   600,      ,      ,       ],
    [ 1,   0.5,   600,      ,      ,       ],
    [ 1,   0.5,   900,      ,      ,       ],
    [ 1,   0.5,   900,      ,      ,       ],
    [ 1,   0.5,   700,      ,      ,       ],
    [ 1,   0.5,   700,      ,      ,       ],
    [ 1,     1,   800,      ,      ,       ],
    [ 1,     8,   800,      ,     2,       ],
    [ 1,     1,   400,      ,      ,       ],
    [ 1,     8,   400,      ,      ,    10 ],
    [ 1,     1,   380,      ,      ,       ],
    [ 1,     4,   380,      ,      ,       ],

    [ 2,     7,   100,      ,      ,       ],
    [ 2,     1,    90,      ,      ,       ],
    [ 2,     7,    90,      ,      ,     4 ],
    [ 2,     1,   120,      ,      ,       ],
    [ 2,     3,   120,      ,      ,       ],
    [ 2,     1,   130,      ,      ,       ],
    [ 2,     3,   130,      ,      ,       ],
    [ 2,     1,   150,      ,      ,       ],
    [ 2,     3,   150,      ,      ,     2 ],
    [ 2,     1,   110,      ,      ,       ],
    [ 2,     3,   110,      ,      ,       ],
    [ 2,     1,   100,      ,      ,       ],
    [ 2,     7,   100,      ,      ,     5 ],

    [ 1,     4,      ,    mg,      ,       ],  // Last line fade back to mg
    [ 2,     4,      ,    mg,      ,       ],
  ]

  Tone.Transport.bpm.value = beatsPerMinute;
  const maxChannel = channelSetupArray.length
  const testGainDb = -4 * minGainDb    // Test data values within a wider range
  const nyqFreqHz = 0.5 * sampleRateHz // Freq data values within Nyquist range
  let tonesToStart = []
  let channelControls = []
  let tonesToDispose = []

  function setupTones() {
    if (isVerbose) console.log('Setup Tones called')
    tonesToStart = []
    channelControls = []
    tonesToDispose = []
    channelSetupArray.forEach(channelSetup => {
      // Calculations
      const theDelayTimeL_s = 0.5 / resFreqL_Hz
      const theDelayTimeM_s = 0.5 / resFreqM_Hz
      const theDelayTimeR_s = 0.5 / resFreqR_Hz
      // Create source tones
      const newSource = new Tone.FMOscillator(channelSetup)
      // Store source tones
      tonesToStart.push(newSource)
      // Create non-source tones
      const newDelayL = new Tone.Delay(theDelayTimeL_s, theDelayTimeL_s)
      const newDelayM = new Tone.Delay(theDelayTimeM_s, theDelayTimeM_s)
      const newDelayR = new Tone.Delay(theDelayTimeR_s, theDelayTimeR_s)
      const newGainL = new Tone.Gain(-0.25)  // With same resFreq, these all cancel out
      const newGainM = new Tone.Gain(-0.5)
      const newGainR = new Tone.Gain(-0.25)
      const newPannerL = new Tone.Panner(-1)
      const newPannerR = new Tone.Panner(1)
      // Store all (source and non-source) tones
      tonesToDispose.push(newSource)
      tonesToDispose.push(newDelayL)
      tonesToDispose.push(newGainL)
      tonesToDispose.push(newPannerL)
      tonesToDispose.push(newDelayM)
      tonesToDispose.push(newGainM)
      tonesToDispose.push(newDelayR)
      tonesToDispose.push(newGainR)
      tonesToDispose.push(newPannerR)
      // Make internal component connections
      newSource.chain(Tone.Master)
      newSource.chain(newDelayL, newGainL, newPannerL, Tone.Master)
      newSource.chain(newDelayM, newGainM, Tone.Master)
      newSource.chain(newDelayR, newGainR, newPannerR, Tone.Master)
      // Store control parameters
      const channelControl = {}
      channelControls.push(channelControl)
      channelControl.freq = newSource.frequency
      channelControl.gain = newSource.volume
      channelControl.harmonicity = newSource.harmonicity
      channelControl.modulationIndex = newSource.modulationIndex
    })
  }

  // Helper function to change parameters with linear ramps
  let noteStartTxt, noteLenTxt
  const doLinearRamp = (ctrlItem, varDescription, minVal, maxVal, dataVal, addVal=0) => {
    if (ctrlItem && Number.isFinite(dataVal)) {
      const newVal = dataVal + addVal
      if (minVal <= newVal && newVal <= maxVal) {
        ctrlItem.linearRampTo(newVal, noteLenTxt, noteStartTxt)
        if (isVerbose) console.log(`- - Linear ${varDescription} ramp to ${newVal}`)
      }
    }
  }

  function sequenceTones() {
    if (isVerbose) console.log('Sequence Tones called')
    const chanStartBeatArray = []
    sequencedData.forEach( rowData => {
      // Deal with channel
      const channelNum = rowData[0]     // Should be 1 ... maxChannel
      if (!Number.isInteger(channelNum) || channelNum < 1 || maxChannel < channelNum) return
      const channelIndex = channelNum - 1
      // Could factor this out into an array?
      const channelSetup = channelSetupArray[channelIndex]
      const channelGainDb = channelSetup ? channelSetup.channelGainDb || 0 : 0
      if (isVerbose) console.log(`Channel ${channelNum} with index ${channelIndex} and gain ${channelGainDb}`)
      // Deal with timing
      const noteLenBeats = rowData[1]   // Should be positive number <= maxBeats
      if (!Number.isFinite(noteLenBeats) || noteLenBeats <= 0 || maxBeats < noteLenBeats) return
      const noteStartBeat = chanStartBeatArray[channelIndex] || 0
      const noteEndBeat = noteStartBeat + noteLenBeats
      chanStartBeatArray[channelIndex] = noteEndBeat
      if (isVerbose) console.log(`- Beat start ${noteStartBeat} length ${noteLenBeats} end ${noteEndBeat}`)
      // Change the channel controls
      const chanCtrl = channelControls[channelIndex]
      if (chanCtrl) {
        // Supply timing info to doLinearRamp
        noteStartTxt = `+0:${noteStartBeat}:0`
        noteLenTxt = `0:${noteLenBeats}:0`
        // Deal with frequency changes
        const newFreqHz = rowData[2]
        doLinearRamp(chanCtrl.freq, 'frequency', -nyqFreqHz, nyqFreqHz, newFreqHz)
        // Deal with gain changes
        const noteGainDb = rowData[3]
        doLinearRamp(chanCtrl.gain, 'gain', -testGainDb, testGainDb, noteGainDb, mainGainDb + channelGainDb)
        // Deal with harmonicity changes
        const newHarmonicity = rowData[4]
        doLinearRamp(chanCtrl.harmonicity, 'harmonicity', 0, 100, newHarmonicity)
        // Deal with modulationIndex changes
        const newModIndex = rowData[5]
        doLinearRamp(chanCtrl.modulationIndex, 'modulationIndex', 0, 100, newModIndex)
      }
    })
  }

  function startTones() {
    if (isVerbose) console.log('Start Tones called')
    tonesToStart.forEach( tone => tone.start() )
  }

  function disposeTones() {
    if (isVerbose) console.log('Dispose Tones called')
    tonesToStart = []
    channelControls = []
    tonesToDispose.forEach( tone => tone.dispose() )
    tonesToDispose = []
  }

  let disposedToggle = true
  function toggleTones() {
    if (disposedToggle=!disposedToggle) {
      disposeTones()
    } else {
      setupTones()
      sequenceTones()
      startTones()
    }
  }

  document.querySelector('body').addEventListener('click', toggleTones)
})();
