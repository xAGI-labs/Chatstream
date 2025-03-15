"use client"

import { useState, useEffect } from "react"
import { useAuth, useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusCircle, Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSignupDialog } from "@/hooks/use-signup-dialog"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { ConversationList } from "./conversation-list"
import { MobileNavigation } from "./mobile-navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SidebarProps {
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ setIsOpen }: SidebarProps) {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const pathname = usePathname()
  const { setIsOpen: setSignupOpen } = useSignupDialog()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  
  // Load collapsed state from localStorage on component mount
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState !== null && !isMobile) {
      setIsCollapsed(JSON.parse(savedCollapsedState))
    }
  }, [isMobile])
  
  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
    }
  }, [isCollapsed, isMobile])
  
  // Check if we're in a chat route
  const isChatRoute = pathname?.startsWith('/chat')
  
  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen?.(true)
      return
    }
    
    setIsCreateDialogOpen(true)
  }
  
  // Get user's first name or username for display
  const displayName = user?.firstName || user?.username || "Guest"
  
  // Pre-define avatar URLs with cache parameter and timestamp to ensure long-term caching
  const harryPotterAvatar = `/api/avatar?name=Harry%20Potter&width=20&height=20&cache=true&t=1`
  const chotaBheemAvatar = `/api/avatar?name=Chota%20Bheem&width=20&height=20&cache=true&t=1`

  // Render mobile navigation on small screens
  if (isMobile) {
    return (
      <MobileNavigation 
        setSignupOpen={setSignupOpen}
        setCreateDialogOpen={setIsCreateDialogOpen}
        isCreateDialogOpen={isCreateDialogOpen}
        isSignedIn={!!isSignedIn} // Convert to boolean with double negation
        displayName={displayName}
      />
    )
  }

  // Desktop sidebar view
  return (
    <>
      <aside className={cn(
        "border-r border-[#222222] flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-[60px]" : "w-[220px]"
      )}>
        {/* Logo Section - Made clickable */}
        <Link href="/" className={cn(
          "p-4 flex items-center space-x-2", 
          isCollapsed && "justify-center"
        )}>
          <Image 
            src="/logo.png"
            alt="Chatstream Logo"
            width={120}
            height={28}
            className="h-6 w-auto"
            priority
          />
          {!isCollapsed && <span className="text-sm font-medium text-white">chatstream.ai</span>}
        </Link>

        {/* Collapse Button - Visible on all routes */}
        <div className="absolute top-4 -right-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6 rounded-full border-[#333333] bg-background"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>

        <div className={cn(
          "p-4 pt-2",
          isCollapsed && "flex justify-center"
        )}>
          <Button
            onClick={handleCreateClick}
            className={cn(
              "justify-start h-8 text-xs",
              isCollapsed ? "w-10 p-0" : "w-full"
            )} 
            variant="outline"
          >
            <PlusCircle className={cn("h-3.5 w-3.5", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Create Character"}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {!isCollapsed && (
            <>
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
            </>
          )}

          {/* Recent conversations */}
          <ConversationList isCollapsed={isCollapsed} />

          {!isCollapsed && (
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
                    loading="eager"
                    priority={true}
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
                    loading="eager"
                    priority={true}
                  />
                </div>
                Chota Bheem
              </Button>
            </div>
          )}
        </nav>

        <div className={cn(
          "p-3 border-t border-[#222222]",
          isCollapsed && "flex justify-center items-center"
        )}>
          {isSignedIn ? (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className="flex items-center space-x-2">
                <UserButton afterSignOutUrl="/" />
                {!isCollapsed && <span className="text-xs text-gray-300">{displayName}</span>}
              </div>
              {!isCollapsed && <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
            </div>
          ) : (
            <div className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}>
              <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center text-xs text-white">
                ?
              </div>
              {!isCollapsed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsOpen?.(true)}
                  className="text-xs"
                >
                  Sign In
                </Button>
              )}
            </div>
          )}
          {!isCollapsed && (
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
              <Link href="#" className="hover:text-gray-400">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-gray-400">
                Terms of Service
              </Link>
            </div>
          )}
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
