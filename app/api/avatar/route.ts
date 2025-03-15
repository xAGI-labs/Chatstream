import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const name = searchParams.get('name') || 'Avatar'
  const width = searchParams.get('width') || '100'
  const height = searchParams.get('height') || '100'
  
  // Redirect to the placeholder service
  const url = `https://placeholder.sauravalgs.workers.dev/together?prompt=${encodeURIComponent(name)}&width=${width}&height=${height}`
  
  return NextResponse.redirect(url)
}
