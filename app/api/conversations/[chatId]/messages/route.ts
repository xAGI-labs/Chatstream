// @ts-nocheck
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { generateCharacterResponse } from "@/lib/chat-helpers"
import { getOpenAIClient } from "@/lib/openai-build-safe" // Import the build-safe version

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

// Only initialize Prisma client if not in build time
const prisma = isBuildTime ? null : new PrismaClient();

// Type for the context parameter with generic params
type RouteContext<T> = { params: T }

export async function GET(
  req: Request,
  context: { params: { chatId: string } }
) {
  // During build, return a mock response
  if (isBuildTime) {
    return NextResponse.json({ messages: [] });
  }
  
  // ... existing code ...
}

export async function POST(
  req: Request,
  context: { params: { chatId: string } }
) {
  // During build, return a mock response
  if (isBuildTime) {
    return NextResponse.json({ 
      userMessage: { id: 'mock', content: 'Mock message', role: 'user', createdAt: new Date() },
      aiMessage: { id: 'mock', content: 'Mock response', role: 'assistant', createdAt: new Date() }
    });
  }
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const chatId = context.params.chatId;
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 });
    }
    
    const body = await req.json()
    const { content } = body
    
    if (!content || typeof content !== "string" || content.trim() === "") {
      return new NextResponse("Message content is required", { status: 400 })
    }
    
    // Verify conversation exists and belongs to user - INCLUDE CHARACTER DATA
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      },
      include: {
        character: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          take: 50 // Limit for context
        }
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    // If character is missing, try to fetch it separately
    if (!conversation.character && conversation.characterId) {
      console.log(`Character missing in messages route, fetching separately: ${conversation.characterId}`)
      
      try {
        const character = await prisma.character.findUnique({
          where: { id: conversation.characterId }
        })
        
        if (character) {
          console.log(`Found character separately: ${character.name}`)
          conversation.character = character
        } else {
          console.error(`Character with ID ${conversation.characterId} not found`)
        }
      } catch (error) {
        console.error("Error fetching character separately:", error)
      }
    }
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: "user",
        conversationId: chatId
      }
    })
    
    // Generate AI response using our direct helper function
    let aiResponse = "I'm sorry, I couldn't generate a response.";
    
    try {
      // Use the build-safe client
      const openai = getOpenAIClient();
      
      // Format recent messages for context
      const recentMessages = conversation.messages
        .slice(-5)
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Generate response directly - no more API-to-API calls
      aiResponse = await generateCharacterResponse(
        conversation.characterId, 
        recentMessages,
        content
      );
      
      console.log(`Generated response for conversation ${chatId}`);
    } catch (error) {
      console.error("Error generating AI response:", error);
      aiResponse = `I apologize, but I'm having temporary technical difficulties. Please try again in a moment.`;
    }
    
    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        conversationId: chatId
      }
    });
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });
    
    return NextResponse.json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
