"use client"
import Image from "next/image"
import { X, Mail, Video, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Helper function to generate avatar URLs - duplicating here for component independence
const getAvatarUrl = (name: string, size = 40) => {
  return `https://placeholder.sauravalgs.workers.dev/together?prompt=${encodeURIComponent(name)}&width=${size}&height=${size}`
}

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SignupDialog({ open, onOpenChange }: SignupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#111111] text-white p-0 border border-[#222222] rounded-xl overflow-hidden">
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
                <div className="text-white text-sm mb-4 font-medium">chatstream.ai</div>
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
              <p className="text-gray-400 text-sm">
                Chat with video AI characters like Harry Potter, Chota Bheem, and more!
              </p>
            </div>

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full border-[#333333] bg-[#222222] hover:bg-[#333333] font-medium text-white flex items-center justify-center gap-2 h-11"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full border-[#333333] bg-[#222222] hover:bg-[#333333] font-medium text-white flex items-center justify-center gap-2 h-11"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z"
                    fill="#FFF"
                  />
                </svg>
                Continue with Apple
              </Button>

              <Button
                variant="outline"
                className="w-full border-[#333333] bg-[#222222] hover:bg-[#333333] font-medium text-white flex items-center justify-center gap-2 h-11"
              >
                <Mail className="h-5 w-5" />
                Continue with Email
              </Button>

              <div className="text-xs text-center text-gray-500 mt-6">
                <span>By continuing, you agree to our </span>
                <a href="#" className="text-gray-400 hover:underline">
                  Terms of Service
                </a>
                <span> and acknowledge our </span>
                <a href="#" className="text-gray-400 hover:underline">
                  Privacy Policy
                </a>
                .
              </div>

              <div className="text-center mt-2">
                <span className="text-sm text-gray-400">Already have an account? </span>
                <a href="#" className="text-gray-300 hover:underline text-sm font-medium">
                  Sign In
                </a>
              </div>
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

