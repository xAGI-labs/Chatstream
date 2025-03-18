import axios from 'axios';

// In-memory cache for avatar URLs to avoid repeated API calls
const avatarCache: Record<string, string> = {};

// Track rate limiting to implement exponential backoff
let lastRequestTime = 0;
let consecutiveRateLimits = 0;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 10000;

// Cloudinary configuration constants
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe'; // Default for development
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder';

// Track API authentication status to avoid repeated failed calls
let togetherApiAuthenticated = true; // Start optimistic, will turn false if auth fails

/**
 * Check if an image already exists in Cloudinary cache
 */
async function checkCloudinaryCache(cacheKey: string): Promise<string | null> {
  try {
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${cacheKey}.png`;
    const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`Found cached avatar in Cloudinary: ${cacheKey}`);
      return cloudinaryUrl;
    }
    return null;
  } catch (error) {
    console.error("Error checking Cloudinary cache:", error);
    return null;
  }
}

/**
 * Upload image from URL to Cloudinary
 */
async function uploadToCloudinary(imageUrl: string, cacheKey: string): Promise<string | null> {
  try {
    if (!process.env.CLOUDINARY_API_KEY) {
      console.warn("Cloudinary API key not configured, skipping upload");
      return imageUrl; // Return original URL if Cloudinary is not configured
    }

    // Create a clean cache key - remove special chars
    const safeKey = cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    
    // Log the Cloudinary configuration
    console.log(`Cloudinary config: Cloud=${process.env.CLOUDINARY_CLOUD_NAME}, Preset=${process.env.CLOUDINARY_UPLOAD_PRESET}`);
    console.log(`Uploading image to Cloudinary with key: ${safeKey}`);
    
    // Create form data correctly for Cloudinary unsigned upload
    const formData = new FormData();
    formData.append('file', imageUrl); // Use the image URL as the file source
    formData.append('public_id', safeKey);
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET || 'placeholder');
    
    // Add API key for authentication
    if (process.env.CLOUDINARY_API_KEY) {
      formData.append('api_key', process.env.CLOUDINARY_API_KEY);
    }
    
    // Add timestamp for signed uploads (even though we're using unsigned)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    formData.append('timestamp', timestamp);
    
    // Log upload attempt
    console.log(`Attempting Cloudinary upload for ${safeKey}...`);
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME || 'dht33kdwe'}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    // Log the response status
    console.log(`Cloudinary upload response status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      const data = await uploadResponse.json();
      console.log(`Successfully uploaded to Cloudinary:`, data.secure_url);
      return data.secure_url;
    } else {
      const errorText = await uploadResponse.text();
      console.error(`Cloudinary upload failed (${uploadResponse.status}): ${errorText}`);
      return imageUrl; // Return original URL on failure
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return imageUrl; // Return original URL on error
  }
}

/**
 * Generate a placeholder avatar using Cloudinary for consistency
 * Instead of returning a data URI, this creates a Cloudinary-hosted placeholder
 */
