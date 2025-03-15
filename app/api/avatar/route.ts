import { NextResponse } from "next/server";

// Mark this as an edge runtime for faster responses
export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "Anonymous";
  const width = url.searchParams.get("width") || "100";
  const height = url.searchParams.get("height") || "100";
  
  // Create a Robohash URL for a robot avatar based on the name
  const robohashUrl = `https://robohash.org/${encodeURIComponent(name)}?size=${width}x${height}&set=set4`;
  
  // Redirect to the Robohash service
  return NextResponse.redirect(robohashUrl, 307);
}