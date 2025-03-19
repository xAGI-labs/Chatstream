/**
 * Define build-time environment variables to allow successful static generation
 */
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_mock-clerk-key-for-build-12345';
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_mock-clerk-secret-key-for-build';
process.env.DISABLE_STATIC_GEN = 'true';
