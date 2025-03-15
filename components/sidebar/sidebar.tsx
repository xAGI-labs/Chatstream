"use client"

import { useState } from "react"
import { useAuth, useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { PlusCircle, Search, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { ConversationList } from "./conversation-list"
import Image from "next/image"

interface SidebarProps {
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ setIsOpen }: SidebarProps) {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { setIsOpen: setSignupOpen } = useSignupDialog()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen?.(true)
      return
    }
    
    setIsCreateDialogOpen(true)
  }
  
  // Get user's first name or username for display
  const displayName = user?.firstName || user?.username || "Guest"
  
  // Pre-define avatar URLs directly to avoid unnecessary API calls
  const harryPotterAvatar = `/api/avatar?name=Harry%20Potter&width=20&height=20`
  const chotaBheemAvatar = `/api/avatar?name=Chota%20Bheem&width=20&height=20`

  return (
    <>
      <aside className="w-[180px] border-r border-[#222222] flex flex-col">
        <div className="p-4 flex items-center space-x-2">
          <Image 
            src="/logo.png"
            alt="Chatstream Logo"
            width={120}
            height={28}
            className="h-6 w-auto"
            priority
          />
          <span className="text-sm font-medium text-white">chatstream.ai</span>
        </div>

        <div className="p-4 pt-2">
          <Button
            onClick={handleCreateClick}
            className="w-full justify-start h-8 text-xs" 
            variant="outline"
          >
            <PlusCircle className="mr-2 h-3.5 w-3.5" /> Create Character
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto">
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

          {/* Recent conversations */}
          <ConversationList />

          <div className="px-3 py-2">
            <h3 className="px-2 text-xs font-medium text-gray-500 mb-2">Favorites</h3>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white text-xs h-8 hover:bg-[#1a1a1a]"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden mr-2">
                <Image
                  src={harryPotterAvatar}
                  alt="Harry Potter"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                  unoptimized
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
                  src={chotaBheemAvatar}
                  alt="Chota Bheem"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              Chota Bheem
            </Button>
          </div>
        </nav>

        <div className="p-3 border-t border-[#222222]">
          {isSignedIn ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserButton afterSignOutUrl="/" />
                <span className="text-xs text-gray-300">{displayName}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center text-xs text-white">
                ?
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen?.(true)}
                className="text-xs"
              >
                Sign In
              </Button>
            </div>
          )}
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
      
      {/* Character creation dialog */}
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  )
}
