'use client'

import { useState, useRef, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import VoicePicker from '@/components/VoicePicker'
import StatusBar from '@/components/StatusBar'
import ResultCard from '@/components/ResultCard'

type AppStatus = 'idle' | 'extracting' | 'converting' | 'done' | 'error'

export default function HomePage() {
  const [image, setImage] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('image/jpeg')
  const [selectedVoice, setSelectedVoice] = useState<string>('onyx')
  const [status, setStatus] = useState<AppStatus>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>('lecture')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const resultRef = useRef<HTMLDivElement>(null)

  const handleImageSelected = useCallback((base64: string, mime: string) => {
    setImage(base64)
    setMimeType(mime)
    // Reset result state if user re-uploads
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setStatus('idle')
    setErrorMessage(undefined)
  }, [audioUrl])

  const handleGenerate = useCallback(async () => {
    if (!image) return
    if (status === 'extracting' || status === 'converting') return

    // Revoke old audio URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    setErrorMessage(undefined)
    setStatus('extracting')

    try {
      // Step 1: Extract script from image
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mimeType }),
      })

      if (!generateRes.ok) {
        const errorData = await generateRes.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: string }).error ||
            `Script generation failed (${generateRes.status})`
        )
      }

      const generateData = await generateRes.json() as { script: string; topic: string }
      const { script, topic: rawTopic } = generateData

      if (!script) {
        throw new Error('No script was returned. Please try again.')
      }

      setTopic(rawTopic || 'lecture')
      setStatus('converting')

      // Step 2: Convert script to audio
      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, voice: selectedVoice }),
      })

      if (!ttsRes.ok) {
        const errorData = await ttsRes.json().catch(() => ({}))
        throw new Error(
          (errorData as { error?: string }).error ||
            `Audio conversion failed (${ttsRes.status})`
        )
      }

      const audioBlob = await ttsRes.blob()
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      setStatus('done')

      // Move focus to result card
      setTimeout(() => {
        resultRef.current?.focus()
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err: unknown) {
      console.error('Generate error:', err)
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [image, mimeType, selectedVoice, status, audioUrl])

  const handleReset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setImage(null)
    setMimeType('image/jpeg')
    setSelectedVoice('onyx')
    setStatus('idle')
    setAudioUrl(null)
    setTopic('lecture')
    setErrorMessage(undefined)
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [audioUrl])

  const isLoading = status === 'extracting' || status === 'converting'

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        paddingBottom: '60px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Header */}
        <header
          style={{
            paddingTop: '40px',
            paddingBottom: '28px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}
          >
            📚 TEXTBOOK PODCAST
          </h1>
          <p
            style={{
              color: '#CCCCCC',
              fontSize: '18px',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Upload a textbook photo and get an instant audio lecture.
          </p>
        </header>

        {/* Status bar */}
        <StatusBar status={status} errorMessage={errorMessage} />

        {/* Section 1: Upload */}
        <section style={{ marginBottom: '32px' }}>
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px 0',
            }}
          >
            1. Upload Your Photo
          </h2>
          <UploadZone onImageSelected={handleImageSelected} />
        </section>

        {/* Section 2: Voice */}
        <section style={{ marginBottom: '32px' }}>
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px 0',
            }}
          >
            2. Pick a Voice
          </h2>
          <VoicePicker
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
          />
        </section>

        {/* Section 3: Generate or Result */}
        <section>
          <h2
            style={{
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px 0',
            }}
          >
            3. Generate
          </h2>

          {status === 'done' && audioUrl ? (
            <div
              ref={resultRef}
              tabIndex={-1}
              style={{ outline: 'none' }}
            >
              <ResultCard
                audioUrl={audioUrl}
                topic={topic}
                onReset={handleReset}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!image || isLoading}
              className={!image || isLoading ? '' : 'btn-pulse'}
              style={{
                width: '100%',
                minHeight: '60px',
                backgroundColor:
                  !image || isLoading ? '#444444' : '#F5C518',
                color: !image || isLoading ? '#888888' : '#0A0A0A',
                fontSize: '22px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '10px',
                cursor: !image || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                letterSpacing: '0.02em',
                transition: 'background-color 0.15s, color 0.15s, transform 0.1s',
              }}
              onMouseOver={(e) => {
                if (!(!image || isLoading)) {
                  e.currentTarget.style.backgroundColor = '#d4a800'
                }
              }}
              onMouseOut={(e) => {
                if (!(!image || isLoading)) {
                  e.currentTarget.style.backgroundColor = '#F5C518'
                }
              }}
              onMouseDown={(e) => {
                if (!(!image || isLoading)) {
                  e.currentTarget.style.transform = 'scale(0.98)'
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label={
                !image
                  ? 'Upload a photo first to generate a podcast'
                  : isLoading
                  ? 'Generating podcast, please wait...'
                  : 'Generate my podcast'
              }
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite',
                    }}
                  >
                    ⏳
                  </span>
                  {status === 'extracting'
                    ? 'Reading your page...'
                    : 'Creating audio...'}
                </>
              ) : (
                <>🎙 GENERATE MY PODCAST</>
              )}
            </button>
          )}

          {!image && status === 'idle' && (
            <p
              style={{
                color: '#CCCCCC',
                fontSize: '16px',
                textAlign: 'center',
                marginTop: '10px',
              }}
            >
              Upload a photo above to get started.
            </p>
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}
