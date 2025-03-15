"use client"

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isWaiting?: boolean;
  setIsWaiting?: (waiting: boolean) => void;
}

export function ChatInput({ onSend, disabled, isWaiting, setIsWaiting }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || disabled || isSubmitting) return
    
    try {
      setIsSubmitting(true)
      if (setIsWaiting) setIsWaiting(true)
      await onSend(message)
      setMessage("")
    } finally {
      setIsSubmitting(false)
      // We don't set isWaiting to false here because the parent component
      // will handle that when the AI response is received
    }
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="border-t border-border p-4"
    >
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 min-h-[80px] resize-none"
          disabled={disabled || isSubmitting}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || disabled || isSubmitting}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
