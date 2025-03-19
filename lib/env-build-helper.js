// This file helps differentiate between build time and runtime
// to prevent API calls during the build process

export const isBuildTime = () => {
  return process.env.NODE_ENV === 'production' && !process.env.NEXT_RUNTIME;
};

// Use this to safely get environment variables that might not be available during build
export const safeGetEnv = (key, defaultValue = '') => {
  if (isBuildTime()) {
    // During build, return mock values
    const mockValues = {
      OPENAI_API_KEY: 'sk_mock_for_build',
      CLERK_SECRET_KEY: 'sk_mock_for_build',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_mock_for_build',
      DATABASE_URL: 'file:./mock.db',
      // Add more as needed
    };
    return mockValues[key] || defaultValue;
  }
  
  // At runtime, return the actual environment variable
  return process.env[key] || defaultValue;
};

// For OpenAI specific initialization
export const getOpenAIConfig = () => {
  if (isBuildTime()) {
    return { apiKey: 'sk_mock_for_build' };
  }
  return { apiKey: process.env.OPENAI_API_KEY };
};
