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
    const prompt = `A digital avatar portrait of a character named ${name}${
      description ? ` who is ${description}` : ''
    }. High quality, detailed, professional illustration style.`;
    
    const response = await axios.post(
      'https://api.together.xyz/v1/images/generations',
      {
        model: 'black-forest-labs/FLUX.1-dev',
        prompt,
        width: 256,
        height: 256,
        steps: 28,
        n: 1,
        response_format: 'b64_json'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].b64_json) {
      throw new Error('Invalid response from Together API');
    }
    
    // Get the base64 encoded image
    const b64Image = response.data.data[0].b64_json;
    
    // Create a unique ID for the image based on timestamp and name
    const imageId = `${Date.now()}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
    
    // Write the image to the file system
    const buffer = Buffer.from(b64Image, 'base64');
    const imagePath = path.join(AVATAR_DIR, `${imageId}.png`);
    fs.writeFileSync(imagePath, buffer);
    
    // Return the URL to access the image
    return `/avatars/${imageId}.png`;
  } catch (error) {
    console.error('Error generating avatar:', error);
    return null;
  }
}
