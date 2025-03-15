import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// Helper function to ensure HomeCharacters exist
async function ensureHomeCharactersExist(category: string, characters: any[], startOrder: number = 0) {
  let order = startOrder;
  
  for (const character of characters) {
    // Check if this character already exists in the database
    const existingCharacter = await prisma.homeCharacter.findFirst({
      where: {
        name: character.name,
        category: category
      }
    });
    
    if (!existingCharacter) {
      console.log(`Creating home character: ${character.name} in category ${category}`);
      
      // Generate avatar URL if not provided
      let imageUrl = character.imageUrl || null;
      if (!imageUrl) {
        try {
          // Convert null to undefined for generateAvatar
          const description: string | undefined = character.description === null 
            ? undefined 
            : character.description;
            
          imageUrl = await generateAvatar(character.name, description);
        } catch (error) {
          console.error(`Failed to generate avatar for ${character.name}:`, error);
          // Fallback to robohash
          imageUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        }
      }
      
      // Create the HomeCharacter record
      await prisma.homeCharacter.create({
        data: {
          name: character.name,
          description: character.description || null,
          imageUrl: imageUrl,
          category: category,
          displayOrder: order
        }
      });
    }
    
    order++;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    
    // Ensure we have home characters in the database
    if (!category || category === "all") {
      // Seed default characters if needed
      await ensureHomeCharactersExist("popular", popularCharacters);
      await ensureHomeCharactersExist("educational", educationalCharacters, 100); // Start educational at order 100
    }
    
    // Query for the requested characters
    const where = category && category !== "all" ? { category } : {};
    
    const homeCharacters = await prisma.homeCharacter.findMany({
      where,
      orderBy: {
        displayOrder: "asc"
      }
    });
    
    return NextResponse.json(homeCharacters);
  } catch (error) {
    console.error("[HOME_CHARACTERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
