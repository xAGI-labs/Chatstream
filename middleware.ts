import { clerkMiddleware } from '@clerk/nextjs/server'

// Skip the middleware during build
const isBuild = process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;

// Use a dummy middleware during build to avoid errors
const buildMiddleware = (req: Request) => new Response(null);

// Export the appropriate middleware function
export default isBuild ? buildMiddleware : clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
