import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"
import { generateAvatar } from "@/lib/avatar"

const prisma = new PrismaClient()

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_token')?.value

  if (!token) {
    return false
  }

  // Verify the token (simplified check for example purposes)
  // In a real implementation, you would verify the token more securely
  return token.length > 0
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = params
    
    // Check if character exists
    const character = await prisma.homeCharacter.findUnique({
      where: { id }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Generate new avatar
    let imageUrl = ""
    try {
      console.log(`Regenerating avatar for ${character.name}...`)
      const generatedUrl = await generateAvatar(character.name, character.description || undefined)
      if (generatedUrl) {
        imageUrl = generatedUrl
        
        // Update the character with new image
        await prisma.homeCharacter.update({
          where: { id },
          data: { imageUrl }
        })
        
        return NextResponse.json({ success: true, imageUrl })
      } else {
        return new NextResponse("Failed to generate image", { status: 500 })
      }
    } catch (error) {
      console.error(`Failed to regenerate avatar for ${character.name}:`, error)
      return new NextResponse("Error generating image", { status: 500 })
    }
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_REGENERATE_IMAGE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
