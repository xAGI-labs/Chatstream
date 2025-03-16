import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { popularCharacters, educationalCharacters } from "@/components/characters/character-data";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// Default empty string for image URL when no image is available
const DEFAULT_IMAGE_URL = ""; // Use empty string instead of null

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
      
      // IMPORTANT: Use Together API to generate images, NOT Robohash
      let imageUrl: string = character.imageUrl || DEFAULT_IMAGE_URL; // Never use null, use empty string
      
      // Only attempt to generate an image if Together API key exists and we don't have an image
      if (imageUrl === DEFAULT_IMAGE_URL && process.env.TOGETHER_API_KEY) {
        try {
          // Convert null to undefined for generateAvatar
          const description: string | undefined = character.description === null 
            ? undefined 
            : character.description;
            
          // Use Together AI to generate a high quality image
          const generatedUrl = await generateAvatar(character.name, description);
          if (generatedUrl) {
            imageUrl = generatedUrl;
            console.log(`Generated image URL for ${character.name}:`, imageUrl);
          }
        } catch (error) {
          console.error(`Failed to generate avatar for ${character.name}:`, error);
          // Keep the default empty string 
        }
      }
      
      // Create the HomeCharacter record - never use null for imageUrl
      await prisma.homeCharacter.create({
        data: {
          name: character.name,
          description: character.description || null,
          imageUrl: imageUrl, // Always a string, never null
          category: category,
          displayOrder: order
        }
      });
    } else if ((!existingCharacter.imageUrl || existingCharacter.imageUrl === DEFAULT_IMAGE_URL) && 
               process.env.TOGETHER_API_KEY) {
      // Only try to update missing images if Together API key exists
      try {
        console.log(`Attempting to generate image for ${character.name} with missing avatar`);
        const description: string | undefined = existingCharacter.description || undefined;
        
        // Use Together AI to generate a high quality image
        const imageUrl = await generateAvatar(character.name, description);
        
        if (imageUrl) { // Only update if we got a valid URL
          await prisma.homeCharacter.update({
            where: { id: existingCharacter.id },
            data: { 
              imageUrl // This will be a string, not null
            }
          });
          console.log(`Updated avatar for ${character.name} to Together-generated URL`);
        }
      } catch (error) {
        console.error(`Failed to generate avatar for ${character.name}:`, error);
        // Don't update if generation fails
      }
    }
    
    order++;
  }
}

// Helper function to check if a URL is likely a Together AI URL that might expire
function isExpiringTogetherUrl(url: string): boolean {
  return url.includes('X-Amz-Expires=') && 
         (url.includes('together-ai') || url.includes('api.together.ai'));
}

// Helper function to convert a potentially expiring URL to a proxied version
function getReliableImageUrl(url: string | null): string {
  if (!url) return '';
  
  // If it's a Together AI URL, use our proxy to ensure reliability
  if (isExpiringTogetherUrl(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
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
    
    // Process image URLs to make them more reliable in production
    const processedCharacters = characters.map(character => ({
      ...character,
      imageUrl: getReliableImageUrl(character.imageUrl)
    }));
    
    // IMPORTANT: Do NOT modify the imageUrl - return exactly what's in the database
    // Log data for debugging
    console.log(`HOME_CHARACTERS: Returning ${processedCharacters.length} characters for ${category}`);
    console.table(processedCharacters.map(c => ({
      name: c.name,
      hasImage: !!c.imageUrl,
      isProxied: c.imageUrl?.includes('/api/image-proxy')
    })));
    
    return NextResponse.json(processedCharacters);
  } catch (error) {
    console.error("[HOME_CHARACTERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
