import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { PrismaClient } from "@prisma/client"
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data"
import { generateCharacterInstructions } from "@/lib/character"
import { generateAvatar } from "@/lib/avatar"
import { enrichCharacterDescription, generateDetailedInstructions } from "@/lib/character-enrichment"
import axios from "axios"

const prisma = new PrismaClient()

// Combine all default characters
const defaultCharacters = [...popularCharacters, ...educationalCharacters];

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const { characterId } = body
    
    if (!characterId) {
      return new NextResponse("Character ID is required", { status: 400 })
    }
    
    // First, ensure the user exists in our database
    let dbUser = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    // If user doesn't exist in our DB, create them
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl
        }
      })
      console.log(`Created new user in database: ${userId}`)
    }
    
    // Check if character exists and is accessible by this user
    let character = await prisma.character.findFirst({
      where: {
        id: characterId,
        OR: [
          { creatorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    // If character doesn't exist in the database but is in our default characters list
    if (!character) {
      // Find in our default characters
      const defaultCharacter = defaultCharacters.find(c => c.id === characterId);
      
      if (defaultCharacter) {
        // Create the character in the database as a public character
        console.log(`Creating default character: ${defaultCharacter.name}`);
        
        // First, make sure we have the system user (we'll use the first admin as the creator)
        let systemUser = await prisma.user.findFirst({
          where: {
            id: 'system'
          }
        });
        
        if (!systemUser) {
          systemUser = await prisma.user.create({
            data: {
              id: 'system',
              email: 'system@chatstream.ai',
              firstName: 'System'
            }
          });
        }
        
        // Generate instructions for the character using the enhanced method
        let instructions;
        try {
          instructions = await generateDetailedInstructions(
            defaultCharacter.name, 
            defaultCharacter.description || `A character named ${defaultCharacter.name}`
          );
        } catch (error) {
          // Fallback to basic instructions if AI generation fails
          instructions = generateCharacterInstructions(
            defaultCharacter.name, 
            defaultCharacter.description
          );
          console.error("Error generating detailed instructions, using fallback:", error);
        }
        
        // Generate enhanced avatar prompt
        let avatarPrompt;
        try {
          const enrichment = await enrichCharacterDescription(
            defaultCharacter.name, 
            defaultCharacter.description
          );
          avatarPrompt = enrichment.avatarPrompt;
        } catch (error) {
          avatarPrompt = defaultCharacter.description
            ? `A portrait of ${defaultCharacter.name}, who is ${defaultCharacter.description}. Detailed, high quality.`
            : `A portrait of a character named ${defaultCharacter.name}. Detailed, high quality.`;
          console.error("Error generating avatar prompt, using fallback:", error);
        }
        
        // Generate avatar using Together API with the enhanced prompt
        let imageUrl = null;
        try {
          if (process.env.TOGETHER_API_KEY) {
            console.log("Generating avatar for default character with Together API");
            
            const response = await axios.post(
              "https://api.together.xyz/v1/images/generations",
              {
                model: "black-forest-labs/FLUX.1-dev",
                prompt: avatarPrompt,
                width: 256,
                height: 256,
                steps: 28,
                n: 1,
                response_format: "url"
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
                  "Content-Type": "application/json"
                }
              }
            );
            
            if (response.data?.data?.[0]?.url) {
              imageUrl = response.data.data[0].url;
              console.log("Generated avatar URL:", imageUrl);
            }
          }
        } catch (error) {
          console.error("Error generating avatar for default character:", error);
        }
        
        // Fall back to robohash only if Together API fails
        if (!imageUrl) {
          imageUrl = `https://robohash.org/${encodeURIComponent(defaultCharacter.name)}?size=256x256&set=set4`;
        }
        
        // Create the character with Together-generated avatar
        character = await prisma.character.create({
          data: {
            id: defaultCharacter.id,
            name: defaultCharacter.name,
            description: defaultCharacter.description || null,
            instructions,
            imageUrl,
            isPublic: true,
            creatorId: systemUser.id
          }
        });
      } else {
        return new NextResponse("Character not found or not accessible", { status: 404 })
      }
    }
    
    // Create a new conversation
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        characterId: character.id,
        title: `${character.name}`
      }
    })
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error("[CONVERSATION_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Get user's conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    })
    
    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
