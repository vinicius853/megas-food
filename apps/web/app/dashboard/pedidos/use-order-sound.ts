import { useEffect, useRef, useState } from 'react'

export function useOrderSound() {
  const soundEnabledRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const [soundEnabled, setSoundEnabled] = useState(false)

  function playNewOrderSound() {
    if (!soundEnabledRef.current) return

    const AudioContextClass =
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext
        }
      ).webkitAudioContext

    if (!AudioContextClass) return

    const audioContext =
      audioContextRef.current ?? new AudioContextClass()

    audioContextRef.current = audioContext

    const playTone = () => {
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

    if (audioContext.state === 'suspended') {
      void audioContext.resume().then(playTone).catch(() => undefined)
      return
    }

    playTone()
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
    const restoreTimer = window.setTimeout(() => {
      const storedSoundEnabled =
        localStorage.getItem('ordersSoundEnabled')

      if (storedSoundEnabled === 'true') {
        soundEnabledRef.current = true
        setSoundEnabled(true)
      }
    }, 0)

    return () => {
      clearTimeout(restoreTimer)

      const audioContext = audioContextRef.current
      audioContextRef.current = null

      if (audioContext && audioContext.state !== 'closed') {
        void audioContext.close()
      }
    }
  }, [])

  return {
    soundEnabled,
    enableSound,
    playNewOrderSound,
  }
}
