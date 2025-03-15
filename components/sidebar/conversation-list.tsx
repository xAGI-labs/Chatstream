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

interface ConversationListProps {
  isCollapsed?: boolean;
}

export function ConversationList({ isCollapsed = false }: ConversationListProps) {
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
        {!isCollapsed && <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={cn(
            "flex items-center space-x-2 py-1.5 mb-1",
            isCollapsed ? "justify-center px-0" : "px-2"
          )}>
            <Skeleton className="h-5 w-5 rounded-full" />
            {!isCollapsed && <Skeleton className="h-4 w-full" />}
          </div>
        ))}
      </div>
    )
  }
  
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-2">
        {!isCollapsed && (
          <>
            <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>
            <div className="px-2 py-2 text-xs text-gray-400 text-center">
              No conversations yet. Start chatting with a character!
            </div>
          </>
        )}
      </div>
    )
  }
  
  return (
    <div className="px-3 py-2">
      {!isCollapsed && <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Recent Chats</h3>}
      {conversations.slice(0, 5).map((conversation) => {
        const isActive = pathname === `/chat/${conversation.id}`
        
        // Just use the imageUrl directly - no need to convert it
        // It's either a Together-generated image path or already a fallback
        const imageUrl = conversation.character.imageUrl || 
          `https://robohash.org/${encodeURIComponent(conversation.character.name)}?size=20x20&set=set4`;
        
        return (
          <Link
            key={conversation.id}
            href={`/chat/${conversation.id}`}
            className={cn(
              "flex items-center py-1.5 rounded-md text-xs mb-1 hover:bg-[#1a1a1a] transition-colors",
              isCollapsed ? "justify-center px-1" : "px-2",
              isActive && "bg-[#1a1a1a] text-white"
            )}
            title={isCollapsed ? conversation.character.name : undefined}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={imageUrl}
                alt={conversation.character.name}
                width={20}
                height={20}
                className="object-cover"
                unoptimized
              />
            </div>
            {!isCollapsed && (
              <span className="truncate ml-2">
                {conversation.title || `${conversation.character.name}`}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
