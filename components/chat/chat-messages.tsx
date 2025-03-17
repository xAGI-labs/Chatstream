import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Message } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { TypingIndicator } from "./typing-indicator"
import { User as UserIcon, CheckCircle } from "lucide-react"
import { useAuth, useUser } from "@clerk/nextjs"
import { format } from "date-fns"

interface ChatMessagesProps {
  messages: Message[];
  loading?: boolean; // Only boolean | undefined
  isWaiting?: boolean; // Only boolean | undefined
  character?: {
    name: string;
    imageUrl?: string | null; // Updated to match ChatHeader
  };
}

export function ChatMessages({ 
  messages, 
  loading = false, // Provide default value
  isWaiting = false, // Provide default value
  character 
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [characterImgError, setCharacterImgError] = useState(false);
  const [userImgError, setUserImgError] = useState(false);
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);

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
    : null;
    
  // Get user avatar URL from Clerk
  const userAvatarUrl = !userImgError && user?.imageUrl
    ? user.imageUrl
    : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      // First try smooth scrolling
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      
      // Then ensure we're at bottom with a direct scroll
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [messages, isWaiting]);
  
  // For debugging
  useEffect(() => {
    console.log("ChatMessages props:", {
      messagesCount: messages?.length || 0,
      loading: !!loading,
      isWaiting: !!isWaiting,
      hasCharacter: !!character,
      characterName: character?.name
    });
  }, [messages, loading, isWaiting, character]);

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 px-4 py-6 h-full">
        <MessageSkeleton />
        <MessageSkeleton fromUser />
        <MessageSkeleton />
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <div className="bg-card/60 p-6 rounded-xl shadow-sm max-w-md text-center">
          <h3 className="font-semibold text-xl mb-2">Start the conversation</h3>
          <p className="text-sm opacity-70">Send a message to begin chatting with {character?.name || 'your AI companion'}.</p>
        </div>
      </div>
    )
  }

  // Group messages by date
  const messagesByDate = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-col space-y-3 py-4 px-4 overflow-y-auto h-full scrollbar-thin"
    >
      {Object.entries(messagesByDate).map(([date, dateMessages], dateIndex) => (
        <div key={date} className="flex flex-col space-y-3">
          {/* Date indicator */}
          <div className="flex justify-center my-4">
            <div className="bg-muted/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
              {dateIndex === 0 ? 'Today' : format(new Date(date), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Messages for this date */}
          {dateMessages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start group",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {/* Character avatar (only for assistant messages) */}
              {message.role === "assistant" && (
                <div className="flex-shrink-0 mr-2 mt-0.5">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 ring-2 ring-background">
                    {characterAvatarUrl ? (
                      <Image 
                        src={characterAvatarUrl}
                        alt={character?.name || "AI"}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        onError={() => setCharacterImgError(true)}
                        priority 
                      />
                    ) : (
                      <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                        <span className="font-semibold text-xs text-primary">{character?.name?.[0] || 'A'}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div 
                className={cn(
                  "max-w-[85%] sm:max-w-[70%] flex flex-col",
                  message.role === "user" ? "items-end" : "items-start"
                )}
              >
                {/* Message bubble */}
                <div 
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm shadow-sm",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card rounded-tl-none"
                  )}
                >
                  {message.content}
                </div>
                
                {/* Message metadata */}
                <div className={cn(
                  "flex items-center mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}>
                  <span className="text-[10px] text-muted-foreground/70">
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </span>
                  {message.role === "user" && (
                    <CheckCircle className="h-3 w-3 ml-1 text-primary/80" />
                  )}
                </div>
              </div>
              
              {/* User avatar (only for user messages) */}
              {message.role === "user" && (
                <div className="flex-shrink-0 ml-2 mt-0.5">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary flex items-center justify-center ring-2 ring-background">
                    {userAvatarUrl ? (
                      <Image 
                        src={userAvatarUrl}
                        alt="User"
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        onError={() => setUserImgError(true)}
                        priority
                      />
                    ) : (
                      <UserIcon className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      
      {isWaiting && (
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-2 mt-0.5">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted ring-2 ring-background">
              {characterAvatarUrl ? (
                <Image 
                  src={characterAvatarUrl}
                  alt={character?.name || "AI"}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  onError={() => setCharacterImgError(true)}
                  priority
                />
              ) : (
                <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                  <span className="font-semibold text-xs text-primary">{character?.name?.[0] || 'A'}</span>
                </div>
              )}
            </div>
          </div>
          <TypingIndicator />
        </div>
      )}
      
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}

function MessageSkeleton({ fromUser = false }) {
  return (
    <div className={cn("flex items-start gap-2", fromUser ? "flex-row-reverse" : "")}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={cn("flex flex-col gap-1", fromUser ? "items-end" : "items-start")}>
        <Skeleton 
          className={cn(
            "h-10 rounded-2xl",
            fromUser ? "w-48 rounded-tr-none" : "w-64 rounded-tl-none"
          )} 
        />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  )
}
