#!/usr/bin/env node

/**
 * This script validates the environment variables setup for ChatStream
 * It checks for required API keys and their formats
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BLUE}${BOLD}ChatStream Environment Validator${RESET}\n`);

// Read .env.local if it exists
let envVars = {};
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  console.log(`${BLUE}Reading .env.local file...${RESET}`);
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse ENV variables
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
      }
    }
  });
} else {
  console.log(`${YELLOW}No .env.local file found. Checking environment variables...${RESET}`);
}

// Combine with process.env
envVars = { ...envVars, ...process.env };

// Define validators for specific API keys
const validators = {
  OPENAI_API_KEY: (key) => {
    if (!key) return { valid: false, message: 'Missing' };
    if (!key.startsWith('sk-')) return { valid: false, message: 'Invalid format (should start with sk-)' };
    if (key.length < 30) return { valid: false, message: 'Too short, likely invalid' };
    return { valid: true, message: 'Valid' };
  },
  
  TOGETHER_API_KEY: (key) => {
    if (!key) return { valid: false, message: 'Missing (optional)' };
    return { valid: true, message: 'Present' };
  },
  
  // Add other validators for different API keys
};

// Check critical API keys
console.log(`\n${BOLD}Critical API Keys:${RESET}`);
let hasErrors = false;

Object.keys(validators).forEach(key => {
  const value = envVars[key] || '';
  const result = validators[key](value);
  
  const sanitizedValue = value 
    ? `${value.substring(0, 5)}...${value.substring(value.length - 4)}` 
    : '(not set)';
  
  const status = result.valid 
    ? `${GREEN}✓ ${result.message}${RESET}` 
    : `${RED}✗ ${result.message}${RESET}`;
  
  console.log(`${key}: ${sanitizedValue} - ${status}`);
  
  if (!result.valid && key === 'OPENAI_API_KEY') {
    hasErrors = true;
  }
});

// Validate the pipecat-service setup
console.log(`\n${BOLD}Voice Service Configuration:${RESET}`);

try {
  const pipecatPath = path.join(process.cwd(), 'pipecat-service');
  
  if (fs.existsSync(pipecatPath)) {
    console.log(`${BLUE}Checking voice service...${RESET}`);
    
    // Check if we can install dependencies
    try {
      console.log(`Testing pip installation...`);
      execSync('pip --version', { stdio: 'pipe' });
      console.log(`${GREEN}✓ pip is available${RESET}`);
    } catch (e) {
      console.log(`${RED}✗ pip not found - voice service might not work${RESET}`);
      hasErrors = true;
    }
    
    // Check for OpenAI package
    try {
      console.log(`Testing OpenAI package...`);
      execSync('pip show openai', { stdio: 'pipe' });
      console.log(`${GREEN}✓ OpenAI package is installed${RESET}`);
    } catch (e) {
      console.log(`${YELLOW}! OpenAI package not found - will be installed when service starts${RESET}`);
    }
  } else {
    console.log(`${RED}✗ Voice service directory not found - voice chat will not work${RESET}`);
    hasErrors = true;
  }
} catch (e) {
  console.log(`${RED}✗ Error checking voice service: ${e.message}${RESET}`);
  hasErrors = true;
}

// Provide overall status and recommendations
console.log('\n' + '-'.repeat(50));
if (hasErrors) {
  console.log(`${RED}${BOLD}Configuration Issues Detected${RESET}`);
  console.log(`Please fix the issues above for proper functionality.`);
  
  // Provide specific advice for OpenAI API key issues
  if (!envVars.OPENAI_API_KEY || !envVars.OPENAI_API_KEY.startsWith('sk-')) {
    console.log(`\n${YELLOW}OpenAI API Key Setup Instructions:${RESET}`);
    console.log(`1. Get your API key from https://platform.openai.com/account/api-keys`);
    console.log(`2. Add to .env.local file: OPENAI_API_KEY=sk-your-key-here`);
    console.log(`3. Restart the server and voice service`);
  }
} else {
  console.log(`${GREEN}${BOLD}All Critical Configurations Validated!${RESET}`);
  console.log(`The application should function correctly.`);
}

console.log('\n' + '-'.repeat(50));
