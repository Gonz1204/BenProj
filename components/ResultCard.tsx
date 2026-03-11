'use client'

import { useCallback } from 'react'

interface ResultCardProps {
  audioUrl: string
  topic: string
  onReset: () => void
}

export default function ResultCard({ audioUrl, topic, onReset }: ResultCardProps) {
  const handleDownload = useCallback(() => {
    const filename = `${topic || 'podcast'}.mp3`
    const a = document.createElement('a')
    a.href = audioUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [audioUrl, topic])

  return (
    <div
      className="result-card-glow fade-in-up"
      style={{
        backgroundColor: '#1A1A2E',
        borderRadius: '14px',
        border: '2px solid #00FF88',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Title */}
      <h2
        style={{
          color: '#00FF88',
          fontSize: '28px',
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        ✅ Your podcast is ready!
      </h2>

      {/* Info box */}
      <div
        style={{
          backgroundColor: 'rgba(0,255,136,0.08)',
          border: '1px solid rgba(0,255,136,0.3)',
          borderRadius: '10px',
          padding: '16px 18px',
        }}
      >
        <p
          style={{
            color: '#FFFFFF',
            fontSize: '22px',
            margin: '0 0 10px 0',
            lineHeight: 1.5,
          }}
        >
          ▶ It is playing now.
        </p>
        <p
          style={{
            color: '#FFFFFF',
            fontSize: '22px',
            margin: '0 0 10px 0',
            lineHeight: 1.5,
          }}
        >
          💾 Tap the button below to save the MP3 to your phone.
        </p>
        <p
          style={{
            color: '#FFFFFF',
            fontSize: '22px',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          🔁 Drop a new photo to make another one.
        </p>
      </div>

      {/* Native audio player */}
      <audio
        // eslint-disable-next-line jsx-a11y/media-has-caption
        controls
        autoPlay
        src={audioUrl}
        style={{
          width: '100%',
          borderRadius: '10px',
          minHeight: '54px',
        }}
        aria-label="Generated podcast audio"
      />

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        style={{
          width: '100%',
          minHeight: '60px',
          backgroundColor: '#F5C518',
          color: '#0A0A0A',
          fontSize: '22px',
          fontWeight: 700,
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          letterSpacing: '0.02em',
          transition: 'background-color 0.15s, transform 0.1s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#d4a800'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#F5C518'
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)'
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        aria-label={`Save MP3 to your phone: ${topic}`}
      >
        💾 SAVE MP3 TO YOUR PHONE
      </button>

      {/* Make Another button */}
      <button
        type="button"
        onClick={onReset}
        style={{
          width: '100%',
          minHeight: '60px',
          backgroundColor: 'transparent',
          color: '#CCCCCC',
          fontSize: '20px',
          fontWeight: 600,
          border: '2px solid #444444',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#CCCCCC'
          e.currentTarget.style.color = '#FFFFFF'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#444444'
          e.currentTarget.style.color = '#CCCCCC'
        }}
        aria-label="Make another podcast"
      >
        🔁 Make Another Podcast
      </button>
    </div>
  )
}
