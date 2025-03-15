import { NextResponse } from "next/server";
import { generateAvatar } from '@/lib/avatar';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const width = parseInt(url.searchParams.get("width") || "256");
  const height = parseInt(url.searchParams.get("height") || "256");
  const imageId = url.searchParams.get("imageId");
  
  // If there's an imageId parameter, serve from our stored avatars
  if (imageId) {
    try {
      // You can implement logic to fetch from storage like S3/Cloudinary here
      // For now, we'll just redirect to the stored URL
      return NextResponse.redirect(`/avatars/${imageId}.png`);
    } catch (error) {
      console.error("Error serving stored avatar:", error);
      // Fall through to fallback
    }
  }
  
  // Default fallback to Robohash
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  return NextResponse.redirect(robohashUrl);
}