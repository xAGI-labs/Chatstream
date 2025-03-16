import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateAvatar } from "@/lib/avatar";

const prisma = new PrismaClient();

// This endpoint refreshes expired Together AI image URLs
export async function GET(req: Request) {
  const url = new URL(req.url);
  const characterId = url.searchParams.get("characterId");
  const type = url.searchParams.get("type") || "homeCharacter"; // homeCharacter or character
  
  if (!characterId) {
    return NextResponse.json({ error: "Character ID is required" }, { status: 400 });
  }
  
  try {
    let character;
    let imageUrl: string | null = null;
    
    // Fetch character based on type
    if (type === "homeCharacter") {
      character = await prisma.homeCharacter.findUnique({
        where: { id: characterId }
      });
    } else {
      character = await prisma.character.findUnique({
        where: { id: characterId }
      });
    }
    
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }
    
    // First try using the existing URL if it's not from Together AI (and therefore not expired)
    if (character.imageUrl && !character.imageUrl.includes("together-ai") && !character.imageUrl.includes("X-Amz-Expires")) {
      return NextResponse.json({ 
        imageUrl: character.imageUrl,
        refreshed: false
      });
    }
    
    // Try to generate a new image 
    if (process.env.TOGETHER_API_KEY) {
      try {
        console.log(`Refreshing image for character ${character.name}...`);
        imageUrl = await generateAvatar(character.name, character.description || undefined);
        
        if (imageUrl) {
          // Update the character with the new image URL
          if (type === "homeCharacter") {
            await prisma.homeCharacter.update({
              where: { id: characterId },
              data: { imageUrl }
            });
          } else {
            await prisma.character.update({
              where: { id: characterId },
              data: { imageUrl }
            });
          }
          
          console.log(`Image refreshed for ${character.name}`);
        }
      } catch (error) {
        console.error(`Error refreshing image for ${character.name}:`, error);
      }
    }
    
    return NextResponse.json({
      imageUrl: imageUrl || character.imageUrl || "",
      refreshed: !!imageUrl
    });
  } catch (error) {
    console.error("Error refreshing image:", error);
    return NextResponse.json({ error: "Failed to refresh image" }, { status: 500 });
  }
}
