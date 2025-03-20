import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { cookies } from "next/headers"

const prisma = new PrismaClient()

// Admin authentication middleware
async function verifyAdminAuth() {
  const cookieStore = await cookies()
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
    const total = await prisma.character.count({ where })
    
    // Get characters with pagination
    const characters = await prisma.character.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
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
    console.error("[ADMIN_CHARACTERS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
