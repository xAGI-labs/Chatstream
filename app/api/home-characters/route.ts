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
    } else if (!existingCharacter.imageUrl) {
      // If character exists but doesn't have an avatar, generate one and update the record
      console.log(`Updating existing character ${character.name} with missing avatar`);
      
      try {
        // Convert null to undefined for generateAvatar
        const description: string | undefined = existingCharacter.description || undefined;
        
        const imageUrl = await generateAvatar(character.name, description);
        
        // Update the existing record with the new avatar
        // Ensure we never pass null to imageUrl by using empty string as last resort
        await prisma.homeCharacter.update({
          where: { id: existingCharacter.id },
          data: { 
            imageUrl: imageUrl || `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`
          }
        });
        
        console.log(`Updated avatar for ${character.name}`);
      } catch (error) {
        console.error(`Failed to update avatar for ${character.name}:`, error);
        // Fallback to robohash
        const fallbackUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        
        await prisma.homeCharacter.update({
          where: { id: existingCharacter.id },
          data: { imageUrl: fallbackUrl }
        });
      }
    }
    
    order++;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "popular";
  
  try {
    // Ensure characters exist in DB before returning them
    if (category === "all" || category === "popular") {
      await ensureHomeCharactersExist("popular", popularCharacters, 0);
    }
    
    if (category === "all" || category === "educational") {
      await ensureHomeCharactersExist("educational", educationalCharacters, 100);
    }
    
    // Query characters from database based on category
    const query: any = {};
    if (category !== "all") {
      query.category = category;
    }
    
    const characters = await prisma.homeCharacter.findMany({
      where: query,
      orderBy: {
        displayOrder: 'asc'
      }
    });
    
    return NextResponse.json(characters);
  } catch (error) {
    console.error("[HOME_CHARACTERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
