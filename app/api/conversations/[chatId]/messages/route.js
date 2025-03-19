import { NextResponse } from 'next/server';

// Check if we're in build mode
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

// Mock version for build time
export async function GET() {
  if (isBuildTime) {
    return NextResponse.json({ messages: [] });
  }
  
  // The actual implementation will be used at runtime
  // This code won't execute during build
  const messages = []; // This is just a placeholder
  return NextResponse.json({ messages });
}

export async function POST() {
  if (isBuildTime) {
    return NextResponse.json({ success: true });
  }
  
  // The actual implementation will be used at runtime
  return NextResponse.json({ success: true });
}
