'use client'

import { useCallback, useState } from 'react'

interface VoiceOption {
  id: string
  name: string
  desc: string
}

const VOICES: VoiceOption[] = [
  { id: 'onyx', name: 'Onyx', desc: 'Deep & Clear' },
  { id: 'nova', name: 'Nova', desc: 'Warm & Friendly' },
  { id: 'fable', name: 'Fable', desc: 'Expressive' },
  { id: 'alloy', name: 'Alloy', desc: 'Neutral' },
  { id: 'echo', name: 'Echo', desc: 'Smooth' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Bright' },
]

const PREVIEW_SENTENCE =
  "In 1865, the United States faced one of its most consequential turning points. What you need to understand is why this moment defined the next century of American history."

interface VoicePickerProps {
  selectedVoice: string
  onVoiceChange: (voice: string) => void
}

export default function VoicePicker({ selectedVoice, onVoiceChange }: VoicePickerProps) {
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  const handleVoiceSelect = useCallback(
    (voiceId: string) => {
      onVoiceChange(voiceId)
    },
    [onVoiceChange]
  )

  const handlePreview = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent, voiceId: string) => {
      e.stopPropagation()

      // Stop any currently playing preview
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.src = ''
        setCurrentAudio(null)
      }

      if (previewingVoice === voiceId) {
        setPreviewingVoice(null)
        return
      }

      setPreviewingVoice(voiceId)

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: PREVIEW_SENTENCE, voice: voiceId }),
        })

        if (!res.ok) {
          throw new Error(`TTS preview failed: ${res.status}`)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)

        audio.onended = () => {
          setPreviewingVoice(null)
          URL.revokeObjectURL(url)
          setCurrentAudio(null)
        }

        audio.onerror = () => {
          setPreviewingVoice(null)
          URL.revokeObjectURL(url)
          setCurrentAudio(null)
        }

        setCurrentAudio(audio)
        await audio.play()
      } catch (err) {
        console.error('Preview error:', err)
        setPreviewingVoice(null)
      }
    },
    [previewingVoice, currentAudio]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {VOICES.map((voice) => {
        const isSelected = selectedVoice === voice.id
        const isPreviewing = previewingVoice === voice.id

        return (
          <div
            key={voice.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => handleVoiceSelect(voice.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleVoiceSelect(voice.id)
              }
            }}
            style={{
              minHeight: '70px',
              backgroundColor: isSelected ? 'rgba(245,197,24,0.1)' : '#1A1A2E',
              border: `3px solid ${isSelected ? '#F5C518' : '#2A2A4E'}`,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background-color 0.2s',
              gap: '12px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🎙</span>

            {/* Name + description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: isSelected ? '#F5C518' : '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {voice.name}
              </div>
              <div
                style={{
                  color: '#CCCCCC',
                  fontSize: '15px',
                  lineHeight: 1.3,
                }}
              >
                {voice.desc}
              </div>
            </div>

            {/* Preview button */}
            <button
              type="button"
              aria-label={`Preview ${voice.name} voice`}
              onClick={(e) => handlePreview(e, voice.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handlePreview(e, voice.id)
                }
              }}
              style={{
                minHeight: '44px',
                minWidth: '60px',
                padding: '6px 14px',
                backgroundColor: isPreviewing ? '#F5C518' : 'transparent',
                border: `2px solid ${isPreviewing ? '#F5C518' : '#CCCCCC'}`,
                borderRadius: '8px',
                color: isPreviewing ? '#0A0A0A' : '#CCCCCC',
                fontSize: '18px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                fontWeight: isPreviewing ? 700 : 400,
              }}
            >
              {isPreviewing ? '⏹' : '▶'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
