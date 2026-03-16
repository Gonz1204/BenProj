'use client'

import { useRef, useState, useCallback } from 'react'

interface ImageItem {
  base64: string
  mimeType: string
  previewUrl: string
}

interface UploadZoneProps {
  images: ImageItem[]
  onImagesChange: (images: ImageItem[]) => void
}

async function processFile(file: File): Promise<ImageItem> {
  let processedBlob: Blob = file
  let outputMimeType = file.type || 'image/jpeg'

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
    processedBlob = Array.isArray(converted) ? converted[0] : converted
    outputMimeType = 'image/jpeg'
  }

  const bitmap = await createImageBitmap(processedBlob)
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

  return { base64, mimeType: outputMimeType === 'image/heic' || outputMimeType === 'image/heif' ? 'image/jpeg' : outputMimeType, previewUrl: dataUrl }
}

export default function UploadZone({ images, onImagesChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addMoreRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loadingCount, setLoadingCount] = useState(0)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      setLoadingCount(fileArray.length)
      try {
        const processed = await Promise.all(fileArray.map(processFile))
        onImagesChange([...images, ...processed])
      } catch (err) {
        console.error('Error processing images:', err)
        alert('Could not process one or more images. Please try different files.')
      } finally {
        setLoadingCount(0)
      }
    },
    [images, onImagesChange]
  )

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        await handleFiles(e.target.files)
      }
      e.target.value = ''
    },
    [handleFiles]
  )

  const handleZoneClick = useCallback(() => {
    if (images.length === 0) {
      inputRef.current?.click()
    }
  }, [images.length])

  const handleZoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && images.length === 0) {
        e.preventDefault()
        inputRef.current?.click()
      }
    },
    [images.length]
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index)
      onImagesChange(updated)
    },
    [images, onImagesChange]
  )

  const isLoading = loadingCount > 0

  return (
    <div>
      {/* Drop zone — only shown when no images yet */}
      {images.length === 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tap here to upload photos"
          onClick={handleZoneClick}
          onKeyDown={handleZoneKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            minHeight: '220px',
            border: `3px dashed ${isDragOver ? '#00D4FF' : '#F5C518'}`,
            borderRadius: '12px',
            backgroundColor: isDragOver ? 'rgba(0,212,255,0.08)' : '#1A1A2E',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isLoading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s, background-color 0.2s',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
              <p style={{ color: '#CCCCCC', fontSize: '18px', margin: 0 }}>
                Processing {loadingCount} photo{loadingCount > 1 ? 's' : ''}...
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: '52px', marginBottom: '12px', lineHeight: 1 }}>📷</div>
              <p style={{ color: '#FFFFFF', fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0' }}>
                Tap here to upload photos
              </p>
              <p style={{ color: '#CCCCCC', fontSize: '18px', margin: 0, lineHeight: 1.5 }}>
                Select multiple pages at once
              </p>
              <p style={{ color: '#CCCCCC', fontSize: '16px', margin: '6px 0 0 0' }}>
                Supports .jpg, .png, .heic
              </p>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail grid — shown when images exist */}
      {images.length > 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            backgroundColor: isDragOver ? 'rgba(0,212,255,0.05)' : 'transparent',
            border: isDragOver ? '2px dashed #00D4FF' : '2px dashed transparent',
            borderRadius: '12px',
            padding: '4px',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            {images.map((img, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#1A1A2E',
                  aspectRatio: '3/4',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Textbook page ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => handleRemove(index)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    border: '2px solid #FF4444',
                    borderRadius: '50%',
                    color: '#FF4444',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    color: '#CCCCCC',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Loading placeholder tiles */}
            {isLoading &&
              Array.from({ length: loadingCount }).map((_, i) => (
                <div
                  key={`loading-${i}`}
                  style={{
                    borderRadius: '8px',
                    backgroundColor: '#1A1A2E',
                    aspectRatio: '3/4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #444444',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⏳</span>
                </div>
              ))}
          </div>

          {/* Add more button */}
          <button
            type="button"
            onClick={() => addMoreRef.current?.click()}
            disabled={isLoading}
            style={{
              width: '100%',
              minHeight: '64px',
              backgroundColor: 'transparent',
              border: '2px solid #F5C518',
              borderRadius: '10px',
              color: '#F5C518',
              fontSize: '20px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isLoading ? 0.5 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            + ADD MORE PHOTOS
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={addMoreRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
