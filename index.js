// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/wvvxOLq

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  const beatsPerMinute = 260;
  const mainGainDb = -10

  // Each sub-array is a single note of format:
  // [ channelNum, noteLengthBeats, frequencyHz, noteGainDb ]
  // Channel starts 1, 2, ...
  // Default values are:
  // [ 1, 0, 0, 0]
  // To play a rest, set frequency to zero
  const dt = 0.1
  const sequencedData = [
    [1, dt],   // Start gap
    [2, dt],

    [1, 1],
    [1, 1, 180],
    [1, 1, 160],
    [1, 1, 150],
    [1, 1, 140],
    [1, 1, 130],
    [1, 1, 120],
    [1, 1, 110],
    [1, 4, 100],

    [2, 2, 200],
    [2, 2, 250],
    [2, 1, 300],
    [2, 1, 350],
    [2, 1, 450],
    [2, 1, 425],
    [2, 6, 400],

    [1, dt],   // End gap
    [2, dt],
  ]

  const triOsc = {type: 'triangle'}
  const sineOsc = {type: 'sine'}
  const sqOsc = {type: 'square'}
  const sawOsc = {type: 'sawtooth'}
  const chipEnv = {attack: 0.001, decay: 0.0001, sustain: 1, release: 0.01}
  const slowEnv = {attack: 0.2, decay: 0.2, sustain: 0.5, release: 1}

  const channelSetupArray = [
    {channelGainDb: 0, harmonicity: 1, modulationIndex: 5,
      oscillator: triOsc, envelope: chipEnv, modulation: triOsc, modulationEnvelope: chipEnv},
    {channelGainDb: -3, harmonicity: 2, modulationIndex: 3,
      oscillator: triOsc, envelope: chipEnv, modulation: triOsc, modulationEnvelope: chipEnv},
  ]
  // Bug in FMSynth - oscillator and modulation appear not to work...

  const minGain = -200
  const gainChangeMs = 500
  const timeConstantS = 0.001 * gainChangeMs
  Tone.Transport.bpm.value = beatsPerMinute;
  let channelToneArray = [];
  let tonesSetup = false

  function setupTones() {
    console.log('Setting up tones')
    channelToneArray = []
    channelSetupArray.forEach(channelSetup => {
      const newSource = new Tone.Oscillator(channelSetup).toMaster()
      newSource.volume = minGain
      channelToneArray.push(newSource)
    })
    tonesSetup = true
  }

  function sequenceTones() {
    console.log('Sequencing tones')

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

      const theTone = channelToneArray[channelIndex]
      if (theTone) {
        theTone.frequency.setValueAtTime(noteFreqHz, noteStartTxt)
        theTone.volume.linearRampTo(noteFinalGainDb, timeConstantS, noteStartTxt)
      }
      // if (theTone) theTone.triggerAttackRelease(noteFreqHz, noteLenTxt, noteStartTxt, noteAmplitude)

      console.log(`Sequencing note on channel ${channelNum} from ${noteStartBeats.toFixed(2)} to ${noteEndBeats.toFixed(2)} beats, at ${noteFreqHz.toFixed(2)}Hz, with gain ${noteFinalGainDb.toFixed(1)} (amplitude ${noteAmplitude.toFixed(4)})`)
    })
  }

  function startTones() {
    console.log('Starting tones')
    channelToneArray.forEach( tone => tone.start() )
  }

  function disposeTones() {
    console.log('Disposing of tones')
    channelToneArray.forEach( tone => tone.dispose() )
    channelToneArray = []
    tonesSetup = false
  }

  function toggleTones() {
    if (tonesSetup) {
      disposeTones()
    } else {
      setupTones()
      sequenceTones()
      startTones()
    }
  }

  document.querySelector('body').addEventListener('click', toggleTones)
})();
