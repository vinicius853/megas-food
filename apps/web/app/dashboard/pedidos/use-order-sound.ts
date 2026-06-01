import { useEffect, useRef, useState } from 'react'

export function useOrderSound() {
  const soundEnabledRef = useRef(false)

  const [soundEnabled, setSoundEnabled] = useState(false)

  function playNewOrderSound() {
    if (!soundEnabledRef.current) return

    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext

    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.type = 'sine'

    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime,
    )

    gainNode.gain.setValueAtTime(
      0.25,
      audioContext.currentTime,
    )

    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5,
    )

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start()

    oscillator.stop(audioContext.currentTime + 0.5)
  }

  function enableSound() {
    soundEnabledRef.current = true

    setSoundEnabled(true)

    localStorage.setItem(
      'ordersSoundEnabled',
      'true',
    )

    playNewOrderSound()
  }

  useEffect(() => {
    const storedSoundEnabled =
      localStorage.getItem('ordersSoundEnabled')

    if (storedSoundEnabled === 'true') {
      soundEnabledRef.current = true
      setSoundEnabled(true)
    }
  }, [])

  return {
    soundEnabled,
    enableSound,
    playNewOrderSound,
  }
}
