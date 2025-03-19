"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AudioWaveform } from "./audio-waveform"

interface VoiceChatProps {
  characterId: string;
  onMessageSent: (message: string, isUserMessage?: boolean) => void;
  disabled?: boolean;
  isWaiting?: boolean;
  setIsAISpeaking?: (speaking: boolean) => void;
}

export function VoiceChat({
  characterId,
  onMessageSent,
  disabled = false,
  isWaiting = false,
  setIsAISpeaking
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)
  
  // Create audio element for playback
  useEffect(() => {
    audioRef.current = new Audio()
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
  
  // Audio visualization function
  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateAudioLevel = () => {
      analyserRef.current?.getByteFrequencyData(dataArray)
      
      // Calculate average level
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
      setAudioLevel(Math.min(100, average * 2)) // Scale up for better visual
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Setup audio context for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
      }
      
      // Fix the TypeScript error by adding a null check
      const source = audioContextRef.current.createMediaStreamSource(stream)
      if (analyserRef.current) {
        source.connect(analyserRef.current)
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = handleAudioSend
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      visualizeAudio()
      
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast.error("Could not access microphone", {
        description: "Please check your browser permissions"
      })
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }
  
  const handleAudioSend = async () => {
    if (audioChunksRef.current.length === 0) return
    
    setIsProcessing(true)
    
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      
      // Create form data
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('characterId', characterId)
      
      // Send to API
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Play the audio response
      if (data.audio_data && audioRef.current) {
        audioRef.current.src = data.audio_data
        audioRef.current.play()
      }
      
      // Send both user text and AI response to chat
      if (data.user_text) {
        // Send the user's speech as a user message
        onMessageSent(data.user_text, true) // true indicates it's a user message
      }
      
      if (data.ai_text) {
        // Send the AI response as an assistant message
        onMessageSent(data.ai_text, false) // false indicates it's an AI message
      }
      
    } catch (error) {
      console.error("Error processing voice:", error)
      toast.error("Error processing voice", {
        description: "Please try again"
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Render different button states
  const renderButton = () => {
    if (isProcessing) {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      )
    }
    
    if (isRecording) {
      return (
        <>
          <div 
            className="absolute inset-0 rounded-full animate-pulse bg-primary/10"
            style={{
              transform: `scale(${1 + audioLevel / 100})`,
              opacity: 0.5
            }}
          ></div>
          <Button 
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16 flex items-center justify-center z-10"
            disabled={disabled}
          >
            <Square className="h-6 w-6" />
          </Button>
        </>
      )
    }
    
    return (
      <Button
        onClick={startRecording}
        size="lg"
        variant="outline"
        className="rounded-full w-16 h-16 flex items-center justify-center border-primary"
        disabled={disabled || isWaiting}
      >
        <Mic className="h-6 w-6 text-primary" />
      </Button>
    )
  }
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        {renderButton()}
      </div>
      
      <div className="mt-2 text-sm text-center">
        {isRecording 
          ? "Recording... Click to stop" 
          : isProcessing
            ? "Processing..."
            : "Tap to speak"}
      </div>
    </div>
  )
}
