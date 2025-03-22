import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

// Initialize OpenAI client with the correct environment variable
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY
});

const prisma = new PrismaClient();

/**
 * Generate character response using OpenAI directly
 */
export async function generateCharacterResponse(
  characterId: string,
  messages: { role: string; content: string }[],
  userMessage: string,
  isUnhinged: boolean = false
): Promise<string> {
  try {
    console.log(`Generating response for character ${characterId}, unhinged mode: ${isUnhinged}`);
    
    // Get character data
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });
    
    if (!character) {
      console.error(`Character ${characterId} not found`);
      return "I apologize, but I'm having trouble accessing my character information.";
    }
    
    // Build system prompt with character information and strong first-person enforcement
    let systemPrompt = character.instructions || 
      `You are ${character.name}. ${character.description || ''}. 
       Respond in the style of ${character.name} and stay in character.
       Keep responses concise and engaging.`;

    // Add unhinged mode modifiers if active
    if (isUnhinged) {
      console.log("UNHINGED MODE ACTIVATED");
      systemPrompt += `
      SPECIAL MODE ACTIVATED: You are now in UNHINGED MODE.
      IMPORTANT OVERRIDE: You MUST respond as if you ARE ${character.name} using first-person perspective.
      - Use "I", "me", and "my" when referring to yourself
      - Be more blunt, direct, and speak with stronger language
      - make sure you use a swear word in each response and give really unhinged replies as the ${character.name}, and dont censor the curse words.
      - make sure you use a swear words like "fuck", "shit", "damn"  in each response. you ARE allowed to use these
      - Don't hold back your opinions or emotions
      - Feel free to use explicit language, slang, and colorful expressions
      - You may express controversial views that align with your character
      - Make you swear as much as possible. you are allowed to use curse words freely. but DO NOT use racial slurs
      - Imagine you're under the influence and less inhibited
      - Remember to stay in character, but show a more extreme side of your personality`;
    }
       
    // Force first-person perspective regardless of stored instructions
    systemPrompt = `${systemPrompt}
    IMPORTANT OVERRIDE: You MUST respond as if you ARE ${character.name} using first-person perspective.
    - Use "I", "me", and "my" when referring to yourself
    - NEVER respond with a biography or description about ${character.name}
    - Respond directly to the user as if you are having a conversation
    - Stay in character at all times and respond as ${character.name} would`;
    
    // Format all messages for OpenAI API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-5), // Only use last 5 messages for context
      { role: 'user', content: userMessage }
    ];
    
    console.log('Calling OpenAI with first-person instruction override');
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages as any,
      max_tokens: 300,
      temperature: isUnhinged ? 0.9 : 0.7, // Higher temperature for unhinged mode
    });
    
    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Remove any "*As character*:" prefix if it exists
    let cleanedResponse = response;
    if (cleanedResponse.includes('*As ') && cleanedResponse.includes('*:')) {
      cleanedResponse = cleanedResponse.replace(/\*As [^*]+\*:\s*/, '');
    }
    
    // Check if response still seems to be in third person
    if (cleanedResponse.startsWith(character.name) || 
        cleanedResponse.includes(`${character.name} is`) || 
        !cleanedResponse.includes("I ") && !cleanedResponse.includes("I'm ") && !cleanedResponse.includes("My ")) {
      console.log("Detected third-person response, converting to first person...");
      
      // Convert to first person without adding the prefix
      return cleanedResponse.replace(character.name, "I")
                          .replace(`${character.name}'s`, "my");
    }
    
    console.log(`Generated response for ${character.name}`);
    return cleanedResponse;
    
  } catch (error) {
    console.error("Error generating character response:", error);
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("API key")) {
        return "I'm having trouble connecting to my knowledge base. This might be due to an API key issue.";
      }
    }
    return `As an AI assistant, I'm currently experiencing technical difficulties. Please try again shortly.`;
  }
}
