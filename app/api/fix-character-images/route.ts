import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// One-time fix for all character images in the database
export async function POST(req: Request) {
  try {
    // Basic auth check - this is a maintenance endpoint
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Start tracking stats
    const stats = {
      homeCharactersTotal: 0,
      homeCharactersFixed: 0,
      charactersTotal: 0,
      charactersFixed: 0
    };

    // 1. Fix HomeCharacter table
    const homeCharacters = await prisma.homeCharacter.findMany();
    stats.homeCharactersTotal = homeCharacters.length;
    
    for (const character of homeCharacters) {
      // If URL isn't absolute or is missing, create a direct robohash URL
      if (!character.imageUrl || !character.imageUrl.startsWith('http')) {
        const newUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        
        await prisma.homeCharacter.update({
          where: { id: character.id },
          data: { imageUrl: newUrl } // Always a string, never null
        });
        
        stats.homeCharactersFixed++;
      }
    }
    
    // 2. Fix Character table
    const characters = await prisma.character.findMany();
    stats.charactersTotal = characters.length;
    
    for (const character of characters) {
      // If URL isn't absolute or is missing, create a direct robohash URL
      if (!character.imageUrl || !character.imageUrl.startsWith('http')) {
        const newUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        
        await prisma.character.update({
          where: { id: character.id },
          data: { imageUrl: newUrl } // Always a string, never null
        });
        
        stats.charactersFixed++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Character image URLs fixed",
      stats
    });
  } catch (error) {
    console.error("Error fixing character images:", error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
