"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Plus, ChevronRight, ChevronLeft, Video, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SignupDialog from "@/components/signup-dialog"
import { useSignupDialog } from "@/hooks/use-signup-dialog"

// Helper function to generate avatar URLs
const getAvatarUrl = (name: string, size = 40) => {
  return `https://placeholder.sauravalgs.workers.dev/together?prompt=${encodeURIComponent(name)}&width=${size}&height=${size}`
}

export default function Home() {
  const { isOpen, setIsOpen } = useSignupDialog()

  useEffect(() => {
    setIsOpen(true)
  }, [setIsOpen])

  return (
    <div className="flex h-screen bg-[#111111]">
      {/* Sidebar */}
      <aside className="w-[180px] border-r border-[#222222] flex flex-col">
        <div className="p-4 flex items-center">
          <span className="text-sm font-medium text-white">chatstream.ai</span>
        </div>

        <div className="p-4 pt-2">
          <Button className="w-full justify-start h-8 text-xs" variant="outline">
            <Plus className="mr-2 h-3.5 w-3.5" /> Create
          </Button>
        </div>

        <nav className="flex-1">
          <div className="px-3">
            <Button variant="ghost" className="w-full justify-start mb-1 text-xs h-8 bg-[#1a1a1a] hover:bg-[#222222]">
              <div className="w-4 h-4 rounded-full bg-[#333333] mr-2 flex items-center justify-center">
                <Search className="h-3 w-3" />
              </div>
              Discover
            </Button>
          </div>

          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-gray-500" />
              <Input
                type="search"
                placeholder="Search for Characters"
                className="pl-7 pr-2 py-1 h-8 text-xs bg-[#1a1a1a] border-[#222222] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          <div className="px-3 py-2">
            <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Favorites</h3>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white text-xs h-8 hover:bg-[#1a1a1a]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                <Image
                  src={getAvatarUrl("Harry Potter", 20)}
                  alt="Harry Potter"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
              Harry Potter
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white text-xs h-8 hover:bg-[#1a1a1a]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                <Image
                  src={getAvatarUrl("Chota Bheem", 20)}
                  alt="Chota Bheem"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
              Chota Bheem
            </Button>
          </div>
        </nav>

        <div className="p-3 border-t border-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center text-xs text-white">
                K
              </div>
              <span className="text-xs text-gray-300">kumar007</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
            <Link href="#" className="hover:text-gray-400">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="#" className="hover:text-gray-400">
              Terms of Service
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-[#222222]">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2 text-gray-500">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-white">Welcome back,</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#333333] mr-2 flex items-center justify-center text-xs">
                    K
                  </div>
                  <span className="text-sm text-gray-300">kumar007</span>
                </div>
              </div>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500" />
              <Input
                type="search"
                placeholder="Search for Characters"
                className="pl-9 h-9 bg-[#1a1a1a] border-[#222222] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </header>

          {/* Hero Section */}
          <div className="relative h-[200px] bg-[#1a1a1a]">
            <div className="absolute inset-0">
              <Image
                src="https://placeholder.sauravalgs.workers.dev/together?prompt=Colorful%20fantasy%20world%20with%20characters&width=1200&height=200"
                alt="Hero background"
                width={1200}
                height={200}
                className="w-full h-full object-cover opacity-10"
              />
            </div>
            <div className="relative h-full flex items-center px-8">
              <div className="max-w-xl">
                <div className="text-sm text-gray-500 mb-1">What do you want to do today?</div>
                <h1 className="text-2xl font-medium text-white mb-2">Chat with your favorite characters</h1>
                <p className="text-sm text-gray-400">
                  Talk to Harry Potter, Chota Bheem, or create your own video character!
                </p>
              </div>
            </div>
          </div>

          {/* Character Sections */}
          <div className="px-8 py-6">
            {/* Popular Characters */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-300">Popular Characters</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-white">
                  See all <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {popularCharacters.map((character, index) => (
                  <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#222222] transition-colors group">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={getAvatarUrl(character.name, 40)}
                          alt={character.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                        {character.video && (
                          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                            <Video className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {character.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{character.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span>{character.interactions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Educational Characters */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-300">Educational Characters</h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-white">
                  See all <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {educationalCharacters.map((character, index) => (
                  <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#222222] transition-colors group">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={getAvatarUrl(character.name, 40)}
                          alt={character.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                        {character.video && (
                          <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                            <Video className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {character.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{character.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span>{character.interactions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Create Your Own */}
            <section>
              <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222222] rounded-lg p-6 border border-[#333333]">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="mb-4 md:mb-0 md:mr-6">
                    <h2 className="text-lg font-medium text-white mb-2 flex items-center">
                      Create Your Own Video Character <Sparkles className="ml-2 h-4 w-4 text-yellow-400" />
                    </h2>
                    <p className="text-sm text-gray-400 max-w-md">
                      Turn any photo and voice into an interactive AI friend. Perfect for kids to chat with their own
                      creations!
                    </p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
                      <Image
                        src={getAvatarUrl("Custom character boy", 64)}
                        alt="Custom character"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
                      <Image
                        src={getAvatarUrl("Custom character girl", 64)}
                        alt="Custom character"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#333333]">
                      <Image
                        src={getAvatarUrl("Custom character robot", 64)}
                        alt="Custom character"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Signup Dialog */}
      <SignupDialog open={isOpen} onOpenChange={setIsOpen} />
    </div>
  )
}

// Missing ChevronDown icon - adding it here
interface ChevronDownProps extends React.SVGProps<SVGSVGElement> {}

function ChevronDown(props: ChevronDownProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

const popularCharacters = [
  {
    name: "Harry Potter",
    description: "Chat about Hogwarts and magic spells",
    interactions: "1.2M chats",
    video: true,
  },
  {
    name: "Chota Bheem",
    description: "Adventures in Dholakpur with Bheem",
    interactions: "856K chats",
    video: true,
  },
  {
    name: "Motu Patlu",
    description: "Join the funny duo on their adventures",
    interactions: "723K chats",
    video: true,
  },
  {
    name: "The Rock",
    description: "Workout tips and motivation from The Rock",
    interactions: "945K chats",
    video: true,
  },
]

const educationalCharacters = [
  {
    name: "Sherlock Holmes",
    description: "Solve mysteries and learn deduction",
    interactions: "567K chats",
    video: true,
  },
  {
    name: "Albert Einstein",
    description: "Learn physics in a fun and simple way",
    interactions: "489K chats",
    video: true,
  },
  {
    name: "Marie Curie",
    description: "Discover the wonders of science",
    interactions: "356K chats",
    video: false,
  },
  {
    name: "Aryabhatta",
    description: "Mathematics and astronomy made easy",
    interactions: "412K chats",
    video: true,
  },
]

