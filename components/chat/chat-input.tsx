"use client"

import { useState, FormEvent, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, PlusCircle, Mic, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ChatMode } from "./chat-mode-switcher"

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  isWaiting?: boolean;
  setIsWaiting?: (waiting: boolean) => void;
  mode: ChatMode;
}

export function ChatInput({ 
  onSend, 
  disabled = false,
  isWaiting = false,
  setIsWaiting,
  mode = "text"
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(1)
  
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
  
  const handleVoiceButtonClick = () => {
    toast.info("Voice Mode Coming Soon", {
      description: "We're working on adding voice capabilities!"
    });
  };
  
  const isActionDisabled = !message.trim() || disabled || isSubmitting;

  // Different input based on mode
  const renderInput = () => {
    switch (mode) {
      case "text":
        return (
          <>
            {/* Left side buttons */}
            <div className="absolute left-3 bottom-[13px] flex items-center space-x-1 z-10">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground transition-colors"
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
                "flex-1 resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 pl-14 pr-12 py-3 min-h-[50px] max-h-[120px] text-base"
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
                    : "bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg"
                )}
                disabled={isActionDisabled}
              >
                <Send className={cn("h-[18px] w-[18px]", isActionDisabled ? "" : "animate-pulse")} />
              </Button>
            </div>
          </>
        );
      
      case "voice":
        // For voice mode (coming soon)
        return (
          <div className="flex-1 flex items-center justify-center py-3">
            <Button
              type="button"
              size="lg"
              className="rounded-full h-14 w-14 bg-primary/20 hover:bg-primary/30"
              onClick={handleVoiceButtonClick}
            >
              <Mic className="h-6 w-6 text-primary" />
            </Button>
          </div>
        );
      
      case "video":
        // For video mode (disabled)
        return (
          <div className="flex-1 flex items-center justify-center py-3">
            <Button
              type="button"
              size="lg"
              className="rounded-full h-14 w-14 bg-muted opacity-50"
              disabled={true}
            >
              <Video className="h-6 w-6" />
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 py-2.5 shadow-lg">
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
