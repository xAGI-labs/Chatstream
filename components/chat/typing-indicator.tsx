"use client"

import { cn } from "@/lib/utils"

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-1">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "0ms" }}></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "300ms" }}></div>
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "600ms" }}></div>
      </div>
    </div>
  )
}
