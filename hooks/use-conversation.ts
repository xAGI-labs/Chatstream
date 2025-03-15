"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
  conversationId: string;
}

interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title?: string;
  character: Character;
  createdAt: Date;
}

export function useConversation(chatId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchConversation = async () => {
      if (!userId || !chatId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/conversations/${chatId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Conversation not found")
            router.push("/")
            return
          }
          throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        setConversation(data)
        setMessages(data.messages)
      } catch (error) {
        console.error("Error fetching conversation:", error)
        toast.error("Failed to load conversation", {
          description: "Please try again later"
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (chatId && userId) {
      fetchConversation()
    }
  }, [chatId, userId, router])
  
  const sendMessage = async (content: string) => {
    if (!userId || !chatId || !content.trim()) return
    
    // Optimistically add the user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      role: "user",
      createdAt: new Date(),
      conversationId: chatId
    }
    
    setMessages(prev => [...prev, userMessage])
    
    try {
      const response = await fetch(`/api/conversations/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Replace the optimistic message and add the AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== userMessage.id)
        return [...filtered, data.userMessage, data.aiMessage]
      })
    } catch (error) {
      console.error("Error sending message:", error)
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id))
      
      toast.error("Failed to send message", {
        description: "Please try again"
      })
    }
  }
  
  return { conversation, messages, sendMessage, loading }
}
