import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  context: { params: { chatId?: string } }
) {
  try {
    // Avoid direct property access on params
    const chatId = context.params?.chatId
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Get the conversation and check if user has access
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId
      },
      include: {
        character: true
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    if (conversation.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: {
        conversationId: chatId
      },
      orderBy: {
        createdAt: "asc"
      }
    })
    
    return NextResponse.json({
      conversation,
      messages
    })
  } catch (error) {
    console.error("[CONVERSATION_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
