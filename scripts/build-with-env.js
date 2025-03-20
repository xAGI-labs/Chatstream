// This script loads mock environment variables before running the build
const { execSync } = require('child_process');

console.log('Setting up build environment variables...');

// Set critical environment variables for the build process
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_SKIP_TYPE_CHECK = '1';
process.env.NEXT_SKIP_RENDER_COMPILATION = '1';
process.env.SKIP_BUILD_STATIC_GENERATION = '1';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_dummy-key-for-build';
process.env.CLERK_SECRET_KEY = 'sk_test_dummy-key-for-build';
process.env.OPENAI_API_KEY = 'sk_dummy_for_build';
process.env.TOGETHER_API_KEY = 'dummy_for_build';
process.env.DATABASE_URL = 'file:./dummy.db';

// Run the Next.js build with the environment variables
console.log('Starting Next.js build...');
try {
  execSync('next build', { 
    stdio: 'inherit',
    env: process.env
  });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
