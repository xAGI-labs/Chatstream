"use client"

import { cn } from "@/lib/utils"

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted px-4 py-2 rounded-lg flex items-center space-x-1">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "300ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" 
             style={{ animationDelay: "600ms" }}></div>
      </div>
    </div>
  )
}
