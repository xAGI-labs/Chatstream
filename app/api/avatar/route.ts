import { NextResponse } from "next/server";
import { generateAvatar, getAvatarCache, resetRateLimitTracking } from "@/lib/avatar";
import { PrismaClient } from "@prisma/client";

// Use nodejs runtime for better compatibility with avatar generation
export const runtime = 'nodejs';

const prisma = new PrismaClient();

// Declare the global property to fix TypeScript error
declare global {
  var lastAvatarRequestTime: number | undefined;
  var rateLimitResetTimer: NodeJS.Timeout | undefined;
}

// Global avatar cache map persists between requests in development
// In production, consider using Redis or another persistent cache
const persistentCache: Record<string, string> = {};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const description = url.searchParams.get("description") || undefined;
  const width = url.searchParams.get("width") || "256";
  const height = url.searchParams.get("height") || "256";
  const checkDb = url.searchParams.get("checkDb") !== "false"; // Default to true
  
  console.log(`Avatar API: Requested avatar for ${name}`, { checkDb });
  
  // Generate cache key that includes description if available
  const cacheKey = `avatar-${name}${description ? `-${description}` : ''}`;
  
  // Check persistent cache first
  if (persistentCache[cacheKey]) {
    console.log("Avatar API: Using persistently cached avatar for:", name);
    return NextResponse.redirect(persistentCache[cacheKey]);
  }
  
  // Also check the in-memory cache from the avatar module
  const avatarCache = getAvatarCache();
  if (avatarCache[cacheKey]) {
    console.log("Avatar API: Using module cached avatar for:", name);
    persistentCache[cacheKey] = avatarCache[cacheKey];
    return NextResponse.redirect(avatarCache[cacheKey]);
  }
  
  // NEW: Try to find a stored avatar URL in the database first
  if (checkDb) {
    try {
      // Check HomeCharacter table first
      const homeChar = await prisma.homeCharacter.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (homeChar?.imageUrl) {
        console.log("Avatar API: Found HomeCharacter imageUrl for:", name);
        persistentCache[cacheKey] = homeChar.imageUrl;
        return NextResponse.redirect(homeChar.imageUrl);
      }
      
      // Also check Character table
      const character = await prisma.character.findFirst({
        where: { name },
        select: { imageUrl: true }
      });
      
      if (character?.imageUrl) {
        console.log("Avatar API: Found Character imageUrl for:", name);
        persistentCache[cacheKey] = character.imageUrl;
        return NextResponse.redirect(character.imageUrl);
      }
    } catch (error) {
      console.error("Avatar API: Error checking database for stored avatar:", error);
      // Continue with normal flow if database check fails
    }
  }

  // Reset rate limit tracking if it's been a while since the last request
  // This allows the system to recover after periods of inactivity
  const now = Date.now();
  const lastRequestTime = global.lastAvatarRequestTime || 0;
  if (now - lastRequestTime > 10000) {
    resetRateLimitTracking();
  }
  
  // Update last request time
  global.lastAvatarRequestTime = now;
  
  // Clear any existing timer and set a new one to reset rate limiting after 30 seconds of inactivity
  if (global.rateLimitResetTimer) {
    clearTimeout(global.rateLimitResetTimer);
  }
  global.rateLimitResetTimer = setTimeout(() => {
    resetRateLimitTracking();
  }, 30000);
  
  // Try to generate with Together API
  try {
    console.log("Avatar API: Attempting to generate avatar for:", name);
    
    if (process.env.TOGETHER_API_KEY) {
      const avatarUrl = await generateAvatar(name, description);
      
      if (avatarUrl) {
        // Store in persistent cache
        persistentCache[cacheKey] = avatarUrl;
        console.log("Avatar API: Generated Together avatar:", avatarUrl);
        
        return NextResponse.redirect(avatarUrl);
      }
    }
  } catch (error: any) {
    console.error("Avatar API: Avatar generation failed:", error);
  }
  
  // Fallback to Robohash
  console.log("Avatar API: Falling back to Robohash for:", name);
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  
  // Cache even the fallback to prevent future generation attempts for this name
  persistentCache[cacheKey] = robohashUrl;
  
  return NextResponse.redirect(robohashUrl);
}