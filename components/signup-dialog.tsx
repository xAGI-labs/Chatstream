"use client"
import Image from "next/image"
import { X, Video, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@clerk/nextjs"
import { SignIn } from "@clerk/nextjs"

// Helper function to generate avatar URLs
const getAvatarUrl = (name: string, size = 100) => {
  // Using RoboHash for more character-like avatars
  return `https://robohash.org/${encodeURIComponent(name)}?size=${size}x${size}&set=set4`
}

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SignupDialog({ open, onOpenChange }: SignupDialogProps) {
  const { isSignedIn } = useAuth()
  
  // If user is already signed in, close the dialog
  if (isSignedIn && open) {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-[#111111] text-white p-0 border border-[#222222] rounded-xl overflow-hidden">
        <DialogTitle className="sr-only">Join Chatstream</DialogTitle>
        <div className="relative flex flex-col md:flex-row">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-[#222222] p-1 hover:bg-[#333333] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Phone mockup with characters */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] p-6 flex items-center justify-center md:w-1/2">
            <div className="relative bg-black rounded-[32px] w-[220px] h-[420px] overflow-hidden border-[3px] border-[#222222] shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-8 bg-black flex justify-center">
                <div className="w-24 h-6 bg-black rounded-b-xl"></div>
              </div>
              <div className="p-4 pt-10 text-center">
                <div className="mb-4 flex justify-center items-center space-x-1">
                  <Image 
                    src="/logo.png" 
                    alt="Chatstream Logo" 
                    width={100} 
                    height={24} 
                    className="h-4 w-auto" 
                  />
                  <span className="text-xs font-medium text-white">chatstream.ai</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {characterAvatars.map((character, i) => (
                    <div
                      key={i}
                      className="w-full aspect-square rounded-full overflow-hidden border border-[#333333] relative group"
                    >
                      <Image
                        src={getAvatarUrl(character.name, 60)}
                        alt={character.name}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                      />
                      {character.video && (
                        <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                          <Video className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-white">{character.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs text-gray-400">
                  <div className="flex items-center justify-center mb-1">
                    <Video className="h-3 w-3 mr-1 text-blue-400" />
                    <span>Video AI Characters</span>
                  </div>
                  <span>Perfect for kids and teens!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signup content */}
          <div className="p-8 md:w-1/2 flex flex-col justify-center">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2 text-white flex items-center justify-center">
                Join Chatstream <Sparkles className="ml-2 h-4 w-4 text-yellow-400" />
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Chat with video AI characters like Harry Potter, Chota Bheem, and more!
              </p>
            </div>

            {/* Clerk Auth Component */}
            <div className="w-full clerk-auth">
              <SignIn 
                routing="hash"
                afterSignInUrl="/"
                afterSignUpUrl="/"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none",
                    header: "hidden",
                    footer: {
                      backgroundColor: "transparent",
                      borderTop: "none",
                      fontSize: "0.875rem",
                      textAlign: "center"
                    },
                    socialButtons: "gap-2",
                    socialButtonsProviderIcon: "w-5 h-5",
                    socialButtonsBlockButton: "bg-[#222222] hover:bg-[#333333] border border-[#333333] text-white h-11 rounded-md",
                    socialButtonsBlockButtonText: "font-medium text-sm",
                    dividerLine: "bg-[#333333]",
                    dividerText: "text-gray-400",
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 rounded-md font-medium",
                    formFieldLabel: "text-gray-300",
                    formFieldInput: "bg-[#222222] border-[#333333] text-white rounded-md",
                    formFieldInputShowPasswordButton: "text-gray-400",
                    formFieldAction: "text-blue-400",
                    footerActionText: "text-gray-400",
                    footerActionLink: "text-white hover:text-gray-300 font-medium",
                    formFieldError: "text-red-500",
                    identityPreviewEditButtonIcon: "text-gray-300"
                  },
                  layout: {
                    socialButtonsVariant: "blockButton",
                    socialButtonsPlacement: "top",
                    termsPageUrl: "https://clerk.dev/terms"
                  },
                  variables: {
                    colorPrimary: "#2563eb",
                    colorBackground: "#111111",
                    colorText: "#ffffff",
                    colorTextSecondary: "#9ca3af",
                    colorInputBackground: "#222222",
                    colorInputText: "#ffffff",
                    borderRadius: "0.375rem",
                  }
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const characterAvatars = [
  { name: "Harry Potter", video: true },
  { name: "Chota Bheem", video: true },
  { name: "Sherlock Holmes", video: true },
  { name: "Motu Patlu", video: true },
  { name: "Einstein", video: false },
  { name: "The Rock", video: true },
  { name: "Marie Curie", video: false },
  { name: "Aryabhatta", video: true },
  { name: "Custom Character", video: true },
]

