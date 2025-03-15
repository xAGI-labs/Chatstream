import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { generateAvatar } from '@/lib/avatar';

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { name, description, instructions, isPublic } = body
    
    if (!name || !instructions) {
      return new NextResponse("Name and instructions are required", { status: 400 })
    }
    
    // Check if the user exists in our database, if not create them
    const dbUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (!dbUser) {
      await prisma.user.create({
        data: {
          id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      })
    }
    
    // Generate a custom avatar using Together AI
    console.log("Attempting to generate avatar for:", name);
    console.log("Together API Key available:", !!process.env.TOGETHER_API_KEY);
    
    let avatarUrl = null;
    try {
      if (process.env.TOGETHER_API_KEY) {
        console.log("Calling generateAvatar function...");
        avatarUrl = await generateAvatar(name, description);
        console.log("Generated avatar URL:", avatarUrl);
      } else {
        console.log("No Together API key found, using default avatar");
      }
    } catch (error) {
      console.error("Avatar generation failed:", error);
      // Continue with default avatar if generation fails
    }
    
    // Create the character with direct robohash URL if Together API fails
    const character = await prisma.character.create({
      data: {
        name,
        description,
        instructions,
        isPublic: isPublic || false,
        creatorId: userId,
        // Use generated avatar if available, otherwise use direct robohash URL
        imageUrl: avatarUrl || `https://robohash.org/${encodeURIComponent(name)}?size=256x256&set=set4`
      }
    })
    
    return NextResponse.json(character)
  } catch (error) {
    console.error("[CHARACTER_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const url = new URL(req.url)
    const onlyMine = url.searchParams.get("onlyMine") === "true"
    
    let where = {}
    
    if (onlyMine) {
      where = { creatorId: userId }
    } else {
      where = {
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    }
    
    // Get characters
    const characters = await prisma.character.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      }
    })
    
    return NextResponse.json(characters)
  } catch (error) {
    console.error("[CHARACTERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
