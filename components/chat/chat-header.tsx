import Image from "next/image"
import { useState, useEffect } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, MoreVertical, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
  character?: {
    name: string;
    imageUrl?: string;
  };
  title?: string;
  loading?: boolean;
}

export function ChatHeader({ character, title, loading }: ChatHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();
  
  // Reset error state when character changes
  useEffect(() => {
    if (character) setImgError(false);
  }, [character?.name]);
  
  // Use the character's image URL if available
  const avatarUrl = !imgError && character?.imageUrl ? character.imageUrl : null;

  return (
    <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10 h-16">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:mr-3 h-8 w-8"
          onClick={() => router.push('/')}
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {loading ? (
          <div className="flex items-center space-x-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="relative h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-background shadow-sm">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt={character?.name || "Character"} 
                  fill
                  className="object-cover"
                  onError={() => setImgError(true)}
                  priority
                />
              ) : (
                <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                  <span className="font-semibold text-primary">{character?.name?.[0] || '?'}</span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-sm">
                  {character?.name || "AI Assistant"}
                </h3>
                <div className="bg-green-500/20 text-green-600 text-xs px-1.5 py-0.5 rounded ml-2">
                  Online
                </div>
              </div>
              {title && <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Character info"
        >
          <Info className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Reset conversation</DropdownMenuItem>
            <DropdownMenuItem>Export chat</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete conversation</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
