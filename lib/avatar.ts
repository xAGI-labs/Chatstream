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
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'chatstream_avatars';

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
    if (!CLOUDINARY_API_KEY) {
      console.warn("Cloudinary API key not configured, skipping upload");
      return imageUrl; // Return original URL if Cloudinary is not configured
    }

    // Create a clean cache key - remove special chars
    const safeKey = cacheKey.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    
    // Upload image to Cloudinary
    console.log(`Uploading image to Cloudinary with key: ${safeKey}`);
    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('public_id', safeKey);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    if (uploadResponse.ok) {
      const data = await uploadResponse.json();
      console.log(`Successfully uploaded avatar to Cloudinary: ${data.secure_url}`);
      return data.secure_url;
    } else {
      const errorText = await uploadResponse.text();
      console.error(`Cloudinary upload failed: ${errorText}`);
      return imageUrl; // Return original URL on failure
    }
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return imageUrl; // Return original URL on error
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
  
  // Check memory cache first
  if (avatarCache[cacheKey]) {
    console.log("Using cached avatar URL for:", name);
    return avatarCache[cacheKey];
  }
  
  // Check Cloudinary cache
  const cloudinaryUrl = await checkCloudinaryCache(cacheKey);
  if (cloudinaryUrl) {
    console.log(`Using Cloudinary cached avatar for ${name} at: ${cloudinaryUrl}`);
    // Store in memory cache and return
    avatarCache[cacheKey] = cloudinaryUrl;
    return cloudinaryUrl;
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
    
    const response = await axios.post(
      "https://api.together.xyz/v1/images/generations",
      {
        model: "black-forest-labs/FLUX.1-dev",
        prompt,
        width: 256,
        height: 256,
        steps: 28,
        n: 1,
        response_format: "url"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );
    
    // Reset consecutive rate limits on success
    consecutiveRateLimits = 0;
    
    if (!response.data?.data?.[0]?.url) {
      throw new Error("Invalid response from Together API");
    }
    
    const imageUrl = response.data.data[0].url;
    console.log("Avatar generated successfully:", imageUrl);
    
    // Upload to Cloudinary for persistence
    const persistentUrl = await uploadToCloudinary(imageUrl, cacheKey);
    console.log(`Avatar stored in Cloudinary: ${persistentUrl || 'Failed - using original URL'}`);
    
    // Store in memory cache
    avatarCache[cacheKey] = persistentUrl || imageUrl;
    
    return persistentUrl || imageUrl;
  } catch (error: any) {
    console.error("Error generating avatar with Together API:", error);
    
    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      consecutiveRateLimits++;
      console.log(`Rate limited by Together API (${consecutiveRateLimits} consecutive), using fallback for:`, name);
      
      // We no longer use Robohash as a fallback - instead return null
      // which will result in using a default avatar placeholder
      return null;
    }
    
    // For non-rate limit errors, still increment consecutive count to slow down
    consecutiveRateLimits++;
    return null;
  }
}

// Export the cache so other modules can access it
export const getAvatarCache = () => avatarCache;

// Clear all consecutive rate limit counts (useful after long pauses)
export const resetRateLimitTracking = () => {
  consecutiveRateLimits = 0;
};
