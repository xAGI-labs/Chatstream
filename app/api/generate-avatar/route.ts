import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateAvatar } from "@/lib/avatar";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { name, description } = await req.json();
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    
    // Use Together AI to generate an avatar
    const avatarUrl = await generateAvatar(name, description);
    
    if (!avatarUrl) {
      return new NextResponse("Failed to generate avatar", { status: 500 });
    }
    
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Error in generate-avatar route:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
