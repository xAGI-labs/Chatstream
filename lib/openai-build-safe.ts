import OpenAI from 'openai';

// Check if we're in a build environment
const isBuildEnv = () => {
  return typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;
};

// Get a build-safe OpenAI client
export function getOpenAIClient() {
  // During build, return a mock client
  if (isBuildEnv()) {
    return createMockOpenAIClient();
  }
  
  // In runtime, use the real client
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Will be replaced with actual key at runtime
  });
}

// Create a mock OpenAI client for build time
function createMockOpenAIClient() {
  // Create a minimal mock that won't throw errors during build
  return {
    chat: {
      completions: {
        create: () => Promise.resolve({
          choices: [{ message: { content: 'Mock response for build' } }],
        }),
      },
    },
    // Add other methods as needed
  } as unknown as OpenAI;
}
