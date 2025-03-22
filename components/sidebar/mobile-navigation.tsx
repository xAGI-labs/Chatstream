"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { 
  Home, 
  Search, 
  MessageSquare, 
  PlusCircle, 
  User, 
  X, 
  Menu, 
  ChevronRight,
  Settings,
  ArrowLeft 
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { CreateCharacterDialog } from "@/components/create-character-dialog"
import { ConversationList } from "./conversation-list"
import { cn } from "@/lib/utils"

interface MobileNavigationProps {
  isSignedIn?: boolean;
  setSignupOpen: (open: boolean) => void;
  setCreateDialogOpen: (open: boolean) => void;
  isCreateDialogOpen: boolean;
  displayName: string;
}

export function MobileNavigation({ 
  isSignedIn = false, 
  setSignupOpen, 
  setCreateDialogOpen,
  isCreateDialogOpen,
  displayName 
}: MobileNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showSearch, setShowSearch] = useState(false)
  
  const handleCreateClick = () => {
    if (!isSignedIn) {
      setSignupOpen(true)
      return
    }
    
    setCreateDialogOpen(true)
  }
  
  // Check if current route is active
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  return (
    <>
      {/* Top navigation bar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-[#222222] bg-background z-40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Sidebar menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0 border-r border-[#222222] bg-background">
              <SheetHeader className="border-b border-[#222222] p-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2">
                    <Image
                      src="/logo.png"
                      alt="Chatstream Logo"
                      width={120}
                      height={28}
                      className="h-6 w-auto"
                      priority
                    />
                    <span className="text-sm font-medium text-white">chatstream.ai</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                <SheetTitle className="text-left mt-6 text-sm font-medium text-gray-400">Navigation</SheetTitle>
              </SheetHeader>
              
              <div className="py-4 px-2">
                <div className="space-y-1">
                  <SheetClose asChild>
                    <Link href="/">
                      <Button 
                        variant="ghost" 
                        className={cn(
                          "w-full justify-start text-base",
                          isActive('/') && "bg-accent"
                        )}
                      >
                        <Home className="mr-3 h-5 w-5" />
                        Home
                      </Button>
                    </Link>
                  </SheetClose>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-base"
                    onClick={() => setShowSearch(!showSearch)}
                  >
                    <Search className="mr-3 h-5 w-5" />
                    Discover
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-base"
                    onClick={handleCreateClick}
                  >
                    <PlusCircle className="mr-3 h-5 w-5" />
                    Create Character
                  </Button>
                </div>
                
                <div className="mt-6">
                  <h3 className="px-3 text-sm font-medium text-gray-400 mb-2">Recent Conversations</h3>
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <ConversationList isCollapsed={false} />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="px-3 text-sm font-medium text-gray-400 mb-2">Favorites</h3>
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#333333] overflow-hidden mr-3">
                        <Image 
                          src={`/api/avatar?name=Harry%20Potter&width=32&height=32&cache=true&t=1`}
                          alt="Harry Potter" 
                          width={32} 
                          height={32}
                          className="object-cover" 
                        />
                      </div>
                      Harry Potter
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#333333] overflow-hidden mr-3">
                        <Image 
                          src={`/api/avatar?name=Chota%20Bheem&width=32&height=32&cache=true&t=1`}
                          alt="Chota Bheem" 
                          width={32} 
                          height={32}
                          className="object-cover" 
                        />
                      </div>
                      Chota Bheem
                      <ChevronRight className="ml-auto h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[#222222] p-4 mt-auto">
                {isSignedIn ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <UserButton afterSignOutUrl="/" />
                      <div>
                        <p className="text-sm">{displayName}</p>
                        <p className="text-xs text-gray-500">Signed in</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => setSignupOpen(true)}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Chatstream Logo"
              width={120}
              height={28}
              className="h-6 w-auto"
              priority
            />
            <span className="text-sm font-medium text-white">chatstream.ai</span>
          </Link>
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSignupOpen(true)}
              className="h-9"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      {/* Search overlay */}
      <div className={cn(
        "fixed inset-0 bg-background z-50 transition-transform duration-300 ease-in-out",
        showSearch ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="border-b border-[#222222] p-4 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowSearch(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search characters..."
                className="h-10 bg-[#1a1a1a] border-[#222222] focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Popular Characters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["Harry Potter", "Chota Bheem", "Sherlock Holmes", "Iron Man", "Captain America", "Doraemon", "Shin Chan"].map((name) => (
                <Button
                  key={name}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 bg-[#1a1a1a] border-[#222222]"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={`/api/avatar?name=${encodeURIComponent(name)}&width=40&height=40&cache=true&t=1`}
                      alt={name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-xs">{name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating action button for creating character */}
      <Button
        onClick={handleCreateClick}
        className="fixed right-4 bottom-20 h-14 w-14 rounded-full shadow-lg z-50"
      >
        <PlusCircle className="h-6 w-6" />
      </Button>
      
      
      {/* Add padding to page content */}
      <div className="h-16 pb-16"></div>
      
      {/* Character creation dialog */}
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
