import { NextResponse } from "next/server";
import axios from "axios";

// Simple proxy to reliably serve images from Together AI
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");
    
    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 });
    }
    
    // Decode the URL - it might be double-encoded
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Add validation to prevent abuse
    if (!decodedUrl.includes("together-ai") && 
        !decodedUrl.includes("api.together.ai") && 
        !decodedUrl.startsWith("https://")) {
      return new NextResponse("Invalid image URL", { status: 400 });
    }

    console.log(`Proxying image: ${decodedUrl.substring(0, 50)}...`);
    
    // Fetch the image using axios with appropriate timeout
    const response = await axios.get(decodedUrl, { 
      responseType: "arraybuffer",
      timeout: 5000,
      headers: {
        "Accept": "image/jpeg,image/png,image/*"
      }
    });
    
    // Return the image with proper cache headers
    return new NextResponse(response.data, {
      headers: {
        "Content-Type": response.headers["content-type"] || "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      }
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return new NextResponse("Failed to proxy image", { status: 500 });
  }
}
