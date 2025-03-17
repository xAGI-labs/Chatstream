"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Smile, Mic, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isWaiting?: boolean;
  setIsWaiting?: (waiting: boolean) => void;
}

export function ChatInput({ onSend, disabled, isWaiting, setIsWaiting }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(1)
  
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
      await onSend(message)
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
  
  const isActionDisabled = !message.trim() || disabled || isSubmitting;

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 py-3">
      <form 
        onSubmit={handleSubmit} 
        className="container max-w-4xl mx-auto px-4"
      >
        <div className="relative flex items-end rounded-2xl border bg-background shadow-sm">
          {/* Left side buttons */}
          <div className="absolute left-3 bottom-[13px] flex items-center space-x-1 z-10">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <PlusCircle className="h-[18px] w-[18px]" />
            </Button>
          </div>
          
          {/* Textarea with padding for buttons */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className={cn(
              "flex-1 resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 pl-14 pr-12 py-3 min-h-[50px] max-h-[120px]"
            )}
            rows={rows}
            disabled={disabled || isSubmitting}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          
          {/* Right side button */}
          <div className="absolute right-3 bottom-[13px] z-10">
            <Button 
              type="submit" 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full transition-all flex items-center justify-center",
                isActionDisabled 
                  ? "bg-muted hover:bg-muted text-muted-foreground"
                  : "bg-primary hover:bg-primary/90"
              )}
              disabled={isActionDisabled}
            >
              <Send className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
        
        <div className="mt-2 px-1">
          <p className="text-[10px] text-center text-muted-foreground/80">
            Responses are AI-generated. Messages may be reviewed to improve our systems.
          </p>
        </div>
      </form>
    </div>
  )
}
