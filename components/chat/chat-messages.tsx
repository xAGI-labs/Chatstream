import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Message } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TypingIndicator } from "./typing-indicator"
import { User as UserIcon } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean;
  isWaiting?: boolean;
  character?: {
    name: string;
    imageUrl?: string;
  };
}

export function ChatMessages({ messages, loading, isWaiting, character }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [characterImgError, setCharacterImgError] = useState(false);
  const [userImgError, setUserImgError] = useState(false);
  const { user } = useUser();

  // Reset error state when character changes
  useEffect(() => {
    if (character) setCharacterImgError(false);
  }, [character?.imageUrl]);
  
  // Reset user image error when user changes
  useEffect(() => {
    if (user) setUserImgError(false);
  }, [user?.imageUrl]);

  // Use the character's imageUrl directly from database, with fallback
  const characterAvatarUrl = !characterImgError && character?.imageUrl 
    ? character.imageUrl 
    : character?.name ? `https://robohash.org/${encodeURIComponent(character.name)}?size=40x40&set=set4` : null;
    
  // Get user avatar URL from Clerk
  const userAvatarUrl = !userImgError && user?.imageUrl
    ? user.imageUrl
    : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isWaiting])
  
  if (loading) {
    return (
      <div className="space-y-4 px-1 sm:px-0">
        <MessageSkeleton />
        <MessageSkeleton fromUser />
        <MessageSkeleton />
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <p className="text-center">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-1 sm:px-0 pb-1">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={cn(
            "flex items-start",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {/* Character avatar (only for assistant messages) */}
          {message.role === "assistant" && characterAvatarUrl && (
            <div className="flex-shrink-0 mr-2">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-muted">
                <Image 
                  src={characterAvatarUrl}
                  alt={character?.name || "AI"}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  onError={() => setCharacterImgError(true)}
                  priority 
                />
              </div>
            </div>
          )}
          
          <div 
            className={cn(
              "max-w-[75%] sm:max-w-[80%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base",
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}
          >
            {message.content}
          </div>
          
          {/* User avatar (only for user messages) */}
          {message.role === "user" && (
            <div className="flex-shrink-0 ml-2">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-primary flex items-center justify-center">
                {userAvatarUrl ? (
                  <Image 
                    src={userAvatarUrl}
                    alt="User"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                    onError={() => setUserImgError(true)}
                    priority
                  />
                ) : (
                  <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isWaiting && (
        <div className="flex items-start">
          {characterAvatarUrl && (
            <div className="flex-shrink-0 mr-2">
              <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-muted">
                <Image 
                  src={characterAvatarUrl}
                  alt={character?.name || "AI"}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  onError={() => setCharacterImgError(true)}
                  priority
                />
              </div>
            </div>
          )}
          <TypingIndicator />
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  )
}

function MessageSkeleton({ fromUser = false }) {
  return (
    <div className={cn("flex items-start", fromUser ? "justify-end" : "justify-start")}>
      {!fromUser && (
        <div className="flex-shrink-0 mr-2">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
        </div>
      )}
      <Skeleton 
        className={cn(
          "h-8 sm:h-10 max-w-[75%] sm:max-w-[80%] rounded-lg",
          fromUser ? "w-36 sm:w-48" : "w-52 sm:w-64"
        )} 
      />
      {fromUser && (
        <div className="flex-shrink-0 ml-2">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
        </div>
      )}
    </div>
  )
}
