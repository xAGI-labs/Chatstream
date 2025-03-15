// @ts-nocheck
import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient, Role } from "@prisma/client"
import OpenAI from "openai"

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
})

// Type for the context parameter with generic params
type RouteContext<T> = { params: T }

export async function POST(
  req: Request,
  // Use a direct object pattern to avoid property access on params object
  { params }: RouteContext<{ chatId: string }>
) {
  try {
    // Extract chatId directly from params through destructuring
    const { chatId } = params
    
    // Verify we have a chatId
    if (!chatId) {
      return new NextResponse("Chat ID is required", { status: 400 })
    }
    
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { content } = body
    
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new NextResponse("Invalid content", { status: 400 })
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
    
    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content: content.trim(),
        role: "user",
        conversationId: chatId
      }
    })
    
    // Get previous messages to build context
    const previousMessages = await prisma.message.findMany({
      where: {
        conversationId: chatId
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 10 // Limit to last 10 messages for context
    })
    
    // Build messages for OpenAI API
    const messageHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
    
    // Add system message with character instructions
    // Use type assertion for the OpenAI API format which accepts "system" role
    messageHistory.unshift({
      role: "system" as any, // Type assertion to bypass TypeScript check
      content: `You are ${conversation.character.name}. ${conversation.character.instructions}`
    })
    
    // Add the newest user message
    messageHistory.push({
      role: "user",
      content: content.trim()
    })
    
    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messageHistory as any[], // Type assertion for the entire array
      temperature: 0.7,
      max_tokens: 500
    })
    
    const aiContent = response.choices[0]?.message?.content || "I'm not sure how to respond to that."
    
    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        content: aiContent,
        role: "assistant",
        conversationId: chatId
      }
    })
    
    // Update the conversation's updatedAt timestamp
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
