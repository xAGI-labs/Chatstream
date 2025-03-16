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

export function CharacterCard({ character, onClick, disabled }: CharacterCardProps) {
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  // Direct Robohash URL as absolutely last resort fallback
  const directFallbackUrl = `https://robohash.org/${encodeURIComponent(character.name || 'unknown')}?size=200x200&set=set4`;

  // Debug character data
  useEffect(() => {
    console.log(`Character ${character.name} data:`, {
      id: character.id,
      name: character.name,
      hasImageUrl: !!character.imageUrl,
      imageUrl: character.imageUrl
    });
  }, [character]);
  
  // Load the avatar directly from the database URL with no fallback to avatar API
  useEffect(() => {
    setImgError(false);
    setIsLoading(true);
    
    // CRITICAL: If database provides an imageUrl, we use it directly, no questions asked
    if (character.imageUrl) {
      console.log(`CharacterCard: Using database imageUrl for ${character.name}:`, character.imageUrl);
      setAvatarUrl(character.imageUrl);
      setIsLoading(false);
      return;
    }
    
    // Only if database doesn't have an imageUrl, we fallback to robohash
    console.log(`CharacterCard: No imageUrl in database for ${character.name}, using fallback`);
    setAvatarUrl(directFallbackUrl);
    setIsLoading(false);
    
  }, [character.id, character.imageUrl, character.name, directFallbackUrl]);
  
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
            src={imgError ? directFallbackUrl : avatarUrl || directFallbackUrl}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              console.error(`CharacterCard: Image error for ${character.name}, URL:`, avatarUrl);
              
              // Log detailed error info
              const imgElement = e.target as HTMLImageElement;
              console.error('Image error details:', {
                src: imgElement.src,
                naturalWidth: imgElement.naturalWidth,
                naturalHeight: imgElement.naturalHeight,
                complete: imgElement.complete
              });
              
              setImgError(true); // Mark as error to use direct fallback URL
            }}
            unoptimized={true} // Critical for external URLs to work
            priority={true} // Load images with higher priority
            referrerPolicy="no-referrer" // Avoid CORS issues
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
