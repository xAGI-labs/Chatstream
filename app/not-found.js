"use client"

import Link from 'next/link';

// Simple not-found page that doesn't use Clerk authentication
export default function NotFound() {
  // Don't try to use authentication during build
  const isBuild = typeof window === 'undefined' && process.env.NODE_ENV === 'production';
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link 
            href="/" 
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
