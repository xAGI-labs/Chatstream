"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCharacter } from "@/hooks/use-character"

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: Date;
  conversationId: string;
}

// Updated Character interface to match useCharacter hook's interface
interface Character {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

interface Conversation {
  id: string;
  title?: string;
  character?: Character;
  characterId: string; 
  createdAt: Date;
}

export function useConversation(chatId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [characterId, setCharacterId] = useState<string | null>(null)
  const { userId } = useAuth()
  const router = useRouter()
  
  // Use the character hook to fetch character data separately if needed
  const { character: fetchedCharacter, loading: characterLoading } = useCharacter(characterId)

  // First, fetch the conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      if (!userId || !chatId) return
      
      try {
        setLoading(true)
        console.log("Fetching conversation:", chatId);
        
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
        
        // Debug the response data
        console.log("Conversation API response:", {
          id: data.id,
          title: data.title,
          characterId: data.characterId,
          characterExists: !!data.character,
          messageCount: data.messages?.length
        });
        
        // Store the characterId for separate fetching if needed
        if (data.characterId && !data.character) {
          setCharacterId(data.characterId)
          console.log(`Character data missing, will fetch separately using ID: ${data.characterId}`)
        }
        
        setConversation(data)
        setMessages(data.messages || [])
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
  
  // Update conversation with character data when it's loaded separately
  useEffect(() => {
    if (fetchedCharacter && conversation && !conversation.character) {
      console.log("Updating conversation with separately fetched character:", fetchedCharacter.name);
      setConversation(prev => prev ? { 
        ...prev, 
        character: {
          id: fetchedCharacter.id,
          name: fetchedCharacter.name,
          description: fetchedCharacter.description,
          imageUrl: fetchedCharacter.imageUrl
        } 
      } : null)
    }
  }, [fetchedCharacter, conversation])

  // Rest of the sendMessage function remains unchanged
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

  // New function to handle AI messages directly
  const sendAIMessage = async (content: string) => {
    if (!userId || !chatId || !content.trim()) return
    
    // Create an AI message
    const aiMessage: Message = {
      id: `temp-ai-${Date.now()}`,
      content,
      role: "assistant",
      createdAt: new Date(),
      conversationId: chatId
    }
    
    // Add the AI message to the conversation
    setMessages(prev => [...prev, aiMessage])
    
    try {
      // Optionally save the AI message to the database
      const response = await fetch(`/api/conversations/${chatId}/messages/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save AI message: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Replace the temporary AI message with the saved one
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== aiMessage.id)
        return [...filtered, data.aiMessage]
      })
    } catch (error) {
      console.error("Error saving AI message:", error)
      // Keep the message in UI but show a subtle warning
      toast.error("Message saved locally only", {
        description: "Could not save to server"
      })
    }
  }
  
  // Include characterLoading in the overall loading state
  const isLoading = loading || (characterId && characterLoading);
  
  return { 
    conversation, 
    messages, 
    sendMessage, 
    sendAIMessage, // Add the new function to the return value
    loading: isLoading 
  }
}
