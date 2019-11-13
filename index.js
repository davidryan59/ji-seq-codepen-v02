// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/wvvxOLq

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // Main constants
  const beatsPerMinute = 300
  const mainGainDb = -10
  const minGainDb = -200
  const maxBeats = 256
  const maxFreqHz = 22050

  // Timbre constants - MOVE THESE to a per-instrument basis
  const resFreq1_Hz = 300
  const resFreq2_Hz = 80

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
    [1, 1, 400],
    [1, 1, 500],
    [1, 1, 500],
    [1, 1, 600],
    [1, 1, 600],
    [1, 1, 900],
    [1, 1, 900],
    [1, 1, 800],
    [1, 1, 300],
    [1, 1, 400],
    [1, 1, 400],
    [1, 1, 400],
    [1, 4, 400, minGainDb],
  ]

  Tone.Transport.bpm.value = beatsPerMinute;
  const maxChannel = channelSetupArray.length
  const maxGainToTestDb = -4 * minGainDb    // Give more space for supplied gain values
  let tonesToStart = []
  let tonesToDispose = []
  let tonesSetup = false

  function setupTones() {
    console.log('Setting up tones')
    tonesToStart = []
    tonesToDispose = []
    channelSetupArray.forEach(channelSetup => {
      // Create tones
      const newSource = new Tone.Oscillator(channelSetup)
      const theDelayTime1_s = 0.5 / resFreq1_Hz
      const theDelayTime2_s = 0.5 / resFreq2_Hz
      const newDelay1 = new Tone.Delay(theDelayTime1_s, theDelayTime1_s)
      const newDelay2 = new Tone.Delay(theDelayTime2_s, theDelayTime2_s)
      const newDelayGain = new Tone.Gain(-0.5)
      // Link tones
      newSource.chain(Tone.Master)
      newSource.chain(newDelay1, newDelayGain, Tone.Master)
      newSource.chain(newDelay2, newDelayGain, Tone.Master)
      // Store tones
      tonesToStart.push(newSource)
      tonesToDispose.push(newSource)
      tonesToDispose.push(newDelay1)
      tonesToDispose.push(newDelay2)
      tonesToDispose.push(newDelayGain)
    })
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
      const noteLenTxt = `0:${noteLenBeats}:0`
      const noteStartBeat = chanStartBeatArray[channelIndex] || 0
      const noteStartTxt = `+0:${noteStartBeat}:0`
      const noteEndBeat = noteStartBeat + noteLenBeats
      chanStartBeatArray[channelIndex] = noteEndBeat
      console.log(`- Beat start ${noteStartBeat} length ${noteLenBeats} end ${noteEndBeat}`)

      // Later on, the parameters might be spread out over more than 1 tone...
      const theTone = tonesToStart[channelIndex]
      if (theTone) {

        // Deal with frequency changes
        const noteFreqHz = rowData[2]
        if (Number.isFinite(noteFreqHz) && -maxFreqHz <= noteFreqHz && noteFreqHz <= maxFreqHz) {
          theTone.frequency.linearRampTo(noteFreqHz, noteLenTxt, noteStartTxt)
          console.log(`- - Linear frequency ramp to ${noteFreqHz}`)
        }

        // Deal with gain changes
        const noteGainDb = rowData[3]
        if (Number.isFinite(noteGainDb) && -maxGainToTestDb <= noteGainDb && noteGainDb <= maxGainToTestDb) {
          const totalGainDb = mainGainDb + channelGainDb + noteGainDb
          theTone.volume.linearRampTo(totalGainDb, noteLenTxt, noteStartTxt)
          console.log(`- - Linear gain ramp to ${totalGainDb}`)
        }
      }
    })
  }

  function startTones() {
    console.log('Starting tones')
    tonesToStart.forEach( tone => tone.start() )
  }

  function disposeTones() {
    console.log('Disposing of tones')
    tonesToDispose.forEach( tone => tone.dispose() )
    tonesToDispose = []
    tonesToStart = []
  }

  function toggleTones() {
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
