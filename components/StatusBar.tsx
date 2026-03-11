'use client'

type StatusType = 'idle' | 'extracting' | 'converting' | 'done' | 'error'

interface StatusBarProps {
  status: StatusType
  errorMessage?: string
}

const STATUS_CONFIG: Record<
  StatusType,
  { icon: string; message: string; color: string; showBar: boolean; barDone: boolean }
> = {
  idle: {
    icon: '',
    message: '',
    color: '#CCCCCC',
    showBar: false,
    barDone: false,
  },
  extracting: {
    icon: '🧠',
    message: 'Reading your textbook page...',
    color: '#F5C518',
    showBar: true,
    barDone: false,
  },
  converting: {
    icon: '🎙',
    message: 'Converting to audio...',
    color: '#00D4FF',
    showBar: true,
    barDone: false,
  },
  done: {
    icon: '✅',
    message: 'Your podcast is ready!',
    color: '#00FF88',
    showBar: true,
    barDone: true,
  },
  error: {
    icon: '❌',
    message: 'Error',
    color: '#FF4444',
    showBar: false,
    barDone: false,
  },
}

export default function StatusBar({ status, errorMessage }: StatusBarProps) {
  const config = STATUS_CONFIG[status]

  return (
    <>
      {/* Fixed top progress bar */}
      <div className="progress-bar-container">
        {config.showBar && (
          <div
            className={`progress-bar-fill ${config.barDone ? 'done' : 'animating'}`}
          />
        )}
      </div>

      {/* Status message — only rendered when not idle */}
      {status !== 'idle' && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            backgroundColor: '#1A1A2E',
            borderRadius: '10px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `2px solid ${config.color}`,
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{config.icon}</span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: config.color,
              lineHeight: 1.3,
            }}
          >
            {status === 'error'
              ? `${config.icon} ${errorMessage ?? 'Something went wrong. Please try again.'}`
              : `${config.message}`}
          </span>
        </div>
      )}
    </>
  )
}
