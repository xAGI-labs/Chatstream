import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// Helper to ensure URLs are absolute for production and never null
function ensureAbsoluteUrl(url: string | null): string {
  if (!url) {
    return `https://robohash.org/default-avatar?size=200x200&set=set4`;
  }
  
  // If URL is already absolute, return it
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  
  // For relative URLs in database, make them absolute with a more reliable approach
  console.log('Found relative URL in database - converting to absolute:', url);
  
  // Force absolute URLs to use HTTPS for production
  return `https://robohash.org/${encodeURIComponent(url.replace(/[^\w]/g, '-'))}?set=set4&size=200x200`;
}

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
      
      // Generate avatar URL if not provided - ENSURE IT'S ALWAYS A STRING, NEVER NULL
      let imageUrl: string = character.imageUrl || '';
      
      if (!imageUrl) {
        try {
          // Use absolute URL-generating avatar service
          const generatedUrl = await generateAvatar(character.name, character.description);
          
          // Double-check that the URL is absolute, fallback if not
          imageUrl = generatedUrl && generatedUrl.startsWith('http')
            ? generatedUrl
            : `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        } catch (error) {
          console.error(`Failed to generate avatar for ${character.name}:`, error);
          imageUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        }
      }
      
      // Create the HomeCharacter with absolute URL - never null
      await prisma.homeCharacter.create({
        data: {
          name: character.name,
          description: character.description || null,
          imageUrl: ensureAbsoluteUrl(imageUrl), // This will now always return a string
          category: category,
          displayOrder: order
        }
      });
    } else if (!existingCharacter.imageUrl || !existingCharacter.imageUrl.startsWith('http')) {
      // If character exists but doesn't have a valid avatar, update it
      
      try {
        // Convert null to undefined for generateAvatar
        const description: string | undefined = existingCharacter.description || undefined;
        
        let imageUrl = '';
        try {
          const generatedUrl = await generateAvatar(character.name, description);
          imageUrl = generatedUrl || '';
        } catch (error) {
          console.error(`Failed to generate new avatar for ${character.name}:`, error);
        }
        
        // Update the existing record with the new avatar
        // Ensure we never pass null to imageUrl
        const absoluteUrl = imageUrl && imageUrl.startsWith('http') 
          ? imageUrl 
          : `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        
        await prisma.homeCharacter.update({
          where: { id: existingCharacter.id },
          data: { 
            imageUrl: absoluteUrl // This is always a string, never null
          }
        });
        
        console.log(`Updated avatar for ${character.name}`);
      } catch (error) {
        console.error(`Failed to update avatar for ${character.name}:`, error);
        // Fallback to robohash with absolute URL
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
    
    // FIX ALL URLs: Ensure every single URL is absolute and never null
    const fixedCharacters = characters.map(character => {
      // Process the character to ensure imageUrl is always an absolute URL string
      let processedImageUrl: string = character.imageUrl || '';
      
      // If URL isn't absolute or is missing, create a direct robohash URL
      if (!processedImageUrl || !processedImageUrl.startsWith('http')) {
        processedImageUrl = `https://robohash.org/${encodeURIComponent(character.name)}?size=200x200&set=set4`;
        
        // Update the database in the background for future requests
        (async () => {
          try {
            await prisma.homeCharacter.update({
              where: { id: character.id },
              data: { imageUrl: processedImageUrl }
            });
            console.log(`Updated ${character.name}'s imageUrl to absolute URL`);
          } catch (err) {
            console.error(`Failed to update ${character.name}'s imageUrl:`, err);
          }
        })();
      }
      
      return {
        ...character,
        imageUrl: processedImageUrl
      };
    });
    
    // Debug log all the characters and their image URLs
    console.log(`HOME_CHARACTERS: Returning ${fixedCharacters.length} characters for ${category}`);
    console.table(fixedCharacters.map(c => ({
      name: c.name,
      hasImage: !!c.imageUrl,
      imageUrl: c.imageUrl?.substring(0, 30) + '...',
      absolute: !!c.imageUrl?.startsWith('http')
    })));
    
    return NextResponse.json(fixedCharacters);
  } catch (error) {
    console.error("[HOME_CHARACTERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
