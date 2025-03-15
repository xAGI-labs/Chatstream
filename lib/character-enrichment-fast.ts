import { getOpenAIClient } from './openai-optimized';

/**
 * Faster version of character description enrichment
 */
export async function fastEnrichCharacterDescription(name: string, userDescription?: string): Promise<{
  enhancedDescription: string;
  avatarPrompt: string;
  isValidCharacter: boolean;
}> {
  try {
    // For very short descriptions, skip enrichment to save time
    if (userDescription && userDescription.length > 50) {
      return {
        enhancedDescription: userDescription,
        avatarPrompt: `A portrait of ${name}, who is ${userDescription}. Detailed, high quality.`,
        isValidCharacter: true,
      };
    }

    const client = getOpenAIClient();
    
    // Use a more concise prompt for faster response
    const systemPrompt = `Enrich character descriptions briefly and generate avatar prompts.`;

    const userPrompt = `Name: "${name}"
${userDescription ? `Description: "${userDescription}"` : "No description."}

Return JSON with:
- enhancedDescription: 1-2 sentence description
- avatarPrompt: visual portrait prompt
- isValidCharacter: false if inappropriate`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the faster model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for faster response
      max_tokens: 250, // Limit tokens for faster response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in response");
    }
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(content);
    return {
      enhancedDescription: parsedResponse.enhancedDescription || userDescription || `A character named ${name}`,
      avatarPrompt: parsedResponse.avatarPrompt || `A portrait of ${name}`,
      isValidCharacter: parsedResponse.isValidCharacter !== false,
    };
  } catch (error) {
    console.error("Error in fast character enrichment:", error);
    
    // Return basic info without waiting for API
    return {
      enhancedDescription: userDescription || `A character named ${name}`,
      avatarPrompt: `A portrait of ${name}`,
      isValidCharacter: true,
    };
  }
}

/**
 * Generates faster, more concise instructions for a character
 */
export async function generateQuickInstructions(name: string, description: string): Promise<string> {
  try {
    const client = getOpenAIClient();

    // Use a more compact prompt structure
    const prompt = `Create brief roleplay instructions for AI to act as "${name}". Description: "${description}". Include personality, speech style, knowledge limits. Keep under 300 words.`;

    const response = await client.completions.create({
      model: "gpt-3.5-turbo-instruct", // This can be faster for this use case
      prompt,
      max_tokens: 400,
      temperature: 0.4,
    });

    const instructions = response.choices[0]?.text;
    if (!instructions) {
      throw new Error("No instructions generated");
    }

    return instructions;
  } catch (error) {
    console.error("Error generating quick instructions:", error);
    
    // Return basic instructions as fallback
    return `You are ${name}. ${description}. Respond as this character would, maintaining their tone and personality throughout the conversation.`;
  }
}
