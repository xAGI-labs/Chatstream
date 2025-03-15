"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface Conversation {
  id: string;
  title: string;
  character: {
    name: string;
    imageUrl?: string;
  };
  updatedAt: string;
}

export function ConversationList() {
  const { isSignedIn } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isSignedIn) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        const response = await fetch("/api/conversations")
        
        if (!response.ok) {
          throw new Error("Failed to fetch conversations")
        }
        
        const data = await response.json()
        setConversations(data)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchConversations()
  }, [isSignedIn])
  
  if (!isSignedIn) {
    return null
  }
  
  if (loading) {
    return (
      <div className="px-3 py-2">
        <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2 px-2 py-1.5 mb-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }
  
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-2">
        <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>
        <div className="px-2 py-2 text-xs text-gray-400 text-center">
          No conversations yet. Start chatting with a character!
        </div>
      </div>
    )
  }
  
  return (
    <div className="px-3 py-2">
      <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>
      {conversations.slice(0, 5).map((conversation) => {
        const isActive = pathname === `/chat/${conversation.id}`
        
        return (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className={cn(
              "flex items-center px-2 py-1.5 rounded-md text-xs mb-1 hover:bg-[#1a1a1a] transition-colors",
              isActive && "bg-[#1a1a1a] text-white"
            )}
          >
            {conversation.character.imageUrl ? (
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <Image
                  src={conversation.character.imageUrl}
                  alt={conversation.character.name}
                  width={20}
                  height={20}
                  className="object-cover"
                />
              </div>
            ) : (
              <MessageSquare className="w-4 h-4 mr-2" />
            )}
            <span className="truncate">
              {conversation.title || `Chat with ${conversation.character.name}`}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
