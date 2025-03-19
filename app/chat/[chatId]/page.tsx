"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatModeSwitcher, ChatMode } from "@/components/chat/chat-mode-switcher"
import { useConversation } from "@/hooks/use-conversation"

export default function ChatPage() {
  const params = useParams()
  const chatId = params?.chatId as string
  const { isLoaded, isSignedIn } = useAuth()
  const [isWaiting, setIsWaiting] = useState(false)
  const [mode, setMode] = useState<ChatMode>("text")
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  
  const { conversation, messages, loading, sendMessage, sendAIMessage } = useConversation(chatId)
  
  const handleSendMessage = async (content: string, isUserMessage: boolean = true) => {
    setIsWaiting(true)
    
    if (isUserMessage) {
      await sendMessage(content)
    } else {
      await sendAIMessage(content)
    }
    
    setIsWaiting(false)
  }
  
  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-muted-foreground/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading conversation...</p>
        </div>
      </div>
    )
  }
  
  // Properly convert any potential null or empty values to boolean
  const isLoadingState = loading === true
  const isDisabledState = loading === true
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader 
          title={conversation?.title} 
          character={conversation?.character} 
          loading={isLoadingState} 
        />
        <div className="border-t border-border px-4 py-2">
          <ChatModeSwitcher mode={mode} setMode={setMode} />
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4">
          <ChatMessages 
            messages={messages} 
            loading={isLoadingState} 
            isWaiting={isWaiting}
            character={conversation?.character}
            mode={mode}
            isAISpeaking={isAISpeaking}
          />
        </div>
        <div className="p-4">
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={isDisabledState}
            isWaiting={isWaiting} 
            setIsWaiting={setIsWaiting}
            mode={mode}
            characterId={conversation?.characterId || ""}
            setIsAISpeaking={setIsAISpeaking}
          />
        </div>
      </div>
    </div>
  )
}
