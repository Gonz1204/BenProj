'use client'

import { useState, useCallback } from 'react'
import UploadZone from '@/components/UploadZone'
import VoicePicker from '@/components/VoicePicker'
import StatusBar from '@/components/StatusBar'
import ResultCard from '@/components/ResultCard'
import type { DebateLine } from '@/app/api/generate/route'

interface ImageItem {
  base64: string
  mimeType: string
  previewUrl: string
}

type AppStatus = 'idle' | 'uploading' | 'extracting' | 'converting' | 'stitching' | 'done' | 'error'

export default function HomePage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [host1Voice, setHost1Voice] = useState<string | null>(null)
  const [host2Voice, setHost2Voice] = useState<string | null>(null)
  const [status, setStatus] = useState<AppStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [topic, setTopic] = useState<string>('History_Debate')

  const isLoading =
    status === 'uploading' ||
    status === 'extracting' ||
    status === 'converting' ||
    status === 'stitching'

  const sameVoice = host1Voice && host2Voice && host1Voice === host2Voice

  const canGenerate =
    images.length > 0 &&
    host1Voice !== null &&
    host2Voice !== null &&
    !sameVoice &&
    !isLoading

  const getHelperText = () => {
    if (images.length === 0) return 'Upload at least one photo to continue'
    if (!host1Voice || !host2Voice) return 'Pick a voice for both hosts to continue'
    if (sameVoice) return 'Pick two different voices to continue'
    return ''
  }

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return

    setErrorMessage('')
    setAudioBlob(null)

    try {
      setStatus('extracting')

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((i) => i.base64),
          mimeTypes: images.map((i) => i.mimeType),
        }),
      })

      if (!generateRes.ok) {
        const data = await generateRes.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Script generation failed (${generateRes.status})`)
      }

      const { script, topic: rawTopic } = await generateRes.json() as {
        script: DebateLine[]
        topic: string
      }

      if (!script || script.length === 0) {
        throw new Error('No script returned — please try again')
      }

      setTopic(rawTopic || 'History_Debate')
      setStatus('converting')

      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: script,
          voice1Id: host1Voice,
          voice2Id: host2Voice,
        }),
      })

      if (!ttsRes.ok) {
        const data = await ttsRes.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? `Audio generation failed (${ttsRes.status})`)
      }

      const blob = await ttsRes.blob()
      setAudioBlob(blob)
      setStatus('done')
    } catch (err: unknown) {
      console.error('Generate error:', err)
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [canGenerate, images, host1Voice, host2Voice])

  const handleReset = useCallback(() => {
    setImages([])
    setAudioBlob(null)
    setTopic('History_Debate')
    setStatus('idle')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const helperText = getHelperText()

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0A0A0A',
        paddingBottom: '80px',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Header */}
        <header style={{ paddingTop: '48px', paddingBottom: '28px' }}>
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '36px',
              fontWeight: 700,
              margin: '0 0 10px 0',
              lineHeight: 1.2,
            }}
          >
            🎙 BENPODCAST
          </h1>
          <p
            style={{
              color: '#CCCCCC',
              fontSize: '20px',
              margin: '0 0 20px 0',
              lineHeight: 1.6,
            }}
          >
            Turn your textbook into a sports debate podcast.
          </p>
          <div
            style={{
              width: '100%',
              height: '2px',
              backgroundColor: '#F5C518',
            }}
          />
        </header>

        {/* Status bar */}
        <StatusBar status={status} errorMessage={errorMessage} />

        {/* Step 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2
            style={{
              color: '#F5C518',
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 16px 0',
              lineHeight: 1.3,
            }}
          >
            STEP 1 — UPLOAD YOUR PHOTOS
          </h2>
          <UploadZone images={images} onImagesChange={setImages} />
        </section>

        {/* Step 2 */}
        <section style={{ marginBottom: '40px' }}>
          <h2
            style={{
              color: '#F5C518',
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 16px 0',
              lineHeight: 1.3,
            }}
          >
            STEP 2 — PICK YOUR TWO HOSTS
          </h2>
          <VoicePicker
            host1Voice={host1Voice}
            host2Voice={host2Voice}
            onHost1Change={setHost1Voice}
            onHost2Change={setHost2Voice}
          />
        </section>

        {/* Step 3 */}
        <section style={{ marginBottom: '40px' }}>
          <h2
            style={{
              color: '#F5C518',
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 16px 0',
              lineHeight: 1.3,
            }}
          >
            STEP 3 — GENERATE
          </h2>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-busy={isLoading}
            aria-label={
              !canGenerate && !isLoading
                ? helperText
                : isLoading
                ? 'Generating, please wait...'
                : 'Generate your podcast'
            }
            style={{
              width: '100%',
              minHeight: '64px',
              backgroundColor: canGenerate ? '#F5C518' : '#444444',
              color: canGenerate ? '#0A0A0A' : '#888888',
              fontSize: '22px',
              fontWeight: 700,
              border: 'none',
              borderRadius: '10px',
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background-color 0.15s, color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isLoading ? (
              <>
                <span>⏳</span>
                {status === 'extracting'
                  ? 'Writing the script...'
                  : 'Recording the hosts...'}
              </>
            ) : (
              '🎙 GENERATE MY PODCAST'
            )}
          </button>

          {!canGenerate && !isLoading && helperText && (
            <p
              style={{
                color: '#CCCCCC',
                fontSize: '18px',
                textAlign: 'center',
                marginTop: '12px',
                lineHeight: 1.5,
              }}
            >
              {helperText}
            </p>
          )}
        </section>

        {/* Result */}
        {status === 'done' && audioBlob && (
          <ResultCard
            audioBlob={audioBlob}
            topic={topic}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  )
}
