// @ts-nocheck
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { generateResponse } from "@/lib/ai-response"

const prisma = new PrismaClient()

// Type for the context parameter with generic params
type RouteContext<T> = { params: T }

export async function POST(
  req: Request,
  context: { params: { chatId: string } }
) {
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
    
    // Generate AI response using character data
    let aiResponse = "I'm sorry, I couldn't generate a response."
    
    try {
      aiResponse = await generateResponse(content, conversation)
    } catch (error) {
      console.error("Error generating AI response:", error)
    }
    
    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        role: "assistant",
        conversationId: chatId
      }
    })
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })
    
    return NextResponse.json({
      userMessage,
      aiMessage
    })
  } catch (error) {
    console.error("[MESSAGES_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
