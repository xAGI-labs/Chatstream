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
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug character data
  useEffect(() => {
    console.log(`Character ${character.name} data:`, {
      id: character.id,
      name: character.name,
      hasImageUrl: !!character.imageUrl,
      imageUrl: character.imageUrl
    });
    
    // Set loading state based on image URL availability
    if (character.imageUrl) {
      setIsLoading(false);
    }
  }, [character]);
  
  // Empty image placeholder - will show a colored div when no image is available
  // We specifically avoid using Robohash as requested
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
        {isLoading || !character.imageUrl ? (
          <EmptyImagePlaceholder />
        ) : (
          <Image
            src={character.imageUrl}
            alt={character.name}
            fill
            className="object-cover"
            onError={(e) => {
              console.error(`CharacterCard: Image error for ${character.name}, URL:`, character.imageUrl);
              setImgError(true);
              // Just show the placeholder instead of using Robohash
            }}
            unoptimized={true}
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
