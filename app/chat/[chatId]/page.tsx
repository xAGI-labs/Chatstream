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
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="bg-card p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your conversations.</p>
          <a href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg inline-block hover:bg-primary/90 transition-colors">
            Return to Home
          </a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Chat Header */}
        <ChatHeader 
          character={conversation?.character} 
          title={conversation?.title}
          loading={loading}
        />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto">
            <ChatMessages 
              messages={messages} 
              loading={loading}
              isWaiting={isWaiting}
              character={conversation?.character}
            />
          </div>
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
