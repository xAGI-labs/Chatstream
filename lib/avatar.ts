import axios from 'axios';

// In-memory cache for avatar URLs to avoid repeated API calls
const avatarCache: Record<string, string> = {};

/**
 * Generate an avatar image using the Together AI API with rate limiting handling
 * 
 * @param name The name to base the avatar generation on
 * @param description Optional additional description for better avatar generation
 * @returns The URL to the generated avatar or null if generation failed
 */
export async function generateAvatar(
  name: string,
  description?: string
): Promise<string | null> {
  // Check cache first
  const cacheKey = `avatar-${name}-${description || ''}`;
  if (avatarCache[cacheKey]) {
    console.log("Using cached avatar for:", name);
    return avatarCache[cacheKey];
  }

  try {
    // Create a prompt that includes character details
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
        // Add timeout to prevent hanging requests
        timeout: 15000
      }
    );
    
    console.log("Response status:", response.status);
    
    if (!response.data?.data?.[0]?.url) {
      throw new Error("Invalid response from Together API");
    }
    
    const imageUrl = response.data.data[0].url;
    console.log("Avatar generated successfully:", imageUrl);
    
    // Cache the result
    avatarCache[cacheKey] = imageUrl;
    
    return imageUrl;
  } catch (error: any) {
    console.error("Error generating avatar with Together API:", error);
    
    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      console.log("Rate limited by Together API, using fallback for:", name);
      // Use robohash as fallback when rate limited
      const fallbackUrl = `https://robohash.org/${encodeURIComponent(name)}?size=256x256&set=set4`;
      // Cache the fallback to avoid further API calls
      avatarCache[cacheKey] = fallbackUrl;
      return fallbackUrl;
    }
    
    return null;
  }
}

// Export the cache so other modules can access it
export const getAvatarCache = () => avatarCache;
