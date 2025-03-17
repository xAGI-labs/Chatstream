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
      
      // Calculate new height based on scrollHeight + border
      const newHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${newHeight}px`;
      
      // Update number of rows
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
        textareaRef.current.style.height = 'auto';
      }
      setRows(1);
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const isActionDisabled = !message.trim() || disabled || isSubmitting;

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10">
      <form 
        onSubmit={handleSubmit} 
        className="container max-w-4xl mx-auto px-4 py-3"
      >
        <div className="flex items-end gap-2 bg-card rounded-xl border p-1 pr-2 shadow-sm">
          <div className="flex items-center pl-1 space-x-1">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className={cn(
              "flex-1 resize-none bg-transparent rounded-lg border-0 shadow-none focus-visible:ring-0 focus-visible:ring-transparent p-2", 
              rows > 1 ? "h-auto" : "h-10"
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
          
          <div className="flex-shrink-0 flex items-center">
            {!message.trim() && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground mr-1"
                disabled={disabled}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            
            <Button 
              type="submit" 
              size="sm" 
              className={cn(
                "h-8 px-3 rounded-full transition-all",
                isActionDisabled 
                  ? "bg-muted hover:bg-muted text-muted-foreground"
                  : "bg-primary hover:bg-primary/90"
              )}
              disabled={isActionDisabled}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-1.5 px-2">
          <p className="text-[10px] text-center text-muted-foreground">
            Responses are AI-generated. Messages may be reviewed to improve our systems.
          </p>
        </div>
      </form>
    </div>
  )
}
