'use client'

interface StatusBarProps {
  status: 'idle' | 'uploading' | 'extracting' | 'converting' | 'stitching' | 'done' | 'error'
  errorMessage?: string
  progress?: number // 0-100
}

const STATUS_MESSAGES: Record<string, string> = {
  uploading: '📷 Got your photos — reading the content...',
  extracting: '🧠 Writing your debate script...',
  converting: '🎙 Recording the hosts...',
  stitching: '🎬 Mixing the audio...',
  done: '✅ Your podcast is ready!',
}

const isActive = (status: string) =>
  ['uploading', 'extracting', 'converting', 'stitching'].includes(status)

export default function StatusBar({ status, errorMessage, progress }: StatusBarProps) {
  const showBar = status !== 'idle'
  const active = isActive(status)
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <>
      {/* Fixed top progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '6px',
          backgroundColor: '#1A1A2E',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {showBar && (
          <div
            className={active ? 'progress-bar-animated' : undefined}
            style={{
              position: 'absolute',
              top: 0,
              left: isDone ? '0' : active ? '0' : '0',
              height: '6px',
              width: isDone ? '100%' : progress != null ? `${progress}%` : '40%',
              backgroundColor: isDone ? '#00FF88' : '#F5C518',
              borderRadius: '0 3px 3px 0',
              transition: isDone ? 'width 0.4s ease' : undefined,
            }}
          />
        )}
      </div>

      {/* Status message */}
      {status !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '20px',
            border: `2px solid ${isError ? '#FF4444' : isDone ? '#00FF88' : '#F5C518'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: isError ? '#FF4444' : isDone ? '#00FF88' : '#F5C518',
              lineHeight: 1.5,
            }}
          >
            {isError
              ? `❌ ${errorMessage ?? 'Something went wrong. Please try again.'}`
              : STATUS_MESSAGES[status] ?? ''}
          </span>
        </div>
      )}
    </>
  )
}
