import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from 'react'

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
  
  // Generate a fallback avatar URL as a last resort
  const fallbackAvatarUrl = character?.name 
    ? `https://robohash.org/${encodeURIComponent(character.name)}?size=32x32&set=set4` 
    : null;
  
  // Reset error state when character changes
  useEffect(() => {
    if (character) setImgError(false);
  }, [character?.name]);
  
  // Use the character's Together-generated image URL if available, fall back to robohash only if needed
  const avatarUrl = !imgError && character?.imageUrl ? character.imageUrl : fallbackAvatarUrl;

  return (
    <div className="border-b border-border flex items-center p-4 h-16">
      {loading ? (
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : (
        <>
          {avatarUrl && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
              <Image 
                src={avatarUrl} 
                alt={character?.name || "Character"} 
                fill
                className="object-cover"
                onError={() => setImgError(true)}
                priority
              />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-foreground">
              {character?.name || "Chat"}
            </h3>
            {title && <p className="text-xs text-muted-foreground">{title}</p>}
          </div>
        </>
      )}
    </div>
  )
}
