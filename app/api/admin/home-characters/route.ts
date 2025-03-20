import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { generateAvatar } from "@/lib/avatar"
import { cookies } from "next/headers"

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

export async function GET(req: Request) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "10")
    const search = url.searchParams.get("search") || ""
    
    const skip = (page - 1) * limit
    
    // Build search filter
    let where = {}
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
    }
    
    // Get total count for pagination
    const total = await prisma.homeCharacter.count({ where })
    
    // Get characters with pagination
    const characters = await prisma.homeCharacter.findMany({
      where,
      orderBy: {
        displayOrder: 'asc'
      },
      skip,
      take: limit
    })
    
    return NextResponse.json({
      characters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { name, description, category } = body
    
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }
    
    if (!category) {
      return new NextResponse("Category is required", { status: 400 })
    }
    
    // Get the highest display order for this category
    const highestOrder = await prisma.homeCharacter.findFirst({
      where: { category },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    })
    
    const nextDisplayOrder = (highestOrder?.displayOrder || 0) + 1
    
    // Generate avatar
    let imageUrl = ""
    try {
      console.log(`Generating avatar for ${name}...`)
      const generatedUrl = await generateAvatar(name, description || undefined)
      if (generatedUrl) {
        imageUrl = generatedUrl
      }
    } catch (error) {
      console.error(`Failed to generate avatar for ${name}:`, error)
    }
    
    // Create character
    const character = await prisma.homeCharacter.create({
      data: {
        name,
        description: description || null,
        imageUrl,
        category,
        displayOrder: nextDisplayOrder
      }
    })
    
    return NextResponse.json(character)
  } catch (error) {
    console.error("[ADMIN_HOME_CHARACTER_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
