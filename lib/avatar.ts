import axios from 'axios';

// In-memory cache for avatar URLs to avoid repeated API calls
const avatarCache: Record<string, string> = {};

// Track rate limiting to implement exponential backoff
let lastRequestTime = 0;
let consecutiveRateLimits = 0;
const MIN_DELAY_MS = 1500;
const MAX_DELAY_MS = 10000;

/**
 * Generate an avatar image using the Together AI API with improved rate limit handling
 */
export async function generateAvatar(
  name: string,
  description?: string
): Promise<string | null> {
  // Create cache key
  const cacheKey = `avatar-${name}-${description || ''}`;
  
  // Check memory cache first
  if (avatarCache[cacheKey]) {
    console.log("Using cached avatar for:", name);
    return avatarCache[cacheKey];
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
        prompt: prompt,
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
    
    // Store the full URL unchanged - this is the pre-signed URL
    const imageUrl = response.data.data[0].url;
    console.log("Avatar generated successfully:", imageUrl);
    
    // Store in memory cache
    avatarCache[cacheKey] = imageUrl;
    
    return imageUrl;
  } catch (error: any) {
    console.error("Error generating avatar with Together API:", error);
    
    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      consecutiveRateLimits++;
      console.log(`Rate limited by Together API (${consecutiveRateLimits} consecutive), using fallback for:`, name);
      const fallbackUrl = `https://robohash.org/${encodeURIComponent(name)}?size=256x256&set=set4`;
      
      // Cache the fallback to avoid further API calls
      avatarCache[cacheKey] = fallbackUrl;
      return fallbackUrl;
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
