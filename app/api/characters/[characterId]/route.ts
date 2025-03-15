import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  context: { params: { characterId?: string } }
) {
  try {
    // Avoid direct property access on params
    const characterId = context.params?.characterId
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Check if character exists and is accessible by this user
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    if (!character) {
      return new NextResponse("Character not found or not accessible", { status: 404 })
    }
    
    return NextResponse.json(character)
  } catch (error) {
    console.error("[CHARACTER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  context: { params: { characterId?: string } }
) {
  try {
    // Avoid direct property access on params
    const characterId = context.params?.characterId
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { name, description, instructions, isPublic } = body
    
    // Check if user owns this character
    const character = await prisma.character.findUnique({
      where: {
        id: characterId
      }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    if (character.creatorId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Update the character
    const updatedCharacter = await prisma.character.update({
      where: {
        id: characterId
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instructions && { instructions }),
        ...(isPublic !== undefined && { isPublic })
      }
    })
    
    return NextResponse.json(updatedCharacter)
  } catch (error) {
    console.error("[CHARACTER_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  context: { params: { characterId?: string } }
) {
  try {
    // Avoid direct property access on params
    const characterId = context.params?.characterId
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Check if user owns this character
    const character = await prisma.character.findUnique({
      where: {
        id: characterId
      }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    if (character.creatorId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Delete the character (will cascade delete conversations)
    await prisma.character.delete({
      where: {
        id: characterId
      }
    })
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[CHARACTER_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
