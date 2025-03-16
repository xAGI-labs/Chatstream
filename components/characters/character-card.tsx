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

// Helper to check if a URL is likely a Together AI imgproxy URL
function isTogetherAiUrl(url: string | undefined): boolean {
  return !!url && (
    url.includes('api.together.ai/imgproxy') || 
    url.includes('together-ai-bfl-images-prod')
  );
}

export function CharacterCard({ character, onClick, disabled }: CharacterCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | undefined>(character.imageUrl);
  
  // Debug character data
  useEffect(() => {
    console.log(`Character ${character.name} data:`, {
      id: character.id,
      name: character.name,
      hasImageUrl: !!character.imageUrl,
      imageUrl: character.imageUrl?.substring(0, 50) + "..." // Don't log the entire long URL
    });
    
    // Reset error state when character changes
    setImgError(false);
    setImageUrl(character.imageUrl);
    
    // Set loading state based on image URL availability
    if (character.imageUrl) {
      setIsLoading(false);
    }
  }, [character]);

  // For Together AI URLs that might expire, refresh them if needed
  useEffect(() => {
    if (imgError && isTogetherAiUrl(character.imageUrl)) {
      console.log(`CharacterCard: Together AI URL failed for ${character.name}, refreshing...`);
      
      // Try to get a fresh URL for this character
      fetch(`/api/refresh-image?characterId=${character.id}&type=homeCharacter`)
        .then(res => res.json())
        .then(data => {
          if (data.imageUrl && data.imageUrl !== character.imageUrl) {
            console.log(`CharacterCard: Got fresh URL for ${character.name}`);
            setImageUrl(data.imageUrl);
            setImgError(false);
          }
        })
        .catch(err => {
          console.error(`CharacterCard: Failed to refresh image for ${character.name}:`, err);
        });
    }
  }, [imgError, character.id, character.imageUrl, character.name]);
  
  // Empty image placeholder - will show a colored div when no image is available
  const EmptyImagePlaceholder = () => (
    <div className="w-full h-full bg-gradient-to-b from-blue-800 to-purple-900 flex items-center justify-center">
      <span className="text-white font-bold text-lg">
        {character.name?.charAt(0)?.toUpperCase() || "?"}
      </span>
    </div>
  );
  
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
        {isLoading || !imageUrl ? (
          <EmptyImagePlaceholder />
        ) : (
          <Image
            src={imageUrl}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              console.error(`CharacterCard: Image error for ${character.name}, URL length: ${imageUrl?.length}`);
              setImgError(true);
            }}
            unoptimized={true} // Critical for external URLs
            crossOrigin="anonymous" // Important for Together AI URLs
            referrerPolicy="no-referrer" // Helps with some CORS issues
          />
        )}
        
        {/* Show placeholder if image loading failed */}
        {imgError && <EmptyImagePlaceholder />}
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
