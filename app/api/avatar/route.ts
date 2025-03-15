import { NextResponse } from "next/server";
import { generateAvatar, getAvatarCache } from "@/lib/avatar";

// Use nodejs runtime for better compatibility with avatar generation
export const runtime = 'nodejs';

// Global avatar cache map persists between requests in development
// In production, consider using Redis or another persistent cache
const persistentCache: Record<string, string> = {};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const width = url.searchParams.get("width") || "256";
  const height = url.searchParams.get("height") || "256";
  
  // Generate cache key
  const cacheKey = `avatar-${name}`;
  
  // Check persistent cache first
  if (persistentCache[cacheKey]) {
    console.log("Using persistently cached avatar for:", name);
    return NextResponse.redirect(persistentCache[cacheKey]);
  }
  
  // Also check the in-memory cache from the avatar module
  const avatarCache = getAvatarCache();
  if (Object.keys(avatarCache).some(key => key.startsWith(`avatar-${name}-`))) {
    const url = Object.entries(avatarCache)
      .find(([k]) => k.startsWith(`avatar-${name}-`))?.[1];
    
    if (url) {
      console.log("Using module cached avatar for:", name);
      persistentCache[cacheKey] = url;
      return NextResponse.redirect(url);
    }
  }
  
  // Try to generate with Together API with rate limit handling
  try {
    console.log("Attempting to generate avatar for:", name);
    
    if (process.env.TOGETHER_API_KEY) {
      // Add a simple rate limiting mechanism: don't make more than 1 request per second
      const lastRequestTime = global.lastAvatarRequestTime || 0;
      const now = Date.now();
      
      if (now - lastRequestTime < 1000) {
        console.log("Rate limiting ourselves, waiting a bit...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Update last request time
      global.lastAvatarRequestTime = Date.now();
      
      const avatarUrl = await generateAvatar(name);
      
      if (avatarUrl) {
        // Store in persistent cache
        persistentCache[cacheKey] = avatarUrl;
        console.log("Generated Together avatar:", avatarUrl);
        
        return NextResponse.redirect(avatarUrl);
      }
    }
  } catch (error) {
    console.error("Avatar generation failed:", error);
  }
  
  // Fallback to Robohash
  console.log("Falling back to Robohash for:", name);
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  
  // Cache even the fallback to prevent future generation attempts for this name
  persistentCache[cacheKey] = robohashUrl;
  
  return NextResponse.redirect(robohashUrl);
}