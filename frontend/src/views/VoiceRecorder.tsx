import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, AlertCircle, Globe } from 'lucide-react'

interface VoiceRecorderProps {
  onAudioRecorded: (blob: Blob, transcript?: string) => Promise<void>
  disabled?: boolean
  isProcessing?: boolean
}

const SPEECH_MODES = [
  { code: 'en-IN', label: 'Auto', title: 'Auto-Detect (English & Roman Hinglish)' },
  { code: 'hi-IN', label: 'हिं', title: 'Hindi (Devanagari Script)' },
  { code: 'gu-IN', label: 'ગુ', title: 'Gujarati (ગુજરાતી)' },
  { code: 'mr-IN', label: 'म', title: 'Marathi (मराठी)' },
  { code: 'ta-IN', label: 'த', title: 'Tamil (தமிழ்)' },
]

export const VoiceRecorder = ({
  onAudioRecorded,
  disabled = false,
  isProcessing = false,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [timer, setTimer] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [interimText, setInterimText] = useState('')
  const [modeIndex, setModeIndex] = useState(0)

  const currentMode = SPEECH_MODES[modeIndex]

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const speechRecognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef<string>('')
  const chunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  const cycleSpeechMode = () => {
    setModeIndex((prev) => (prev + 1) % SPEECH_MODES.length)
  }

  const startRecording = async () => {
    setErrorMsg(null)
    setInterimText('')
    finalTranscriptRef.current = ''
    chunksRef.current = []

    try {
      // 1. Check microphone access via MediaDevices
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 2. Setup audio MIME type (WebM / Opus)
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4'
        else mimeType = ''
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }
        // Wait 150ms for Web Speech API to flush any final onresult buffer
        await new Promise((resolve) => setTimeout(resolve, 150))

        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const transcript = finalTranscriptRef.current.trim()

        if (audioBlob.size > 0) {
          await onAudioRecorded(audioBlob, transcript || undefined)
        }
      }

      // 3. Setup client-side Web Speech Recognition for instant 0-latency multilingual transcription
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = currentMode.code

          recognition.onresult = (event: any) => {
            const segments: string[] = []
            for (let i = 0; i < event.results.length; ++i) {
              const part = event.results[i][0]?.transcript?.trim()
              if (part) segments.push(part)
            }
            const combined = segments.join(' ').trim()
            if (combined) {
              finalTranscriptRef.current = combined
              setInterimText(combined)
            }
          }

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition notice:', e.error)
          }

          recognition.start()
          speechRecognitionRef.current = recognition
        } catch (e) {
          console.warn('Web Speech API initialization fallback:', e)
        }
      }

      recorder.start(100)
      setIsRecording(true)
      setTimer(0)

      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Microphone error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Mic access denied. Please click the lock icon in the address bar to allow.')
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No microphone detected on your device.')
      } else {
        setErrorMsg('Microphone error: ' + (err.message || 'Access failed'))
      }
    }
  }

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop()
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-1">
      {errorMsg && (
        <span className="text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 mr-1.5 flex items-center space-x-1 max-w-xs truncate">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span title={errorMsg}>{errorMsg}</span>
        </span>
      )}

      {isRecording ? (
        <div className="flex items-center space-x-2.5 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full shadow-xs">
          {/* Animated 5-Bar Soundwave */}
          <div className="flex items-center space-x-1 h-5">
            <span className="w-1 bg-emerald-600 rounded-full animate-wave-1"></span>
            <span className="w-1 bg-emerald-600 rounded-full animate-wave-2"></span>
            <span className="w-1 bg-emerald-600 rounded-full animate-wave-3"></span>
            <span className="w-1 bg-emerald-600 rounded-full animate-wave-4"></span>
            <span className="w-1 bg-emerald-600 rounded-full animate-wave-5"></span>
          </div>

          <span className="font-mono text-xs font-bold text-emerald-800">
            {formatTimer(timer)}
          </span>

          {interimText && (
            <span className="text-[11px] text-emerald-700 italic max-w-30 truncate hidden sm:inline-block">
              "{interimText}"
            </span>
          )}

          <button
            type="button"
            onClick={stopRecording}
            className="p-1 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs cursor-pointer"
            title="Stop & send speech to AI"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
          </button>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-800 text-xs font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          <span>Auto-LID Voice...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition disabled:opacity-50 cursor-pointer"
            title={`Speak now (${currentMode.title})`}
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={cycleSpeechMode}
            disabled={disabled}
            className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 text-[10px] font-bold flex items-center space-x-0.5 transition cursor-pointer"
            title={`Speech Script Mode: ${currentMode.title} (Click to switch Auto / हिं / ગુ / म / த)`}
          >
            <Globe className="w-2.5 h-2.5 text-emerald-600" />
            <span>{currentMode.label}</span>
          </button>
        </div>
      )}
    </div>
  )
}
