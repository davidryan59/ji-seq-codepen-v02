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

  // Timbre constants - MOVE THESE to a per-instrument basis
  const resFreqL_Hz = 12.0123
  const resFreqM_Hz = 53.1357
  const resFreqR_Hz = 189.0123

  // Controls number of channels, and their sound
  const channelSetupArray = [
    {channelGainDb: -3, type: 'triangle'},
    {channelGainDb: -50, type: 'triangle'},
  ]

  // Sequencing of how parameters of channel change over time, using LINEAR ramping.
  // Each sub-array is a single note of format:
  // [ channelNum, noteLengthBeats, frequencyHz, noteGainDb ]
  // channelNum 1, 2, 3... is mandatory, all the rest are optional
  // noteLengthBeats is number 0 < x <= 256
  // frequencyHz is any number -22050 <= x <= 22050
  // noteGainDb is any number -800 <= x <= 800
  const dt = 0.0001
  const sequencedData = [
    [2, dt, 440, minGainDb],

    [1, dt, 400, minGainDb],
    [1, 1, 400, 0],
    [1, 1, 300],
    [1, 1, 300],
    [1, 0.5, 400],
    [1, 0.5, 400],
    [1, 0.5, 450],
    [1, 0.5, 450],
    [1, 0.5, 500],
    [1, 0.5, 500],
    [1, 0.5, 600],
    [1, 0.5, 600],
    [1, 1, 550],
    [1, 1, 550],
    [1, 1, 700],
    [1, 1, 700],
    [1, 1, 600],
    [1, 4, 600, minGainDb],
  ]

  Tone.Transport.bpm.value = beatsPerMinute;
  const maxChannel = channelSetupArray.length
  const testGainDb = -4 * minGainDb    // Test data values within a wider range
  const nyqFreqHz = 0.5 * sampleRateHz // Freq data values within Nyquist range
  let tonesToStart = []
  let channelControls = []
  let tonesToDispose = []
  let tonesSetup = false

  function setupTones() {
    console.log('Setting up tones')
    tonesToStart = []
    channelControls = []
    tonesToDispose = []
    channelSetupArray.forEach(channelSetup => {
      // Calculations
      const theDelayTimeL_s = 0.5 / resFreqL_Hz
      const theDelayTimeM_s = 0.5 / resFreqM_Hz
      const theDelayTimeR_s = 0.5 / resFreqR_Hz
      // Create tones
      const newSource = new Tone.Oscillator(channelSetup)
      const newDelayL = new Tone.Delay(theDelayTimeL_s, theDelayTimeL_s)
      const newDelayM = new Tone.Delay(theDelayTimeM_s, theDelayTimeM_s)
      const newDelayR = new Tone.Delay(theDelayTimeR_s, theDelayTimeR_s)
      const newGainL = new Tone.Gain(-0.25)  // With same resFreq, these all cancel out
      const newGainM = new Tone.Gain(-0.5)
      const newGainR = new Tone.Gain(-0.25)
      const newPannerL = new Tone.Panner(-1)
      const newPannerR = new Tone.Panner(1)
      // Connect tones
      newSource.chain(Tone.Master)
      newSource.chain(newDelayL, newGainL, newPannerL, Tone.Master)
      newSource.chain(newDelayM, newGainM, Tone.Master)
      newSource.chain(newDelayR, newGainR, newPannerR, Tone.Master)
      // Store tones
      tonesToStart.push(newSource)
      tonesToDispose.push(newSource)
      tonesToDispose.push(newDelayL)
      tonesToDispose.push(newGainL)
      tonesToDispose.push(newPannerL)
      tonesToDispose.push(newDelayM)
      tonesToDispose.push(newGainM)
      tonesToDispose.push(newDelayR)
      tonesToDispose.push(newGainR)
      tonesToDispose.push(newPannerR)
      // Store control parameters
      const channelControl = {}
      channelControls.push(channelControl)
      channelControl.freq = newSource.frequency
      channelControl.gain = newSource.volume
    })
  }

  // Helper function to change parameters with linear ramps
  let noteStartTxt, noteLenTxt
  const doLinearRamp = (toneControl, varDescription, minVal, maxVal, dataVal, addVal=0) => {
    if (toneControl && Number.isFinite(dataVal)) {
      const newVal = dataVal + addVal
      if (minVal <= newVal && newVal <= maxVal) {
        toneControl.linearRampTo(newVal, noteLenTxt, noteStartTxt)
        console.log(`- - Linear ${varDescription} ramp to ${newVal}`)
      }
    }
  }

  function sequenceTones() {
    console.log('Sequencing tones')
    const chanStartBeatArray = []
    sequencedData.forEach( rowData => {
      // Deal with channel
      const channelNum = rowData[0]     // Should be 1 ... maxChannel
      if (!Number.isInteger(channelNum) || channelNum < 1 || maxChannel < channelNum) return
      const channelIndex = channelNum - 1
      // Could factor this out into an array?
      const channelSetup = channelSetupArray[channelIndex]
      const channelGainDb = channelSetup ? channelSetup.channelGainDb || 0 : 0
      console.log(`Channel ${channelNum} with index ${channelIndex} and gain ${channelGainDb}`)
      // Deal with timing
      const noteLenBeats = rowData[1]   // Should be positive number <= maxBeats
      if (!Number.isFinite(noteLenBeats) || noteLenBeats <= 0 || maxBeats < noteLenBeats) return
      const noteStartBeat = chanStartBeatArray[channelIndex] || 0
      const noteEndBeat = noteStartBeat + noteLenBeats
      chanStartBeatArray[channelIndex] = noteEndBeat
      console.log(`- Beat start ${noteStartBeat} length ${noteLenBeats} end ${noteEndBeat}`)
      // Change the channel controls
      const chanCtrls = channelControls[channelIndex]
      if (chanCtrls) {
        // Supply timing info to doLinearRamp
        noteStartTxt = `+0:${noteStartBeat}:0`
        noteLenTxt = `0:${noteLenBeats}:0`
        // Deal with frequency changes
        const newFreqHz = rowData[2]
        doLinearRamp(chanCtrls.freq, 'frequency', -nyqFreqHz, nyqFreqHz, newFreqHz)
        // Deal with gain changes
        const noteGainDb = rowData[3]
        const addGainDb = mainGainDb + channelGainDb
        doLinearRamp(chanCtrls.gain, 'gain', -testGainDb, testGainDb, noteGainDb, addGainDb)
      }
    })
  }

  function startTones() {
    console.log('Starting tones')
    tonesToStart.forEach( tone => tone.start() )
  }

  function disposeTones() {
    console.log('Disposing of tones')
    tonesToStart = []
    channelControls = []
    tonesToDispose.forEach( tone => tone.dispose() )
    tonesToDispose = []
  }

  function toggleTones() {
    console.log('Toggle tones called')
    if (tonesSetup) {
      disposeTones()
      tonesSetup = false
    } else {
      setupTones()
      sequenceTones()
      startTones()
      tonesSetup = true
    }
  }

  document.querySelector('body').addEventListener('click', toggleTones)
})();
