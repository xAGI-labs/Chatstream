import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  req: Request,
  context: { params: { chatId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const chatId = context.params.chatId
    
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    const body = await req.json()
    const { content } = body
    
    if (!content || typeof content !== "string" || content.trim() === "") {
      return new NextResponse("Message content is required", { status: 400 })
    }
    
    // Verify conversation exists and belongs to user
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: chatId,
        userId
      }
    })
    
    if (!conversation) {
      return new NextResponse("Conversation not found", { status: 404 })
    }
    
    // Create the AI message directly
    const aiMessage = await prisma.message.create({
      data: {
        content,
        role: "assistant",
        conversationId: chatId
      }
    })
    
    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    })
    
    return NextResponse.json({ aiMessage })
  } catch (error) {
    console.error("[AI_MESSAGE_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
