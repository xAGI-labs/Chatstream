import fs from 'fs';
import path from 'path';
import axios from 'axios';

const AVATAR_DIR = path.join(process.cwd(), 'public/avatars');

// Ensure avatar directory exists
if (!fs.existsSync(AVATAR_DIR)) {
  try {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create avatar directory:', error);
  }
}

/**
 * Generate an avatar image using the Together AI API
 * 
 * @param name The name to base the avatar generation on
 * @param description Optional additional description for better avatar generation
 * @returns The URL to the generated avatar or null if generation failed
 */
export async function generateAvatar(
  name: string,
  description?: string
): Promise<string | null> {
  try {
    // Create a prompt that includes character details
    const prompt = description
      ? `A portrait of ${name}, who is ${description}. Detailed, high quality.`
      : `A portrait of a character named ${name}. Detailed, high quality.`;
    
    console.log("Generating avatar for:", name);
    console.log("Using API key:", process.env.TOGETHER_API_KEY?.substring(0, 5) + "...");
    
    // Use the Together API endpoint from the curl example
    const response = await axios.post(
      "https://api.together.xyz/v1/images/generations",
      {
        model: "black-forest-labs/FLUX.1-dev",
        prompt: prompt,
        width: 256,
        height: 256,
        steps: 28,
        n: 1,
        response_format: "b64_json"
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("Response status:", response.status);
    
    // Check if we got a valid response with an image
    if (
      !response.data ||
      !response.data.data ||
      !response.data.data[0] ||
      !response.data.data[0].b64_json
    ) {
      console.error("Invalid API response:", JSON.stringify(response.data));
      throw new Error("Invalid response from Together AI API");
    }
    
    // Get the base64 image data
    const imageData = response.data.data[0].b64_json;
    
    // Create a unique filename
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${Date.now()}-${sanitizedName}.png`;
    const filePath = path.join(AVATAR_DIR, filename);
    
    // Save the image to the file system
    const buffer = Buffer.from(imageData, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    console.log("Avatar generated successfully:", filename);
    
    // Return the URL path to the image
    return `/avatars/${filename}`;
  } catch (error) {
    console.error("Error generating avatar with Together API:", error);
    return null;
  }
}
