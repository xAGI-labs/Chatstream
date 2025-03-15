"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import SignupDialog from "@/components/signup-dialog"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Header } from "@/components/header/header"
import { HeroSection } from "@/components/hero-section"
import { CharacterSection } from "@/components/characters/character-section"
import { CreateCharacterSection } from "@/components/create-character-section"
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data"
import { preloadDefaultAvatars } from "@/lib/preload-avatars"

export default function Home() {
  const { isOpen, setIsOpen } = useSignupDialog()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    // Show sign-up dialog only if user is not signed in
    if (isLoaded && !isSignedIn) {
      setIsOpen(true)
    }
  }, [isLoaded, isSignedIn, setIsOpen])
  
  // Preload avatars for default characters on initial load
  useEffect(() => {
    // Using a timeout to not block the main thread during initial rendering
    const timeoutId = setTimeout(() => {
      preloadDefaultAvatars().catch(console.error);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex h-screen bg-[#111111]">
      {/* Sidebar */}
      <Sidebar setIsOpen={setIsOpen} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Header */}
          <Header />

          {/* Hero Section */}
          <HeroSection />

          {/* Character Sections */}
          <div className="px-8 py-6">
            {/* Popular Characters */}
            <CharacterSection title="Popular Characters" characters={popularCharacters} />

            {/* Educational Characters */}
            <CharacterSection title="Educational Characters" characters={educationalCharacters} />

            {/* Create Your Own */}
            <CreateCharacterSection />
          </div>
        </div>
      </main>
      
      {/* Sign-up Dialog */}
      <SignupDialog open={isOpen} onOpenChange={setIsOpen} />
    </div>
  )
}

