"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Character, CharacterCard } from "./character-card"
import { toast } from "sonner"

interface CharacterSectionProps {
  title: string
  characters: Character[]
}

export function CharacterSection({ title, characters }: CharacterSectionProps) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { setIsOpen } = useSignupDialog()
  const [isLoading, setIsLoading] = useState(false)
  
  const handleCharacterClick = async (characterId: string) => {
    if (!isSignedIn) {
      setIsOpen(true)
      return
    }
    
    try {
      setIsLoading(true)
      console.log(`Creating conversation for character: ${characterId}`)
      
      // Create a new conversation with this character
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ characterId })
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create conversation: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json()
      console.log("Conversation created successfully:", data)
      
      // Redirect to the chat page
      router.push(`/chat/${data.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to start chat", {
        description: "Please try again later or check the console for details."
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-300">{title}</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-white">
          See all <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            onClick={() => handleCharacterClick(character.id)}
            disabled={isLoading}
          />
        ))}
      </div>
    </section>
  )
}