async function getPlaceholderAvatar(name: string): Promise<string | null> {
  try {
    // Generate a consistent cache key based on name - make sure it's valid for URLs
    const cacheKey = `placeholder-${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    // Check if we already have this placeholder in Cloudinary
    const existingUrl = await checkCloudinaryCache(cacheKey);
    if (existingUrl) {
      console.log(`Using existing Cloudinary placeholder for ${name}: ${existingUrl}`);
      return existingUrl;
    }
    
    // If not in Cloudinary yet, create text overlay for the first letter
    const initial = encodeURIComponent(name.charAt(0).toUpperCase());
    const bgColors = ['3B82F6', '8B5CF6', 'EC4899', 'F97316', '10B981'];
    
    // Generate a consistent color based on the name
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bgColors.length;
    const bgColor = bgColors[colorIndex];
    
    // Create the final URL - IMPORTANT: public_id must be at the end of the URL!
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_200,h_200,c_fill,b_rgb:${bgColor},bo_0px_solid_rgb:ffffff/l_text:Arial_70_bold:${initial},co_white,c_fit,g_center/${cacheKey}`;
    
    console.log(`Generated Cloudinary placeholder for ${name}: ${cloudinaryUrl}`);
    
    // Try to access the URL to see if it exists/works
    try {
      const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`Cloudinary URL valid and accessible: ${cloudinaryUrl}`);
        return cloudinaryUrl;
      } else {
        console.warn(`Generated Cloudinary URL not accessible: ${response.status}`);
        // We'll continue and try to create a real placeholder below
      }
    } catch (e) {
      console.error(`Error checking Cloudinary URL: ${e}`);
    }
    
    // Actually create a placeholder on Cloudinary (we only do this if the URL doesn't already exist)
    // This uses the "upload" method which requires authentication
    try {
      // Create a simple SVG with the initial
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect width="200" height="200" fill="#${bgColor}" />
          <text x="50%" y="50%" dy=".1em" font-family="Arial, sans-serif" font-size="100" 
            fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text>
        </svg>
      `;
      
      // Convert SVG to a blob
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const formData = new FormData();
      formData.append('file', svgBlob, 'avatar.svg');
      formData.append('public_id', cacheKey);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || 'placeholder');
      
      if (CLOUDINARY_API_KEY) {
        formData.append('api_key', CLOUDINARY_API_KEY);
      }
      
      const timestamp = Math.floor(Date.now() / 1000).toString();
      formData.append('timestamp', timestamp);
      
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        console.log(`Successfully created placeholder in Cloudinary for ${name}: ${data.secure_url}`);
        return data.secure_url;
      } else {
        console.error(`Failed to create placeholder in Cloudinary: ${await uploadResponse.text()}`);
      }
    } catch (uploadError) {
      console.error(`Error creating placeholder in Cloudinary: ${uploadError}`);
    }
    
    // If we reach here, we couldn't create a proper Cloudinary placeholder, so return the URL anyway
    // It might work for pre-existing resources
    return cloudinaryUrl;
  } catch (error) {
    console.error("Error creating placeholder in Cloudinary:", error);
    
    // As a last resort fallback, return a simple URL that would work with the character's initial
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.charAt(0))}&background=random&color=fff&size=200`;
    return fallbackUrl;
  }
}

/**
 * Check if Together API key is valid by making a small test request
 */
export async function validateTogetherApiKey(): Promise<boolean> {
  if (!process.env.TOGETHER_API_KEY) {
    console.warn("Together API key is not set");
    return false;
  }
  
  // Only validate if we haven't confirmed it's invalid
  if (!togetherApiAuthenticated) return false;
  
  try {
    // Make a minimal API call to validate the key
    const response = await axios.get("https://api.together.xyz/api/info", {
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
      },
      timeout: 5000 // Short timeout for quick validation
    });
    
    // If we get here, the API key is valid
    togetherApiAuthenticated = true;
    return true;
  } catch (error: any) {
    // Check specifically for auth errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Together API key is invalid or expired");
      togetherApiAuthenticated = false;
      return false;
    }
    
    // For other errors, we'll assume the key might still be valid
    console.warn("Error validating Together API key, may still be usable:", error.message);
    return true;
  }
}

/**
 * Generate an avatar image using the Together AI API with improved storage using Cloudinary
 */
