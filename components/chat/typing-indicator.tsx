"use client"

import { cn } from "@/lib/utils"

export function TypingIndicator() {
  return (
    <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] sm:max-w-[70%]">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5 items-center">
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "300ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" 
               style={{ animationDuration: "1.2s", animationDelay: "600ms" }}></div>
        </div>
        <span className="text-xs text-muted-foreground">Typing...</span>
      </div>
    </div>
  )
}
