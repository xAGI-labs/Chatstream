import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

export interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface CharacterCardProps {
  character: Character;
  onClick?: () => void;
  disabled?: boolean;
}

export function CharacterCard({ character, onClick, disabled }: CharacterCardProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use robohash as last-resort fallback only
  const fallbackImage = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
  
  // Load the avatar from our API with retries
  useEffect(() => {
    setImgError(false);
    setIsLoading(true);
    
    // If we already have an imageUrl, use it directly
    if (character.imageUrl) {
      setAvatarUrl(character.imageUrl);
      setIsLoading(false);
      return;
    }
    
    // Build URL with exponential backoff based on retry count
    const fetchAvatar = async () => {
      try {
        // Add a delay for retries to avoid hammering the API
        if (retryCount > 0) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Construct URL with cache-busting parameter for retries
        const url = `/api/avatar?name=${encodeURIComponent(character.name)}${
          character.description ? `&description=${encodeURIComponent(character.description)}` : ''
        }&width=200&height=200${retryCount > 0 ? `&t=${Date.now()}` : ''}`;
        
        setAvatarUrl(url);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching avatar:", error);
        
        if (retryCount < 3) {
          // Retry with exponential backoff
          setRetryCount(prev => prev + 1);
        } else {
          // After 3 tries, just use the fallback
          setAvatarUrl(fallbackImage);
          setIsLoading(false);
        }
      }
    };
    
    fetchAvatar();
  }, [character.id, character.imageUrl, character.name, character.description, fallbackImage, retryCount]);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "bg-card border border-border rounded-lg p-3 flex flex-col items-center text-center transition-all",
        "hover:border-primary/50 hover:shadow-sm hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        "disabled:opacity-60 disabled:pointer-events-none"
      )}
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3">
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 animate-pulse" />
        ) : (
          <Image
            src={imgError || !avatarUrl ? fallbackImage : avatarUrl}
            alt={character.name}
            fill
            className="object-cover"
            onError={() => {
              setImgError(true);
              // If image loading fails and we haven't hit retry limit, try again
              if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
              }
            }}
            unoptimized
          />
        )}
      </div>
      <h3 className="font-medium text-sm">{character.name}</h3>
      {character.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {character.description}
        </p>
      )}
    </button>
  )
}
