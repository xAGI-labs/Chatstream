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
  const { chatId } = useParams()
  const { userId } = useAuth()
  const { conversation, messages, sendMessage, loading } = useConversation(chatId as string)
  const [isWaiting, setIsWaiting] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>("text")
  
  // Debug conversation data
  useEffect(() => {
    if (conversation) {
      console.log("Chat Page - Conversation data:", {
        id: conversation.id,
        title: conversation.title,
        hasCharacter: !!conversation.character,
        characterId: conversation.characterId,
        characterName: conversation.character?.name,
        messagesCount: messages.length
      });
      
      // Log warning if character data is missing
      if (!conversation.character) {
        console.warn("Chat Page - Character data missing in conversation", { 
          conversationId: conversation.id,
          characterId: conversation.characterId 
        });
      }
    }
  }, [conversation, messages]);

  // Authentication check
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
  
  // Prepare character data for components with proper type handling
  const characterData = conversation?.character 
    ? {
        name: conversation.character.name,
        // Convert null to undefined for imageUrl to satisfy ChatHeader props
        imageUrl: conversation.character.imageUrl || undefined
      }
    : (conversation?.characterId 
        ? {
            id: conversation.characterId,
            name: "AI Assistant", // Placeholder name while character loads
            imageUrl: undefined
          } 
        : undefined);
  
  return (
    <div className="flex h-screen overflow-hidden bg-muted/10">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Chat Header - pass loading as boolean */}
        <ChatHeader 
          character={characterData}
          title={conversation?.title}
          loading={!!loading} // Ensure it's boolean
        />
        
        {/* Mode Switcher - now positioned below header with improved styling */}
        <div className="bg-background/70 backdrop-blur-sm border-b border-border/40 py-1.5 shadow-sm">
          <div className="container max-w-4xl mx-auto px-4">
            <ChatModeSwitcher mode={chatMode} setMode={setChatMode} />
          </div>
        </div>
        
        {/* Messages Area with gradient background for visual interest */}
        <div className="flex-1 overflow-hidden relative bg-gradient-to-b from-background to-background/95">
          <div className="absolute inset-0 overflow-y-auto">
            <ChatMessages 
              messages={messages} 
              loading={loading === true} // Ensure boolean type
              isWaiting={!!isWaiting} // Ensure boolean type
              character={characterData}
            />
          </div>
        </div>
        
        {/* Chat Input */}
        <ChatInput 
          onSend={async (content) => {
            await sendMessage(content)
            setIsWaiting(false)
          }}
          disabled={loading === true} // Ensure boolean type
          isWaiting={!!isWaiting} // Ensure boolean type
          setIsWaiting={setIsWaiting}
          mode={chatMode}
          characterId={conversation?.characterId} // Make sure this is passed correctly
        />
      </div>
    </div>
  )
}
