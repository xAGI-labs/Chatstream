"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ChatMode } from "./chat-mode-switcher"
import { VoiceChat } from "./voice-chat"
import { VoiceInteraction } from "./voice-interaction"

interface ChatInputProps {
  onSend: (content: string, isUserMessage?: boolean) => Promise<void>;
  disabled?: boolean; 
  isWaiting?: boolean;
  setIsWaiting?: (waiting: boolean) => void;
  mode: ChatMode;
  characterId?: string;
}

export function ChatInput({ 
  onSend, 
  disabled = false,
  isWaiting = false,
  setIsWaiting,
  mode = "text",
  characterId = ""
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(1)
  
  // For voice UI state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [lastAIMessage, setLastAIMessage] = useState("");
  
  // Add debugging
  useEffect(() => {
    console.log("ChatInput props:", {
      disabled: !!disabled,
      isWaiting: !!isWaiting,
      mode
    });
  }, [disabled, isWaiting, mode]);
  
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      
      // Calculate new height based on scrollHeight
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 40), // Min height 40px
        120 // Max height 120px
      );
      
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Update number of rows based on height
      setRows(Math.min(5, Math.max(1, Math.floor(newHeight / 24))));
    }
  }, [message]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isSubmitting) return
    
    try {
      setIsSubmitting(true)
      if (setIsWaiting) setIsWaiting(true)
      await onSend(message, true) // Always true for text input (it's a user message)
      setMessage("")
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
      setRows(1);
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Add functions to update voice UI state that can be passed to VoiceChat
  const handleVoiceStateChange = (
    recording: boolean, 
    processing: boolean, 
    responding: boolean,
    time: number = 0,
    userMsg: string = "",
    aiMsg: string = ""
  ) => {
    setIsRecording(recording);
    setIsProcessing(processing);
    setIsResponding(responding);
    setRecordingTime(time);
    if (userMsg) setLastUserMessage(userMsg);
    if (aiMsg) setLastAIMessage(aiMsg);
  };
  
  // Different input based on mode
  const renderInput = () => {
    if (mode === "voice") {
      // Make sure we have a valid characterId before rendering voice chat
      if (!characterId) {
        console.error("Missing characterId in chat-input for voice mode");
      }
      
      console.log("Rendering voice chat with characterId:", characterId);
      
      return (
        <div className="flex w-full items-center justify-center py-4">
          <VoiceChat 
            disabled={disabled}
            characterId={characterId}
            onMessageSent={onSend}
            isWaiting={isWaiting}
            onVoiceStateChange={handleVoiceStateChange}
          />
        </div>
      )
    }
    
    // Default to text mode
    return (
      <>
        <Textarea
          ref={textareaRef}
          placeholder="Type your message..."
          rows={rows}
          className="min-h-[60px] border-0 focus-visible:ring-0 resize-none py-4 px-4 shadow-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          disabled={disabled || isWaiting}
        />
        <div className="absolute right-4 bottom-3.5 flex items-center">
          <Button
            type="submit"
            size="icon"
            disabled={message.trim() === "" || disabled || isWaiting}
            className={cn(
              "rounded-full",
              isWaiting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 py-2.5 shadow-lg">
      {/* Voice interaction UI overlay - only shown in voice mode */}
      {mode === "voice" && (isRecording || isProcessing || isResponding) && (
        <VoiceInteraction
          isRecording={isRecording}
          isProcessing={isProcessing}
          isResponding={isResponding}
          recordingTime={recordingTime}
          characterName={characterId ? "AI Assistant" : undefined}
          lastUserMessage={lastUserMessage}
          lastAIMessage={lastAIMessage}
        />
      )}
      
      <form 
        onSubmit={handleSubmit} 
        className="container max-w-4xl mx-auto px-4"
      >
        <div className="relative flex items-end rounded-2xl border bg-background shadow-sm overflow-hidden transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
          {renderInput()}
        </div>
        
        <div className="mt-1.5 px-1">
          <p className="text-[10px] text-center text-muted-foreground/70">
            Responses are AI-generated. Messages may be reviewed to improve our systems.
          </p>
        </div>
      </form>
    </div>
  )
}
