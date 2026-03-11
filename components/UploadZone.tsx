'use client'

import { useRef, useState, useCallback } from 'react'

interface UploadZoneProps {
  onImageSelected: (base64: string, mimeType: string) => void
}

export default function UploadZone({ onImageSelected }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return
      setIsProcessing(true)

      try {
        let processedFile: File | Blob = file
        let outputMimeType = file.type || 'image/jpeg'

        // Convert HEIC to JPEG if needed
        const isHeic =
          file.type === 'image/heic' ||
          file.type === 'image/heif' ||
          file.name.toLowerCase().endsWith('.heic') ||
          file.name.toLowerCase().endsWith('.heif')

        if (isHeic) {
          const heic2any = (await import('heic2any')).default
          const converted = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          })
          processedFile = Array.isArray(converted) ? converted[0] : converted
          outputMimeType = 'image/jpeg'
        }

        // Resize using canvas to max 1568px on longest side
        const bitmap = await createImageBitmap(processedFile)
        const { width, height } = bitmap

        const MAX_SIDE = 1568
        let targetW = width
        let targetH = height

        if (width > MAX_SIDE || height > MAX_SIDE) {
          if (width >= height) {
            targetW = MAX_SIDE
            targetH = Math.round((height / width) * MAX_SIDE)
          } else {
            targetH = MAX_SIDE
            targetW = Math.round((width / height) * MAX_SIDE)
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0, targetW, targetH)
        bitmap.close()

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        const base64 = dataUrl.split(',')[1]

        setPreview(dataUrl)
        onImageSelected(base64, 'image/jpeg')
      } catch (err) {
        console.error('Error processing image:', err)
        alert('Could not process that image. Please try a different file.')
      } finally {
        setIsProcessing(false)
      }
    },
    [onImageSelected]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) await processFile(file)
      // Reset input so same file can be re-selected
      e.target.value = ''
    },
    [processFile]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        inputRef.current?.click()
      }
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) await processFile(file)
    },
    [processFile]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        preview
          ? 'Image selected. Tap to replace.'
          : 'Tap here to upload a photo'
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '200px',
        border: `3px dashed ${isDragOver ? '#00D4FF' : '#F5C518'}`,
        borderRadius: '12px',
        backgroundColor: isDragOver ? 'rgba(0,212,255,0.08)' : '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isProcessing ? 'wait' : 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, background-color 0.2s',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {isProcessing ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div
            style={{
              fontSize: '48px',
              marginBottom: '12px',
              animation: 'spin 1s linear infinite',
            }}
          >
            ⏳
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '18px', margin: 0 }}>
            Processing image...
          </p>
        </div>
      ) : preview ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '200px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected textbook page"
            style={{
              width: '100%',
              maxHeight: '320px',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '10px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '18px' }}>✅</span>
            <span style={{ color: '#00FF88', fontSize: '14px', fontWeight: 700 }}>
              Photo selected
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)',
              borderRadius: '8px',
              padding: '4px 14px',
            }}
          >
            <span style={{ color: '#CCCCCC', fontSize: '14px' }}>
              Tap to replace
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px', lineHeight: 1 }}>
            📷
          </div>
          <p
            style={{
              color: '#FFFFFF',
              fontSize: '20px',
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            Tap here to upload a photo
          </p>
          <p
            style={{
              color: '#CCCCCC',
              fontSize: '16px',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Works with iPhone photos (.jpg, .heic, .png)
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