export async function generateAvatar(
  name: string,
  description?: string
): Promise<string | null> {
  // Create cache key
  const baseKey = `avatar-${name}-${description || ''}`;
  const cacheKey = baseKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  
  // Add more detailed logging
  console.log(`Generating avatar for "${name}" with cache key "${cacheKey}"`);
  
  // Check memory cache first
  if (avatarCache[cacheKey]) {
    console.log(`CACHE HIT: Using cached avatar URL for "${name}":`, avatarCache[cacheKey]);
    return avatarCache[cacheKey];
  }
  
  // Check Cloudinary cache
  console.log(`Checking Cloudinary cache for "${cacheKey}"...`);
  const cloudinaryUrl = await checkCloudinaryCache(cacheKey);
  if (cloudinaryUrl) {
    console.log(`CLOUDINARY CACHE HIT: Using Cloudinary avatar for ${name}:`, cloudinaryUrl);
    // Store in memory cache and return
    avatarCache[cacheKey] = cloudinaryUrl;
    return cloudinaryUrl;
  }

  // If we've previously determined the Together API key is invalid, skip trying
  if (!togetherApiAuthenticated) {
    console.log(`Together API key is invalid, using Cloudinary placeholder for ${name}`);
    // Generate a Cloudinary placeholder instead of data URI
    return await getPlaceholderAvatar(name);
  }

  // Validate the Together API key before proceeding
  const isApiValid = await validateTogetherApiKey();
  if (!isApiValid) {
    console.log(`Together API key validation failed, using Cloudinary placeholder for ${name}`);
    // Generate a Cloudinary placeholder instead of data URI
    return await getPlaceholderAvatar(name);
  }

  // Apply rate limiting with exponential backoff
  const now = Date.now();
  let delay = MIN_DELAY_MS * Math.pow(1.5, consecutiveRateLimits);
  delay = Math.min(delay, MAX_DELAY_MS);
  
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < delay) {
    console.log(`Rate limiting (backoff: ${delay}ms) for:`, name);
    await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();

  // Generate new avatar with Together API
  try {
    const prompt = description
      ? `A portrait of ${name}, who is ${description}. Detailed, high quality.`
      : `A portrait of a character named ${name}. Detailed, high quality.`;
    
    console.log("Generating avatar for:", name);
    
    // Use the worker URL instead of calling Together API directly
    const encodedPrompt = encodeURIComponent(prompt);
    const workerUrl = `https://placeholder.sauravalgs.workers.dev/together?prompt=${encodedPrompt}`;
    
    console.log(`Calling worker URL: ${workerUrl}`);
    const response = await axios.get(workerUrl, {
      timeout: 20000
    });
    
    // Reset consecutive rate limits on success
    consecutiveRateLimits = 0;
    
    if (!response.data?.data?.[0]?.url) {
      throw new Error("Invalid response from Together API");
    }
    
    const imageUrl = response.data.data[0].url;
    console.log(`Generated Together API avatar for ${name}:`, imageUrl);
    
    // Upload to Cloudinary for persistence
    console.log(`Uploading Together API result to Cloudinary for ${name}...`);
    const persistentUrl = await uploadToCloudinary(imageUrl, cacheKey);
    console.log(`Cloudinary result for ${name}:`, persistentUrl || "Failed - using original URL");
    
    // Store in memory cache - prioritize Cloudinary URL
    const finalUrl = persistentUrl || imageUrl;
    avatarCache[cacheKey] = finalUrl;
    
    return finalUrl;
  } catch (error: any) {
    console.error("Error generating avatar with Together API:", error);
    
    // Check for authentication errors specifically
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("Together API authentication failed - API key may be invalid or expired");
      togetherApiAuthenticated = false; // Mark as invalid to avoid retrying
      
      // Generate a Cloudinary placeholder instead of data URI
      return await getPlaceholderAvatar(name);
    }
    
    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      consecutiveRateLimits++;
      console.log(`Rate limited by Together API (${consecutiveRateLimits} consecutive), using Cloudinary placeholder for:`, name);
      
      // Generate a Cloudinary placeholder instead of data URI
      return await getPlaceholderAvatar(name);
    }
    
    // For non-rate limit errors, still increment consecutive count to slow down
    consecutiveRateLimits++;
    
    // Create a Cloudinary placeholder instead of data URI
    return await getPlaceholderAvatar(name);
  }
}

// Export the cache so other modules can access it
export const getAvatarCache = () => avatarCache;

// Clear all consecutive rate limit counts (useful after long pauses)
export const resetRateLimitTracking = () => {
  consecutiveRateLimits = 0;
};

// Reset Together API authenticated status (for testing)
export const resetTogetherApiStatus = () => {
  togetherApiAuthenticated = true;
};
