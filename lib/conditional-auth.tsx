"use client"

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

// Check if we're in a build/server environment without browser
const isBuildEnv = () => {
  return typeof window === 'undefined' && process.env.NODE_ENV === 'production';
}

// Clerk provider that conditionally renders during build
export function SafeClerkProvider({ children }: { children: React.ReactNode }) {
  // During build, just return children without wrapping them in ClerkProvider
  if (isBuildEnv()) {
    return <>{children}</>;
  }

  // In browser or dev environment, use the real ClerkProvider
  return <ClerkProvider>{children}</ClerkProvider>;
}

// Use this for components that need auth but should render safely during build
export function SafeAuthComponent({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode,
  fallback?: React.ReactNode
}) {
  if (isBuildEnv()) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
