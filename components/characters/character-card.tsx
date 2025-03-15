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
  
  // Use robohash as last-resort fallback only
  const fallbackImage = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
  
  // For the image URL:
  // 1. First try the stored imageUrl from the database (Together AI generated)
  // 2. If that fails, use the fallback
  let imageUrl = character.imageUrl || fallbackImage;
  
  // Reset error state when character changes
  useEffect(() => {
    setImgError(false);
  }, [character.id]);
  
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
        <Image
          src={imgError ? fallbackImage : imageUrl}
          alt={character.name}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
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
