"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VoiceChatProps {
  characterId: string;
  onMessageSent: (content: string, isUserMessage?: boolean) => Promise<void>;
  disabled: boolean;
  isWaiting: boolean;
  onVoiceStateChange?: (
    isRecording: boolean, 
    isProcessing: boolean, 
    isResponding: boolean,
    recordingTime?: number,
    userMessage?: string,
    aiMessage?: string
  ) => void;
}

export function VoiceChat({ 
  characterId, 
  onMessageSent, 
  disabled,
  isWaiting,
  onVoiceStateChange
}: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [lastUserMessage, setLastUserMessage] = useState("")
  const [lastAIMessage, setLastAIMessage] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { userId } = useAuth()

  // Debug information
  useEffect(() => {
    console.log("VoiceChat props:", { characterId, disabled, isWaiting })
  }, [characterId, disabled, isWaiting])

  // Update the parent component with state changes
  useEffect(() => {
    if (onVoiceStateChange) {
      onVoiceStateChange(
        isRecording, 
        isProcessing, 
        isResponding,
        recordingTime,
        lastUserMessage,
        lastAIMessage
      );
    }
  }, [isRecording, isProcessing, isResponding, recordingTime, lastUserMessage, lastAIMessage, onVoiceStateChange]);

  const startRecording = async () => {
    try {
      console.log("Starting voice recording...")
      
      // Reset state
      audioChunksRef.current = []
      setRecordingTime(0)
      
      // Request microphone access
      console.log("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      console.log("Microphone access granted")
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Most compatible format for OpenAI
      })
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("Received audio data chunk of size:", event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log("Recording stopped")
        console.log("Number of audio chunks:", audioChunksRef.current.length)
        
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio was recorded", {
            description: "Please try again and speak clearly"
          })
          return
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log("Audio blob created, size:", audioBlob.size)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
        
        // Process the audio
        processAudio(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      
      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      console.log("Recording started successfully")
      
    } catch (error: unknown) {
      console.error("Error starting recording:", error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unknown error";
        
      toast.error("Could not access microphone", {
        description: errorMessage
      })
    }
  }
  
  const stopRecording = () => {
    console.log("Stopping recording...")
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    } else {
      console.warn("No active recording to stop")
    }
  }
  
  const processAudio = async (audioBlob: Blob) => {
    // Log values for debugging
    console.log("Processing audio with:", {
      userId: userId,
      characterId: characterId,
      blobSize: audioBlob.size
    });
    
    if (!userId) {
      toast.error("You need to be signed in", {
        description: "Please sign in to use voice chat"
      });
      return;
    }
    
    if (!characterId) {
      console.error("Missing characterId in VoiceChat component");
      toast.error("Character information missing", {
        description: "Please refresh the page or try a different character"
      });
      return;
    }
    
    try {
      console.log("Processing audio blob, size:", audioBlob.size)
      setIsProcessing(true)
      
      // Create form data to send to API
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.webm')
      formData.append('character_id', characterId)
      
      console.log(`Sending audio to API for processing (characterId: ${characterId})...`)
      
      // Call our API endpoint
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(errorText || response.statusText)
      }
      
      const data = await response.json()
      console.log("API response:", data)
      
      // Update last messages for display
      if (data.user_text) {
        setLastUserMessage(data.user_text)
        await onMessageSent(data.user_text, true)
      }
      
      if (data.ai_text) {
        setLastAIMessage(data.ai_text)
      }
      
      // Play audio response
      if (data.audio_data) {
        console.log("Playing audio response")
        setIsProcessing(false)
        setIsResponding(true)
        
        const responseAudio = new Audio(data.audio_data)
        
        // When audio ends, reset responding state
        responseAudio.addEventListener('ended', () => {
          setIsResponding(false)
        })
        
        responseAudio.play()
        
        // Update conversation UI with AI text
        if (data.ai_text) {
          await onMessageSent(data.ai_text)
        }
      } else {
        console.error("No audio data in response")
        setIsProcessing(false)
        throw new Error("No audio response received")
      }
      
    } catch (error: unknown) {
      console.error("Error processing audio:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Please try again"
      toast.error("Error processing voice", {
        description: errorMessage
      })
      setIsProcessing(false)
      setIsResponding(false)
    }
  }
  
  // Clean up on component unmount or when mode changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Reset states
      setIsRecording(false)
      setIsProcessing(false)
      setIsResponding(false)
    }
  }, [])
  
  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {!isRecording ? (
        <Button
          type="button"
          onClick={startRecording}
          disabled={disabled || isProcessing || isWaiting || isResponding}
          className={cn(
            "rounded-full h-14 w-14 bg-primary hover:bg-primary/90 text-primary-foreground",
            (disabled || isProcessing || isWaiting || isResponding) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      ) : (
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium mb-2 text-red-500">
            {formatTime(recordingTime)}
          </div>
          <Button
            type="button"
            onClick={stopRecording}
            className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {isRecording ? (
          "Recording... Click to stop"
        ) : isProcessing ? (
          "Processing your message..."
        ) : isResponding ? (
          "AI is responding..."
        ) : (
          "Click to start speaking"
        )}
      </div>
    </div>
  )
}
