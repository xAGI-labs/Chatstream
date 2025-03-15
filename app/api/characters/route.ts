import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import axios from 'axios'

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
    
    let avatarUrl = null;
    try {
      if (process.env.TOGETHER_API_KEY) {
        console.log("Calling Together API for avatar generation...");
        
        // Generate avatar using Together AI directly
        const prompt = description
          ? `A portrait of ${name}, who is ${description}. Detailed, high quality.`
          : `A portrait of a character named ${name}. Detailed, high quality.`;
        
        const response = await axios.post(
          "https://api.together.xyz/v1/images/generations",
          {
            model: "black-forest-labs/FLUX.1-dev",
            prompt,
            width: 256,
            height: 256,
            steps: 28,
            n: 1,
            response_format: "url" // Get URL directly instead of base64
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        if (response.data?.data?.[0]?.url) {
          avatarUrl = response.data.data[0].url;
          console.log("Generated avatar URL from Together API:", avatarUrl);
        }
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
