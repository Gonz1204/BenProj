'use client'

import { useState, useCallback, useRef } from 'react'
import { CURATED_VOICES } from '@/lib/elevenlabs'

interface VoicePickerProps {
  host1Voice: string | null
  host2Voice: string | null
  onHost1Change: (voiceId: string) => void
  onHost2Change: (voiceId: string) => void
}

export default function VoicePicker({
  host1Voice,
  host2Voice,
  onHost1Change,
  onHost2Change,
}: VoicePickerProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopCurrentPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setPreviewingVoice(null)
  }, [])

  const handlePreview = useCallback(
    async (e: React.MouseEvent, voiceId: string, previewText: string) => {
      e.stopPropagation()
      setPreviewError(null)

      // Stop any current preview
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }

      // Toggle off if same voice clicked again
      if (previewingVoice === voiceId) {
        setPreviewingVoice(null)
        return
      }

      setPreviewingVoice(voiceId)

      // Create Audio element synchronously within the user gesture — required for Safari/iOS
      const audio = new Audio()
      audioRef.current = audio

      try {
        const res = await fetch('/api/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId, text: previewText }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Server error ${res.status}`)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)

        audio.src = url
        audio.onended = () => {
          setPreviewingVoice(null)
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
        }
        audio.onerror = () => {
          setPreviewingVoice(null)
          setPreviewError('Audio failed to play — try again')
          URL.revokeObjectURL(url)
          if (audioRef.current === audio) audioRef.current = null
        }

        await audio.play()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Preview failed'
        console.error('Preview error:', message)
        setPreviewError(message)
        setPreviewingVoice(null)
        if (audioRef.current === audio) audioRef.current = null
      }
    },
    [previewingVoice]
  )

  const sameVoiceError = host1Voice && host2Voice && host1Voice === host2Voice

  const renderHostSection = (
    hostNum: 1 | 2,
    selectedVoice: string | null,
    onVoiceChange: (id: string) => void
  ) => (
    <div style={{ marginBottom: '32px' }}>
      <h3
        style={{
          color: '#00D4FF',
          fontSize: '22px',
          fontWeight: 700,
          margin: '0 0 14px 0',
          letterSpacing: '0.04em',
        }}
      >
        HOST {hostNum}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {CURATED_VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.voice_id
          const isPreviewing = previewingVoice === voice.voice_id

          return (
            <div
              key={voice.voice_id}
              style={{
                minHeight: '80px',
                backgroundColor: isSelected ? '#F5C518' : '#1A1A2E',
                border: `2px solid ${isSelected ? '#F5C518' : '#2A2A4E'}`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                padding: '12px 14px',
                gap: '12px',
                transition: 'background-color 0.15s, border-color 0.15s',
              }}
            >
              {/* Select button area */}
              <button
                type="button"
                aria-label={`Select ${voice.name} for Host ${hostNum}`}
                aria-pressed={isSelected}
                onClick={() => {
                  stopCurrentPreview()
                  onVoiceChange(voice.voice_id)
                }}
                style={{
                  flex: 1,
                  minHeight: '60px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '2px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    color: isSelected ? '#0A0A0A' : '#FFFFFF',
                    fontSize: '18px',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    display: 'block',
                  }}
                >
                  {voice.name}
                </span>
                <span
                  style={{
                    color: isSelected ? '#1A1A2E' : '#CCCCCC',
                    fontSize: '16px',
                    lineHeight: 1.4,
                    display: 'block',
                  }}
                >
                  {voice.description}
                </span>
              </button>

              {/* Preview button */}
              <button
                type="button"
                aria-label={
                  isPreviewing
                    ? `Stop preview of ${voice.name}`
                    : `Preview ${voice.name} voice`
                }
                disabled={!!previewingVoice && !isPreviewing}
                onClick={(e) => handlePreview(e, voice.voice_id, voice.preview_text)}
                style={{
                  minHeight: '60px',
                  minWidth: '80px',
                  padding: '8px 14px',
                  backgroundColor: isPreviewing
                    ? '#00D4FF'
                    : isSelected
                    ? '#0A0A0A'
                    : 'transparent',
                  border: `2px solid ${isPreviewing ? '#00D4FF' : isSelected ? '#0A0A0A' : '#CCCCCC'}`,
                  borderRadius: '8px',
                  color: isPreviewing ? '#0A0A0A' : isSelected ? '#F5C518' : '#CCCCCC',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {isPreviewing ? 'Playing...' : '▶ PREVIEW'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      {renderHostSection(1, host1Voice, onHost1Change)}
      {renderHostSection(2, host2Voice, onHost2Change)}

      {previewError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#1A1A2E',
            border: '2px solid #FF4444',
            borderRadius: '10px',
            padding: '16px 20px',
            color: '#FF4444',
            fontSize: '18px',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          ❌ Preview error: {previewError}
        </div>
      )}

      {sameVoiceError && (
        <div
          role="alert"
          style={{
            backgroundColor: '#1A1A2E',
            border: '2px solid #FF4444',
            borderRadius: '10px',
            padding: '16px 20px',
            color: '#FF4444',
            fontSize: '18px',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          Pick two different voices for each host
        </div>
      )}
    </div>
  )
}
