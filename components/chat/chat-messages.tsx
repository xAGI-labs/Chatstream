import { useEffect, useRef } from "react"
import Image from "next/image"
import { Message } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  if (loading) {
    return (
      <div className="space-y-4">
        <MessageSkeleton />
        <MessageSkeleton fromUser />
        <MessageSkeleton />
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div 
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2",
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}
          >
            {message.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageSkeleton({ fromUser = false }) {
  return (
    <div className={cn("flex", fromUser ? "justify-end" : "justify-start")}>
      <Skeleton 
        className={cn(
          "h-10 max-w-[80%] rounded-lg",
          fromUser ? "w-48" : "w-64"
        )} 
      />
    </div>
  )
}
