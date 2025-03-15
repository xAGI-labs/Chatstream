"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import Image from "next/image"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCharacterDialog({ open, onOpenChange }: CreateCharacterDialogProps) {
  const { userId } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !name || !instructions) {
      toast.error("Missing information", {
        description: "Please fill out all required fields"
      })
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          isPublic
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to create character")
      }
      
      const data = await response.json()
      
      toast.success("Character created!", {
        description: `${name} is ready to chat`
      })
      
      onOpenChange(false)
      
      // Create a new conversation with this character
      const convResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: data.id })
      })
      
      if (!convResponse.ok) {
        throw new Error("Failed to create conversation")
      }
      
      const convData = await convResponse.json()
      
      // Redirect to the chat page
      router.push(`/chat/${convData.id}`)
    } catch (error) {
      console.error("Error creating character:", error)
      toast.error("Error creating character", {
        description: "Please try again later"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a new character</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your character"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="instructions">Instructions*</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Provide detailed instructions on how your character should behave, speak, and respond"
                className="h-24"
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make this character public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!name || !instructions || isLoading}
            >
              {isLoading ? "Creating..." : "Create Character"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
