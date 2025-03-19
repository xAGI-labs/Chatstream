/**
 * Mock environment variables for build time
 * This will be loaded during build to prevent authentication errors
 */
process.env = {
  ...process.env,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_dummy_clerk_publishable_key_for_build',
  CLERK_SECRET_KEY: 'sk_test_dummy_clerk_secret_key_for_build',
  OPENAI_API_KEY: 'sk-dummy-api-key-for-build',
  DATABASE_URL: 'postgresql://dummy:dummy@localhost:5432/dummy',
  TOGETHER_API_KEY: 'dummy_together_api_key',
  CLOUDINARY_API_KEY: 'dummy_cloudinary_key',
  DISABLE_STATIC_GEN: 'true'
};
