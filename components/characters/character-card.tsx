import Image from "next/image"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { useAvatarCache } from "@/hooks/use-avatar-cache"

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

// Helper to determine if a URL is external/absolute
function isAbsoluteUrl(url: string): boolean {
  return /^(https?:\/\/|\/\/)/i.test(url);
}

export function CharacterCard({ character, onClick, disabled }: CharacterCardProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { getAvatarUrl } = useAvatarCache();
  
  // Use robohash as last-resort fallback only
  const fallbackImage = `https://robohash.org/${encodeURIComponent(character.name || 'unknown')}?size=200x200&set=set4`;
  
  // Load the avatar with consistent caching
  useEffect(() => {
    setImgError(false);
    setIsLoading(true);
    
    // Important: Debug log to troubleshoot avatar issues
    console.log(`CharacterCard: Loading avatar for ${character.name}`, { 
      hasImageUrl: !!character.imageUrl,
      imageUrl: character.imageUrl,
      isAbsolute: character.imageUrl ? isAbsoluteUrl(character.imageUrl) : false,
      env: process.env.NODE_ENV
    });
    
    // If we already have an imageUrl from the database, ensure it's properly formatted
    if (character.imageUrl) {
      try {
        // Make sure we have an absolute URL (important in production)
        const url = isAbsoluteUrl(character.imageUrl) 
          ? character.imageUrl 
          : `${window.location.origin}${character.imageUrl.startsWith('/') ? '' : '/'}${character.imageUrl}`;
          
        console.log(`CharacterCard: Using stored imageUrl for ${character.name}:`, url);
        setAvatarUrl(url);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error(`CharacterCard: Error processing stored URL for ${character.name}:`, error);
        // Continue to fallback avatar generation
      }
    }
    
    // Only fetch from avatar API if no imageUrl is stored in the database
    const fetchAvatar = async () => {
      try {
        // Add a delay for retries to avoid hammering the API
        if (retryCount > 0) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Use our consistent avatar URL with permanent caching
        const url = getAvatarUrl(character.name, 200);
        console.log(`CharacterCard: Generated avatar URL for ${character.name}:`, url);
        
        setAvatarUrl(url);
        setIsLoading(false);
      } catch (error: any) {
        console.error(`CharacterCard: Error fetching avatar for ${character.name}:`, error);
        
        if (retryCount < 3) {
          // Retry with exponential backoff
          setRetryCount(prev => prev + 1);
        } else {
          // After 3 tries, just use the direct Robohash fallback
          console.log(`CharacterCard: Using direct fallback for ${character.name} after ${retryCount} retries`);
          setAvatarUrl(fallbackImage);
          setIsLoading(false);
        }
      }
    };
    
    fetchAvatar();
  }, [character.id, character.imageUrl, character.name, fallbackImage, retryCount, getAvatarUrl]);
  
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
            onError={(e) => {
              console.error(`CharacterCard: Image error for ${character.name}, URL:`, avatarUrl);
              setImgError(true);
              // Immediately use direct Robohash fallback on error in production
              if (process.env.NODE_ENV === 'production' || retryCount >= 2) {
                setAvatarUrl(fallbackImage);
              } else {
                // Only retry in development a limited number of times
                setRetryCount(prev => prev + 1);
              }
            }}
            unoptimized={true} // Important for external URLs in production
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
