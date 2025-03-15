"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { useConversation } from "@/hooks/use-conversation"

export default function ChatPage() {
  const { chatId } = useParams()
  const { userId } = useAuth()
  const { conversation, messages, sendMessage, loading } = useConversation(chatId as string)
  const [isWaiting, setIsWaiting] = useState(false)
  
  if (!userId) {
    return <div className="flex h-screen items-center justify-center">Please sign in to continue</div>
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Chat Header */}
        <ChatHeader 
          character={conversation?.character} 
          title={conversation?.title}
          loading={loading}
        />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <ChatMessages 
            messages={messages} 
            loading={loading}
            isWaiting={isWaiting}
            character={conversation?.character}
          />
        </div>
        
        {/* Chat Input */}
        <ChatInput 
          onSend={async (content) => {
            await sendMessage(content)
            setIsWaiting(false)
          }}
          disabled={loading} 
          isWaiting={isWaiting}
          setIsWaiting={setIsWaiting}
        />
      </div>
    </div>
  )
}
