'use client'

import { useRef, useEffect, useState } from 'react'

interface ResultCardProps {
  audioBlob: Blob | null
  topic: string
  onReset: () => void
}

export default function ResultCard({ audioBlob, topic, onReset }: ResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.focus()
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleSave = () => {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      style={{
        outline: 'none',
        backgroundColor: '#1A1A2E',
        borderRadius: '14px',
        padding: '28px 24px',
        marginTop: '24px',
      }}
    >
      <h2
        style={{
          color: '#00FF88',
          fontSize: '28px',
          fontWeight: 700,
          margin: '0 0 20px 0',
          lineHeight: 1.3,
          textAlign: 'center',
        }}
      >
        YOUR PODCAST IS READY!
      </h2>

      {/* Info box */}
      <div
        style={{
          backgroundColor: '#0A0A0A',
          border: '2px solid #F5C518',
          borderRadius: '10px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <p style={{ color: '#FFFFFF', fontSize: '22px', margin: '0 0 10px 0', lineHeight: 1.6 }}>
          ▶ It is playing now.
        </p>
        <p style={{ color: '#FFFFFF', fontSize: '22px', margin: '0 0 10px 0', lineHeight: 1.6 }}>
          💾 Tap the button below to save the MP3 to your phone.
        </p>
        <p style={{ color: '#FFFFFF', fontSize: '22px', margin: 0, lineHeight: 1.6 }}>
          🔁 Drop new photos to make another one.
        </p>
      </div>

      {/* Audio player */}
      {audioUrl && (
        <audio
          src={audioUrl}
          controls
          autoPlay
          style={{ width: '100%', marginBottom: '20px' }}
          aria-label="Podcast audio player"
        />
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!audioBlob}
        style={{
          width: '100%',
          minHeight: '64px',
          backgroundColor: '#F5C518',
          color: '#0A0A0A',
          fontSize: '22px',
          fontWeight: 700,
          border: 'none',
          borderRadius: '10px',
          cursor: audioBlob ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '10px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        💾 SAVE TO YOUR PHONE
      </button>

      {/* Helper text */}
      <p
        style={{
          color: '#CCCCCC',
          fontSize: '16px',
          textAlign: 'center',
          margin: '0 0 20px 0',
          lineHeight: 1.5,
        }}
      >
        Tap Save, then choose Files to save to your phone
      </p>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        style={{
          width: '100%',
          minHeight: '56px',
          backgroundColor: '#1A1A2E',
          color: '#F5C518',
          fontSize: '20px',
          fontWeight: 700,
          border: '2px solid #F5C518',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        🔁 MAKE ANOTHER ONE
      </button>
    </div>
  )
}
