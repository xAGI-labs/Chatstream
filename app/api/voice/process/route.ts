import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"  // Fixed import from server
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const VOICE_SERVICE_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    // Extract the form data from the request
    const formData = await req.formData()
    const audioBlob = formData.get('audio') as Blob
    const characterId = formData.get('characterId') as string
    
    if (!audioBlob || !characterId) {
      return new NextResponse("Missing required fields", { status: 400 })
    }
    
    // Get character information
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    })
    
    if (!character) {
      return new NextResponse("Character not found", { status: 404 })
    }
    
    // Create a new form data to send to the voice service
    const serviceFormData = new FormData()
    serviceFormData.append('audio_file', audioBlob)
    serviceFormData.append('character_id', character.id)
    serviceFormData.append('character_name', character.name)
    serviceFormData.append('character_instructions', 
      character.instructions || `You are ${character.name}. ${character.description || ''}`)
    
    // Call the voice service
    const response = await fetch(`${VOICE_SERVICE_URL}/api/voice/process`, {
      method: 'POST',
      body: serviceFormData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Voice service error: ${errorText}`)
      return new NextResponse(`Voice service error: ${errorText}`, { 
        status: response.status 
      })
    }
    
    // Return the response from the voice service
    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error("[VOICE_PROCESS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
