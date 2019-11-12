// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/wvvxOLq

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  const beatsPerMinute = 120;
  const mainGainDb = -10

  // Each sub-array is a single note of format:
  // [ channelNum, noteLengthBeats, frequencyHz, noteGainDb ]
  // Channel starts 1, 2, ...
  // Default values are:
  // [ 1, 0, 0, 0]
  // To play a rest, set frequency to zero
  const sequencedData = [
    [1, 0.5],
    [1, 0.5, 180],
    [1, 0.5, 160],
    [1, 0.5, 150],
    [1, 0.5, 140],
    [1, 0.5, 130],
    [1, 0.5, 120],
    [1, 0.5, 110],
    [1, 2, 100],

    [2, 1, 200],
    [2, 1, 250],
    [2, 0.5, 300],
    [2, 0.5, 350],
    [2, 0.5, 450],
    [2, 0.5, 425],
    [2, 4, 400],
  ]

  const saw13Type = {type: 'sawtooth13'}
  const triType = {type: 'triangle'}
  const chipEnv = {attack: 0.001, decay: 0.0001, sustain: 1, release: 0.01}

  const channelSetupArray = [
    {channelGainDb: -2, oscillator: saw13Type, envelope: chipEnv},
    {oscillator: triType, envelope: chipEnv},
  ]

  const minGain = -200
  Tone.Transport.bpm.value = beatsPerMinute;
  let toneArray = [];
  let tonesSetup = false

  function setupTones() {
    console.log('Setting up tones')
    toneArray = []
    channelSetupArray.forEach(channelSetup => toneArray.push(new Tone.Synth(channelSetup).toMaster()))
    tonesSetup = true
  }

  function disposeTones() {
    console.log('Disposing of tones')
    toneArray.forEach( tone => tone.dispose() )
    toneArray = []
    tonesSetup = false
  }

  function playTones() {
    console.log('Playing sequencer')

    const chanStartBeatArray = []

    sequencedData.forEach( data => {
      const channelNum = (data[0] || 1)
      const noteLenBeats = data[1] || 0
      const noteFreqHz = data[2] || 0
      const noteGainDb = noteFreqHz ? data[3] || 0 : minGain


      const channelIndex = channelNum - 1
      const channelSetup = channelSetupArray[channelIndex]
      const channelGainDb = channelSetup ? channelSetup.channelGainDb || 0 : 0

      const noteFinalGainDb = mainGainDb + channelGainDb + noteGainDb
      const noteStartBeats = chanStartBeatArray[channelIndex] || 0
      const noteEndBeats = noteStartBeats + noteLenBeats
      chanStartBeatArray[channelIndex] = noteEndBeats

      const noteAmplitude = Math.pow(10, 0.05 * noteFinalGainDb)
      const noteStartTxt = `+0:${noteStartBeats}:0`
      const noteLenTxt = `0:${noteLenBeats}:0`

      const theTone = toneArray[channelIndex]
      if (theTone) theTone.triggerAttackRelease(noteFreqHz, noteLenTxt, noteStartTxt, noteAmplitude)

      console.log(`Playing note on channel ${channelNum} from ${noteStartBeats.toFixed(2)} to ${noteEndBeats.toFixed(2)} beats, at ${noteFreqHz.toFixed(2)}Hz, with gain ${noteFinalGainDb.toFixed(1)} (amplitude ${noteAmplitude.toFixed(4)})`)
    })
  }

  function toggleTones() {
    if (tonesSetup) {
      disposeTones()
    } else {
      setupTones()
      playTones()
    }
  }

  document.querySelector('body').addEventListener('click', toggleTones)
})();
