import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"

interface ChatHeaderProps {
  character?: {
    name: string;
    imageUrl?: string;
  };
  title?: string;
  loading?: boolean;
}

export function ChatHeader({ character, title, loading }: ChatHeaderProps) {
  return (
    <div className="border-b border-border flex items-center p-4 h-16">
      {loading ? (
        <div className="flex items-center space-x-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-40" />
        </div>
      ) : (
        <>
          {character?.imageUrl && (
            <Image 
              src={character.imageUrl} 
              alt={character.name} 
              width={32} 
              height={32} 
              className="rounded-full mr-3"
            />
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
